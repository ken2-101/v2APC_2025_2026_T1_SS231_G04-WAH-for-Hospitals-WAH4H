"""
patients/urls.py

URL Configuration for Patients Module.
Registers ViewSets for Patient registration, clinical conditions, allergies, and immunizations.

Routes:
- /api/patients/
- /api/patients/conditions/
- /api/patients/allergies/
- /api/patients/immunizations/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from patients.api.views import (
    PatientViewSet,
    ConditionViewSet,
    AllergyViewSet,
    ImmunizationViewSet,
    fetch_wah4pc,
    webhook_receive,
    send_to_wah4pc,
    webhook_process_query,
    list_transactions,
    get_transaction,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'', PatientViewSet, basename='patient')
router.register(r'conditions', ConditionViewSet, basename='condition')
router.register(r'allergies', AllergyViewSet, basename='allergy')
router.register(r'immunizations', ImmunizationViewSet, basename='immunization')

# URL patterns
urlpatterns = [
    path('wah4pc/fetch', fetch_wah4pc),
    path('wah4pc/send', send_to_wah4pc),
    path('wah4pc/transactions/', list_transactions),
    path('wah4pc/transactions/<str:transaction_id>/', get_transaction),
    path('webhooks/receive', webhook_receive),
    path('webhooks/process-query', webhook_process_query),
    path('', include(router.urls)),
]