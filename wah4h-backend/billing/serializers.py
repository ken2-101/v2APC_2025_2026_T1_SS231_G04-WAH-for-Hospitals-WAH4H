from rest_framework import serializers
from .models import BillingRecord, MedicineItem, DiagnosticItem, Payment


class MedicineItemSerializer(serializers.ModelSerializer):
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = MedicineItem
        fields = ['id', 'name', 'dosage', 'quantity', 'unit_price', 'total_cost']


class DiagnosticItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiagnosticItem
        fields = ['id', 'name', 'cost']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'billing_record', 'amount', 'payment_method',
            'or_number', 'cashier', 'payment_date', 'created_at'
        ]
        read_only_fields = ['created_at']


class BillingRecordSerializer(serializers.ModelSerializer):
    medicines = MedicineItemSerializer(many=True, required=False)
    diagnostics = DiagnosticItemSerializer(many=True, required=False)
    payments = PaymentSerializer(many=True, read_only=True)
    
    # Computed fields
    total_room_charge = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_professional_fees = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_dietary_charge = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    running_balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payment_status = serializers.CharField(read_only=True)
    
    class Meta:
        model = BillingRecord
        fields = [
            'id', 'patient', 'admission', 'patient_name', 'hospital_id',
            'admission_date', 'discharge_date', 'room_ward',
            'room_type', 'number_of_days', 'rate_per_day',
            'attending_physician_fee', 'specialist_fee', 'surgeon_fee',
            'other_professional_fees',
            'diet_type', 'meals_per_day', 'diet_duration', 'cost_per_meal',
            'supplies_charge', 'procedure_charge', 'nursing_charge',
            'miscellaneous_charge',
            'discount', 'philhealth_coverage',
            'is_senior', 'is_pwd', 'is_philhealth_member',
            'is_finalized', 'finalized_date',
            'medicines', 'diagnostics', 'payments',
            'total_room_charge', 'total_professional_fees',
            'total_dietary_charge', 'subtotal', 'total_amount',
            'running_balance', 'payment_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        medicines_data = validated_data.pop('medicines', [])
        diagnostics_data = validated_data.pop('diagnostics', [])
        
        billing_record = BillingRecord.objects.create(**validated_data)
        
        for medicine_data in medicines_data:
            MedicineItem.objects.create(billing_record=billing_record, **medicine_data)
        
        for diagnostic_data in diagnostics_data:
            DiagnosticItem.objects.create(billing_record=billing_record, **diagnostic_data)
        
        return billing_record
    
    def update(self, instance, validated_data):
        medicines_data = validated_data.pop('medicines', None)
        diagnostics_data = validated_data.pop('diagnostics', None)
        
        # Update billing record fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update medicines if provided
        if medicines_data is not None:
            # Delete existing medicines
            instance.medicines.all().delete()
            # Create new medicines
            for medicine_data in medicines_data:
                MedicineItem.objects.create(billing_record=instance, **medicine_data)
        
        # Update diagnostics if provided
        if diagnostics_data is not None:
            # Delete existing diagnostics
            instance.diagnostics.all().delete()
            # Create new diagnostics
            for diagnostic_data in diagnostics_data:
                DiagnosticItem.objects.create(billing_record=instance, **diagnostic_data)
        
        return instance


class BillingDashboardSerializer(serializers.ModelSerializer):
    """Simplified serializer for billing dashboard list view"""
    patient_name = serializers.CharField()
    encounter_id = serializers.CharField(source='hospital_id')
    running_balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payment_status = serializers.CharField(read_only=True)
    last_or_date = serializers.SerializerMethodField()
    room = serializers.CharField(source='room_ward')
    
    class Meta:
        model = BillingRecord
        fields = [
            'id', 'patient_name', 'encounter_id', 'running_balance',
            'payment_status', 'last_or_date', 'room'
        ]
    
    def get_last_or_date(self, obj):
        last_payment = obj.payments.first()  # already ordered by date desc
        return last_payment.payment_date.isoformat() if last_payment else None
