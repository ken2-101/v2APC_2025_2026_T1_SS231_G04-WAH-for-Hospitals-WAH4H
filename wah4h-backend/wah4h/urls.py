from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Accounts
    path('accounts/', include('accounts.urls')),

    # Patients module
    path('api/', include('patients.urls')),

    # Admissions module
    path('api/admission/', include('admission.urls')),

    # Monitoring module
    path('api/monitoring/', include('monitoring.urls')),  # <- added

    # Discharge module
    path('api/discharge/', include('discharge.urls')),

    # project/urls.py
    path('api/pharmacy/', include('pharmacy.urls')),

    # Laboratory module
    path('api/laboratory/', include('laboratory.urls')), # added lab

    # Billing module
    path('api/billing/', include('billing.urls')),
]
