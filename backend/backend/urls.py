from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/patients/', include('patients.urls')),  # patient API
    path('', lambda request: JsonResponse({'message': 'Backend is running'})),  # root endpoint
]
