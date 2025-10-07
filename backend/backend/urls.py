from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home(request):
    return HttpResponse("WAH4H Backend is running 🚀")

urlpatterns = [
    path('', home),
    path('admin/', admin.site.urls),
    path('api/patients/', include('patients.urls')),
]
