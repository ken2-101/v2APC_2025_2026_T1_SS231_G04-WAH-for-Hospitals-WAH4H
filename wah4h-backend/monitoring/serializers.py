# monitoring/serializers.py
from rest_framework import serializers
from .models import Patient, VitalSign, ClinicalNote, DietaryOrder, HistoryEvent

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

class PatientSerializer(serializers.ModelSerializer):
    vitals = VitalSignSerializer(many=True, read_only=True)
    notes = ClinicalNoteSerializer(many=True, read_only=True)
    dietary_orders = DietaryOrderSerializer(many=True, read_only=True)
    history = HistoryEventSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = "__all__"
