from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginAPIView,
    RegisterAPIView,
    PractitionerRegistrationAPIView,
    OrganizationCreateAPIView,
    LocationCreateAPIView,
)

urlpatterns = [
    # Authentication
    path("login/", LoginAPIView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    
    # Registration (Service Layer Pattern)
    path("register/practitioner/", PractitionerRegistrationAPIView.as_view(), name="register_practitioner"),
    
    # Legacy registration (deprecated)
    path("register/", RegisterAPIView.as_view(), name="register"),
    
    # Organization & Location Management
    path("organizations/create/", OrganizationCreateAPIView.as_view(), name="organization_create"),
    path("locations/create/", LocationCreateAPIView.as_view(), name="location_create"),
]
