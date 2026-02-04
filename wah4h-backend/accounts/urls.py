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

from accounts.api.views import (
    OrganizationViewSet,
    LocationViewSet,
    PractitionerViewSet,
    PractitionerRoleViewSet,
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
]

