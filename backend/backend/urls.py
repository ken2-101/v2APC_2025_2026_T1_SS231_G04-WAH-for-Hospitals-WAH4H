from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),

    # Patient API
    path('api/patients/', include('patients.urls')),  # makes /api/patients/ point to patients.urls

    # Root endpoint
    path('', lambda request: JsonResponse({'message': 'Backend is running'})),

    # Optional: catch-all endpoint for unmatched URLs
    path('<path:unused>', lambda request, unused: JsonResponse({'error': 'Endpoint not found'}, status=404)),
]
