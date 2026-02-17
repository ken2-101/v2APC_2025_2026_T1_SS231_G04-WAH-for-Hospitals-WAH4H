from rest_framework import serializers
from .models import Discharge, Procedure
from django.db import connection


class DischargeSerializer(serializers.ModelSerializer):
    """Complete discharge record serializer"""
    
    class Meta:
        model = Discharge
        fields = '__all__'
        

class PendingDischargeSerializer(serializers.ModelSerializer):
    """Serializer for pending discharge patients with additional computed fields"""
    patientName = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    physician = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    admissionDate = serializers.SerializerMethodField()
    estimatedDischarge = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    
    class Meta:
        model = Discharge
        fields = [
            'discharge_id', 'encounter_id', 'patient_id', 'workflow_status',
            'patientName', 'room', 'physician', 'department', 'age',
            'admissionDate', 'estimatedDischarge', 'condition', 
            'requirements', 'created_at', 'updated_at'
        ]
    
    def get_patientName(self, obj):
        # Query patient name from patient table using patient_id (PK)
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT first_name, last_name FROM patient WHERE id = %s",
                    [obj.patient_id]
                )
                row = cursor.fetchone()
                if row:
                    return f"{row[0]} {row[1]}"
        except Exception:
            pass
        return f"Patient {obj.patient_id}"
    
    def get_room(self, obj):
        # Query room from encounter location
        try:
            with connection.cursor() as cursor:
                # Join encounter with location table
                cursor.execute(
                    """
                    SELECT l.name 
                    FROM encounter e
                    LEFT JOIN location l ON e.location_id = l.location_id
                    WHERE e.encounter_id = %s
                    """,
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    return row[0]
        except Exception:
            pass
        return "N/A"
    
    def get_physician(self, obj):
        # Query physician from encounter JOIN practitioner
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT p.first_name, p.last_name 
                    FROM encounter e
                    LEFT JOIN practitioner p ON e.participant_individual_id = p.practitioner_id
                    WHERE e.encounter_id = %s
                    """,
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row:
                    return f"Dr. {row[0]} {row[1]}"
        except Exception:
            pass
        return obj.created_by or "Unknown"
    
    def get_department(self, obj):
        # Query department from encounter service_type OR organization
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT o.name, e.service_type
                    FROM encounter e
                    LEFT JOIN organization o ON e.service_provider_id = o.organization_id
                    WHERE e.encounter_id = %s
                    """,
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row:
                    # Prefer organization name, fallback to service_type
                    if row[0]:
                        return row[0]
                    if row[1]:
                        return row[1]
        except Exception:
            pass
        return "General"
    
    def get_age(self, obj):
        # Query age from patient birth date
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT birthdate FROM patient WHERE id = %s",
                    [obj.patient_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    from datetime import date
                    today = date.today()
                    birth_date = row[0]
                    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                    return age
        except Exception:
            pass
        return 0
    
    def get_admissionDate(self, obj):
        # Query admission date from encounter
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT period_start FROM encounter WHERE encounter_id = %s",
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    return str(row[0])
        except Exception:
            pass
        return ""
    
    def get_estimatedDischarge(self, obj):
        # For now, return empty - can be calculated based on admission + avg stay
        return ""
    
    def get_condition(self, obj):
        # Query condition from encounter
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT reason_code FROM encounter WHERE encounter_id = %s",
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    return row[0]
        except Exception:
            pass
        return "Stable"


class DischargedPatientSerializer(serializers.ModelSerializer):
    """Serializer for discharged patients"""
    patientName = serializers.SerializerMethodField()
    room = serializers.SerializerMethodField()
    physician = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    admissionDate = serializers.SerializerMethodField()
    dischargeDate = serializers.DateTimeField(source='discharge_datetime')
    condition = serializers.SerializerMethodField()
    finalDiagnosis = serializers.CharField(source='final_diagnosis')
    hospitalStaySummary = serializers.CharField(source='summary_of_stay')
    dischargeInstructions = serializers.CharField(source='discharge_instructions')
    followUpRequired = serializers.SerializerMethodField()
    followUpPlan = serializers.CharField(source='follow_up_plan')
    
    class Meta:
        model = Discharge
        fields = [
            'discharge_id', 'patientName', 'room', 'physician', 'department',
            'age', 'admissionDate', 'dischargeDate', 'condition',
            'finalDiagnosis', 'hospitalStaySummary', 'dischargeInstructions', 
            'followUpRequired', 'followUpPlan'
        ]
    
    def get_patientName(self, obj):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT first_name, last_name FROM patient WHERE id = %s",
                    [obj.patient_id]
                )
                row = cursor.fetchone()
                if row:
                    return f"{row[0]} {row[1]}"
        except Exception:
            pass
        return f"Patient {obj.patient_id}"
    
    def get_room(self, obj):
        try:
            with connection.cursor() as cursor:
                # Join encounter with location table
                cursor.execute(
                    """
                    SELECT l.name 
                    FROM encounter e
                    LEFT JOIN location l ON e.location_id = l.location_id
                    WHERE e.encounter_id = %s
                    """,
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    return row[0]
        except Exception:
            pass
        return "N/A"
    
    def get_physician(self, obj):
        try:
            with connection.cursor() as cursor:
                # Try getting physician from discharge record first (if set manually)
                if obj.physician_id:
                    cursor.execute(
                        "SELECT first_name, last_name FROM practitioner WHERE practitioner_id = %s",
                        [obj.physician_id]
                    )
                    row = cursor.fetchone()
                    if row:
                        return f"Dr. {row[0]} {row[1]}"
                
                # Fallback to encounter participant
                cursor.execute(
                    """
                    SELECT p.first_name, p.last_name 
                    FROM encounter e
                    LEFT JOIN practitioner p ON e.participant_individual_id = p.practitioner_id
                    WHERE e.encounter_id = %s
                    """,
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row:
                    return f"Dr. {row[0]} {row[1]}"
        except Exception:
            pass
        return obj.created_by or "Unknown"
    
    def get_department(self, obj):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT o.name, e.service_type
                    FROM encounter e
                    LEFT JOIN organization o ON e.service_provider_id = o.organization_id
                    WHERE e.encounter_id = %s
                    """,
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row:
                    if row[0]: return row[0]
                    if row[1]: return row[1]
        except Exception:
            pass
        return "General"
    
    def get_age(self, obj):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT birthdate FROM patient WHERE id = %s",
                    [obj.patient_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    from datetime import date
                    today = date.today()
                    birth_date = row[0]
                    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                    return age
        except Exception:
            pass
        return 0
    
    def get_admissionDate(self, obj):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT period_start FROM encounter WHERE encounter_id = %s",
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    return str(row[0])
        except Exception:
            pass
        return ""
    
    def get_condition(self, obj):
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT reason_code FROM encounter WHERE encounter_id = %s",
                    [obj.encounter_id]
                )
                row = cursor.fetchone()
                if row and row[0]:
                    return row[0]
        except Exception:
            pass
        return "Stable"
    
    def get_followUpRequired(self, obj):
        return bool(obj.follow_up_plan)
