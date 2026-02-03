from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ObservationViewSet,
    ChargeItemViewSet,
    ChargeItemDefinitionViewSet
)

app_name = 'monitoring'

router = DefaultRouter()
router.register(r'observations', ObservationViewSet, basename='observation')
router.register(r'charge-items', ChargeItemViewSet, basename='chargeitem')
router.register(r'charge-item-definitions', ChargeItemDefinitionViewSet, basename='chargeitemdefinition')

urlpatterns = [
    path('', include(router.urls)),
]