"""Session login for the client portal.

Sessions rather than tokens, because the website proxies /api/* to this service
on the same origin. That means Django's session cookie is first-party and
httpOnly, so the browser never hands the credential to JavaScript.

The price of sessions is CSRF. Call /api/auth/csrf/ once to receive the cookie,
then send its value back in the X-CSRFToken header on login and logout.
"""

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .serializers import ClientAccountSerializer

User = get_user_model()


class LoginThrottle(AnonRateThrottle):
    """Slows down password guessing against the portal."""

    scope = "login"


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
