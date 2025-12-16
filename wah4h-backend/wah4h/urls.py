from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Include accounts app URLs
    path('accounts/', include('accounts.urls')),
    path('api/', include('patients.urls')),
]
