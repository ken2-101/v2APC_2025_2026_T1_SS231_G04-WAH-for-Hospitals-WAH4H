from rest_framework import serializers
from .models import VitalSign, ClinicalNote, DietaryOrder, HistoryEvent

class VitalSignSerializer(serializers.ModelSerializer):
    class Meta:
        model = VitalSign
        fields = "__all__"

class ClinicalNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalNote
        fields = "__all__"

class DietaryOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietaryOrder
        fields = "__all__"

class HistoryEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoryEvent
        fields = "__all__"
