from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Accounts
    path('accounts/', include('accounts.urls')),

    # Patients module
    path('api/', include('patients.urls')),

    # Admissions module
    path('api/admissions/', include('admissions.urls')),
]
