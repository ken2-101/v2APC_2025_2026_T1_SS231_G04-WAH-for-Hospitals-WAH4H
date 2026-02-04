"""
monitoring/urls.py

URL Configuration for Monitoring Module.
Registers ViewSets for clinical observations (vital signs, labs) and charge items.

Routes:
- /api/monitoring/observations/
- /api/monitoring/charge-items/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from monitoring.api.views import (
    ObservationViewSet,
    ChargeItemViewSet,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'observations', ObservationViewSet, basename='observation')
router.register(r'charge-items', ChargeItemViewSet, basename='charge-item')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]