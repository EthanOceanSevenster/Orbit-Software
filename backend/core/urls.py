from django.urls import path

from . import auth_views, billing_views, service_views, staff_views, views

urlpatterns = [
    path("health/", views.health, name="health"),
    # Client portal session auth
    path("auth/csrf/", auth_views.CsrfView.as_view(), name="auth-csrf"),
    path("auth/login/", auth_views.LoginView.as_view(), name="auth-login"),
    path("auth/register/", auth_views.RegisterView.as_view(), name="auth-register"),
    path("auth/logout/", auth_views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", auth_views.MeView.as_view(), name="auth-me"),
    # The owner's dashboard. Staff only.
    path("staff/overview/", staff_views.StaffOverviewView.as_view(), name="staff-overview"),
    # Extra work a signed-in client asks for
    path(
        "service-requests/",
        service_views.ServiceRequestListCreateView.as_view(),
        name="service-request-list",
    ),
    # Billing
    path("billing/invoices/", billing_views.InvoiceListView.as_view(), name="invoice-list"),
    path(
        "billing/invoices/<int:pk>/pay/",
        billing_views.InvoicePayView.as_view(),
        name="invoice-pay",
    ),
    path(
        "billing/paystack/webhook/",
        billing_views.PaystackWebhookView.as_view(),
        name="paystack-webhook",
    ),
    path(
        "billing/paystack/return/",
        billing_views.PaystackReturnView.as_view(),
        name="paystack-return",
    ),
    path("plans/", views.PlanListView.as_view(), name="plan-list"),
    path("plans/<slug:slug>/", views.PlanDetailView.as_view(), name="plan-detail"),
    path("addons/", views.AddOnListView.as_view(), name="addon-list"),
    path("contact/", views.ContactInquiryCreateView.as_view(), name="contact-create"),
    path(
        "project-requests/",
        views.ProjectRequestCreateView.as_view(),
        name="project-request-create",
    ),
]
