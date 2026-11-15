from django.urls import path

from . import (
    auth_views,
    billing_views,
    payfast_views,
    service_views,
    staff_client_views,
    staff_views,
    views,
)

urlpatterns = [
    path("health/", views.health, name="health"),
    # Client portal session auth
    path("auth/csrf/", auth_views.CsrfView.as_view(), name="auth-csrf"),
    path("auth/login/", auth_views.LoginView.as_view(), name="auth-login"),
    path("auth/register/", auth_views.RegisterView.as_view(), name="auth-register"),
    path("auth/logout/", auth_views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", auth_views.MeView.as_view(), name="auth-me"),
    # Answers for anybody, so the header can ask without logging an error in
    # every signed-out visitor's console.
    path("auth/session/", auth_views.SessionView.as_view(), name="auth-session"),
    # The owner's dashboard. Staff only.
    path(
        "staff/clients/create/",
        staff_client_views.StaffClientCreateView.as_view(),
        name="staff-client-create",
    ),
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
        "billing/invoices/<int:pk>/",
        billing_views.InvoiceDetailView.as_view(),
        name="invoice-detail",
    ),
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
        "billing/payfast/start/",
        payfast_views.PayfastStartView.as_view(),
        name="payfast-start",
    ),
    path(
        "billing/payfast/notify/",
        payfast_views.PayfastNotifyView.as_view(),
        name="payfast-notify",
    ),
    path(
        "billing/payfast/return/",
        payfast_views.PayfastReturnView.as_view(),
        name="payfast-return",
    ),
    path("billing/card/", payfast_views.SavedCardView.as_view(), name="saved-card"),
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
