from rest_framework import serializers
from .models import Observation, ChargeItem, NutritionOrder

class ObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = '__all__'

class ChargeItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeItem
        fields = '__all__'

class NutritionOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionOrder
        fields = '__all__'