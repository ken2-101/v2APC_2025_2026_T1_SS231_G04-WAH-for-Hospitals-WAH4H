"""
accounts/urls.py

URL Configuration for Accounts Module.
Registers ViewSets for Organization, Location, Practitioner, and PractitionerRole management.

Routes:
- /api/accounts/organizations/
- /api/accounts/locations/
- /api/accounts/practitioners/
- /api/accounts/practitioner-roles/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from rest_framework_simplejwt.views import TokenRefreshView
from accounts.api.views import (
    OrganizationViewSet,
    LocationViewSet,
    PractitionerViewSet,
    PractitionerRoleViewSet,
    LoginView,
    RegisterView,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'practitioners', PractitionerViewSet, basename='practitioner')
router.register(r'practitioner-roles', PractitionerRoleViewSet, basename='practitioner-role')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
    
    # Auth Endpoints
    path('login/', LoginView.as_view(), name='auth_login'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

