"""Session login for the client portal.

Sessions rather than tokens, because the website proxies /api/* to this service
on the same origin. That means Django's session cookie is first-party and
httpOnly, so the browser never hands the credential to JavaScript.

The price of sessions is CSRF. Call /api/auth/csrf/ once to receive the cookie,
then send its value back in the X-CSRFToken header on login and logout.
"""

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError, transaction
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .models import ClientAccount
from .notifications import notify_new_submission
from .serializers import ClientAccountSerializer, RegisterSerializer

User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    """Slows down password guessing against the portal."""

    scope = "login"


class RegisterThrottle(AnonRateThrottle):
    """Caps sign-ups from one network.

    Registration necessarily says whether an address is already taken, so this
    is also what stops that being used to walk a list of addresses.
    """

    scope = "register"


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"}, trim_whitespace=False)


def _account_payload(user) -> dict:
    account = getattr(user, "client_account", None)
    if account is None:
        return {"has_account": False, "name": user.get_full_name() or user.get_username()}
    data = ClientAccountSerializer(account).data
    data["has_account"] = True
    return data


@method_decorator(ensure_csrf_cookie, name="get")
class CsrfView(APIView):
    """Hands out the CSRF cookie before a login attempt."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"csrfToken": get_token(request)})


# DRF wraps every APIView in csrf_exempt, and SessionAuthentication only
# enforces CSRF once a user is already authenticated. A login POST arrives
# anonymous, so without this decorator the token the browser sends is never
# checked, and a third-party page could sign a visitor into an account of the
# attacker's choosing.
@method_decorator(csrf_protect, name="post")
class LoginView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identifier = serializer.validated_data["email"].strip()
        password = serializer.validated_data["password"]

        # Clients sign in with their email address, but Django authenticates on
        # username. Look the username up first, then fall back to treating the
        # input as a username so an admin account can sign in too.
        username = identifier
        match = User.objects.filter(email__iexact=identifier).first()
        if match is not None:
            username = match.get_username()

        user = authenticate(request, username=username, password=password)
        if user is None:
            # Deliberately vague: saying which half was wrong tells an attacker
            # whether an address is registered.
            return Response(
                {"detail": "Those details do not match an account."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)
        return Response(_account_payload(user))


class LogoutView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """The signed-in client's own account. 401 when not signed in."""

    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_account_payload(request.user))


# Same reasoning as LoginView: DRF exempts every APIView from CSRF, and this
# request arrives anonymous, so the decorator is what makes the token count.
@method_decorator(csrf_protect, name="post")
class RegisterView(APIView):
    """Creates a login and an empty account for someone signing themselves up.

    The account is created pending, with no plan and nothing owed. Everything
    that costs money is still set by us in the admin, so self-registering gets
    a visitor a place to talk to us from and nothing more.
    """

    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [RegisterThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        name = data["name"].strip()
        email = data["email"]
        parts = name.split()

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=data["password"],
                    first_name=parts[0] if parts else "",
                    last_name=" ".join(parts[1:]) if len(parts) > 1 else "",
                )
                account = ClientAccount.objects.create(
                    user=user,
                    company_name=(data.get("company_name") or "").strip() or name,
                    status=ClientAccount.Status.PENDING,
                )
        except IntegrityError:
            # Two sign-ups for the same address at the same moment: both clear
            # the uniqueness check, then the second one loses the race at the
            # database. Answer it the same way the check would have.
            return Response(
                {"email": ["That email already has an account. Try signing in instead."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Signs them straight in, which also rotates the session key.
        login(request, user)

        notify_new_submission(
            subject=f"New portal sign-up: {account.company_name}",
            body="\n".join(
                [
                    f"Name: {name}",
                    f"Email: {email}",
                    f"Company: {account.company_name}",
                    "",
                    "They created the account themselves from the website. It is",
                    "pending until you give it a plan in the admin.",
                ]
            ),
            reply_to=email,
        )

        return Response(_account_payload(user), status=status.HTTP_201_CREATED)
