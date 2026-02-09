"""
billing/urls.py

URL Configuration for Billing Module.
Registers ViewSets for billing accounts, invoices, insurance claims, and payment reconciliation.

Routes:
- /api/billing/accounts/
- /api/billing/invoices/
- /api/billing/claims/
- /api/billing/payments/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from billing.api.views import (
    AccountViewSet,
    InvoiceViewSet,
    ClaimViewSet,
    PaymentReconciliationViewSet,
    BillingRecordViewSet,
)

# Initialize router
router = DefaultRouter()

# Register ViewSets with specific route prefixes
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'claims', ClaimViewSet, basename='claim')
router.register(r'payments', PaymentReconciliationViewSet, basename='payment')
router.register(r'billing-records', BillingRecordViewSet, basename='billing-record')

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
]