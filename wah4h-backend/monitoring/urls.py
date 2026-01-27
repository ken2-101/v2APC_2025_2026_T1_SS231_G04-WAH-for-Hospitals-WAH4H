from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ObservationViewSet, ChargeItemViewSet, NutritionOrderViewSet

router = DefaultRouter()
router.register(r'observations', ObservationViewSet)
router.register(r'charge-items', ChargeItemViewSet)
router.register(r'nutrition-orders', NutritionOrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]