from django.urls import path, include
from rest_framework.routers import DefaultRouter

from accounts.api.views import (
    OrganizationViewSet,
    LocationViewSet,
    PractitionerViewSet,
    PractitionerRoleViewSet,
)

router = DefaultRouter()

router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'practitioners', PractitionerViewSet, basename='practitioner')
router.register(r'practitioner-roles', PractitionerRoleViewSet, basename='practitioner-role')

urlpatterns = [

    path('', include(router.urls)),
]

