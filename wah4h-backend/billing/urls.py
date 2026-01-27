from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, 
    ClaimViewSet, 
    InvoiceViewSet, 
    PaymentReconciliationViewSet, 
    PaymentNoticeViewSet
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'claims', ClaimViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'payment-reconciliations', PaymentReconciliationViewSet)
router.register(r'payment-notices', PaymentNoticeViewSet)

urlpatterns = [
    path('', include(router.urls)),
]