from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BillingRecordViewSet,
    MedicineItemViewSet,
    DiagnosticItemViewSet,
    PaymentViewSet
)

router = DefaultRouter()
router.register(r'billing-records', BillingRecordViewSet, basename='billing-record')
router.register(r'medicines', MedicineItemViewSet, basename='medicine')
router.register(r'diagnostics', DiagnosticItemViewSet, basename='diagnostic')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
