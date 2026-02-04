"""
Patient App URL Configuration
==============================
Fortress Pattern: API endpoints for patient resources.

All endpoints use ViewSets with ACL-backed serializers.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from patients.api.views import (
    PatientViewSet,
    ConditionViewSet,
    AllergyViewSet,
    ImmunizationViewSet,
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'conditions', ConditionViewSet, basename='condition')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'immunizations', ImmunizationViewSet, basename='immunization')

urlpatterns = [
    path('', include(router.urls)),
]