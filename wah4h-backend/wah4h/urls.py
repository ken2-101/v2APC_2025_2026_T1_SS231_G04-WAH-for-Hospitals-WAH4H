"""
wah4h/urls.py

Project-Level URL Configuration for Hospital Information System.
Configures API routing for all 8 core modules using REST Framework routers.

API Structure:
- /api/accounts/         - Organization, Location, Practitioner, PractitionerRole management
- /api/patients/         - Patient registration and clinical data
- /api/admission/        - Patient encounters (admissions) and procedures
- /api/pharmacy/         - Medication inventory, requests, and administration
- /api/laboratory/       - Laboratory test definitions and diagnostic reports
- /api/monitoring/       - Clinical observations and charge items
- /api/billing/          - Billing accounts, invoices, claims, and payments
- /api/discharge/        - Discharge workflow and procedures
- /admin/                - Django Admin interface
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # ============================================================================
    # API ENDPOINTS - 8 Core Modules
    # ============================================================================

    # Accounts Module
    path('api/accounts/', include('accounts.urls')),

    # Patients Module
    path('api/patients/', include('patients.urls')),

    # Admission Module
    path('api/admission/', include('admission.urls')),

    # Pharmacy Module
    path('api/pharmacy/', include('pharmacy.urls')),

    # Laboratory Module
    path('api/laboratory/', include('laboratory.urls')),

    # Monitoring Module
    path('api/monitoring/', include('monitoring.urls')),

    # Billing Module
    path('api/billing/', include('billing.urls')),

    # Discharge Module
    path('api/discharge/', include('discharge.urls')),
]
