from rest_framework import viewsets
from .models import Observation, ChargeItem, NutritionOrder
from .serializers import ObservationSerializer, ChargeItemSerializer, NutritionOrderSerializer

class ObservationViewSet(viewsets.ModelViewSet):
    queryset = Observation.objects.all()
    serializer_class = ObservationSerializer

class ChargeItemViewSet(viewsets.ModelViewSet):
    queryset = ChargeItem.objects.all()
    serializer_class = ChargeItemSerializer

class NutritionOrderViewSet(viewsets.ModelViewSet):
    queryset = NutritionOrder.objects.all()
    serializer_class = NutritionOrderSerializer