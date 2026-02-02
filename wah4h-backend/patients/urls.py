# patients/urls.py
"""
URL Configuration for Patients App
Registers all Patient and Clinical ViewSets with DefaultRouter

Endpoints:
- /api/patients/ - Patient management
- /api/conditions/ - Condition management
- /api/allergies/ - Allergy/Intolerance management
- /api/immunizations/ - Immunization management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from patients.views import (
    PatientViewSet,
    ConditionViewSet,
    AllergyIntoleranceViewSet,
    ImmunizationViewSet
)

# Initialize router
router = DefaultRouter()

# Register ViewSets
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'conditions', ConditionViewSet, basename='condition')
router.register(r'allergies', AllergyIntoleranceViewSet, basename='allergy')
router.register(r'immunizations', ImmunizationViewSet, basename='immunization')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]
