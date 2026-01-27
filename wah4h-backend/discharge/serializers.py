from rest_framework import serializers
from .models import Discharge

class DischargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discharge
        fields = '__all__'