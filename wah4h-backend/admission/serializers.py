from rest_framework import serializers
from .models import Encounter, Procedure, ProcedurePerformer

class EncounterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encounter
        fields = '__all__'

class ProcedureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procedure
        fields = '__all__'

class ProcedurePerformerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcedurePerformer
        fields = '__all__'