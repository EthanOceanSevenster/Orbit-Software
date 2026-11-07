from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
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
