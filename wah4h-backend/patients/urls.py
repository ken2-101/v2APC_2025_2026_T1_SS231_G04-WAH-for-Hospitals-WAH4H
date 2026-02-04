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

# Create router and register viewsets
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'conditions', ConditionViewSet, basename='condition')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'immunizations', ImmunizationViewSet, basename='immunization')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]

"""
Available Endpoints:

PATIENTS:
    GET    /api/patients/                 - List all patients
    POST   /api/patients/                 - Create patient
    GET    /api/patients/{id}/            - Get patient details
    PUT    /api/patients/{id}/            - Update patient
    PATCH  /api/patients/{id}/            - Partial update patient
    DELETE /api/patients/{id}/            - Delete patient
    GET    /api/patients/search/?q=term   - Search patients
    GET    /api/patients/{id}/conditions/ - Get patient conditions
    GET    /api/patients/{id}/allergies/  - Get patient allergies

CONDITIONS:
    GET    /api/conditions/               - List all conditions
    POST   /api/conditions/               - Create condition
    GET    /api/conditions/{id}/          - Get condition details
    PUT    /api/conditions/{id}/          - Update condition
    PATCH  /api/conditions/{id}/          - Partial update condition
    DELETE /api/conditions/{id}/          - Delete condition

ALLERGIES:
    GET    /api/allergies/                - List all allergies
    POST   /api/allergies/                - Create allergy
    GET    /api/allergies/{id}/           - Get allergy details
    PUT    /api/allergies/{id}/           - Update allergy
    PATCH  /api/allergies/{id}/           - Partial update allergy
    DELETE /api/allergies/{id}/           - Delete allergy

IMMUNIZATIONS:
    GET    /api/immunizations/            - List all immunizations
    POST   /api/immunizations/            - Create immunization
    GET    /api/immunizations/{id}/       - Get immunization details
    PUT    /api/immunizations/{id}/       - Update immunization
    PATCH  /api/immunizations/{id}/       - Partial update immunization
    DELETE /api/immunizations/{id}/       - Delete immunization

Search & Filter Examples:
    - Search: /api/patients/search/?q=Juan&limit=10
    - Filter: /api/patients/?gender=Male
    - Search conditions: /api/conditions/?patient=1&clinical_status=active
    - Search allergies: /api/allergies/?patient=1&criticality=high
"""
