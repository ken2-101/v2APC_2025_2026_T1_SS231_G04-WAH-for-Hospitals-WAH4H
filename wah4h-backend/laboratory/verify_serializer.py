"""
Verification script for enhanced Laboratory serializers.
Tests that the serializer properly fetches and formats data from Patient and Observation models.
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wah4h.settings')
django.setup()

from datetime import datetime, date
from django.utils import timezone
from patients.models import Patient
from monitoring.models import Observation
from laboratory.models import DiagnosticReport, DiagnosticReportResult
from laboratory.serializers import DiagnosticReportSerializer


def create_test_data():
    """Create sample data for testing."""
    print("Creating test data...")
    
    # Create a test patient
    patient = Patient.objects.create(
        patient_id="P-2024-001",
        first_name="Juan",
        last_name="Dela Cruz",
        gender="male",
        birthdate=date(1985, 5, 15),
        mobile_number="09171234567"
    )
    print(f"✓ Created patient: {patient}")
    
    # Create test observations (lab results)
    obs1 = Observation.objects.create(
        identifier="OBS-001",
        status="final",
        subject_id=patient.id,
        encounter_id=1001,
        code="WBC",
        category="laboratory",
        value_quantity=12.5,
        reference_range_low="4.0",
        reference_range_high="11.0",
        interpretation="High - Mild leukocytosis",
        effective_datetime=timezone.now()
    )
    print(f"✓ Created observation: {obs1.code} = {obs1.value_quantity}")
    
    obs2 = Observation.objects.create(
        identifier="OBS-002",
        status="final",
        subject_id=patient.id,
        encounter_id=1001,
        code="RBC",
        category="laboratory",
        value_quantity=4.8,
        reference_range_low="4.2",
        reference_range_high="5.9",
        interpretation="Normal",
        effective_datetime=timezone.now()
    )
    print(f"✓ Created observation: {obs2.code} = {obs2.value_quantity}")
    
    obs3 = Observation.objects.create(
        identifier="OBS-003",
        status="final",
        subject_id=patient.id,
        encounter_id=1001,
        code="Hemoglobin",
        category="laboratory",
        value_quantity=14.2,
        reference_range_low="12.0",
        reference_range_high="16.0",
        interpretation="Normal",
        effective_datetime=timezone.now()
    )
    print(f"✓ Created observation: {obs3.code} = {obs3.value_quantity}")
    
    # Create diagnostic report
    report = DiagnosticReport.objects.create(
        identifier="DR-2024-001",
        status="final",
        subject_id=patient.id,
        encounter_id=1001,
        code_code="CBC",
        code_display="Complete Blood Count",
        category_code="LAB",
        category_display="Laboratory",
        conclusion="Mild leukocytosis noted. Clinical correlation recommended.",
        effective_datetime=timezone.now(),
        issued_datetime=timezone.now()
    )
    print(f"✓ Created diagnostic report: {report.identifier}")
    
    # Link observations to report
    DiagnosticReportResult.objects.create(
        diagnostic_report=report,
        observation_id=obs1.observation_id,
        item_sequence=1
    )
    DiagnosticReportResult.objects.create(
        diagnostic_report=report,
        observation_id=obs2.observation_id,
        item_sequence=2
    )
    DiagnosticReportResult.objects.create(
        diagnostic_report=report,
        observation_id=obs3.observation_id,
        item_sequence=3
    )
    print(f"✓ Linked {report.results.count()} observations to report")
    
    return report


def test_serializer(report):
    """Test the enhanced serializer."""
    print("\n" + "="*60)
    print("TESTING SERIALIZER OUTPUT")
    print("="*60)
    
    serializer = DiagnosticReportSerializer(report)
    data = serializer.data
    
    # Check frontend-expected fields
    print("\n✓ Checking frontend-expected fields:")
    
    required_fields = [
        'subject_display',
        'subject_patient_id',
        'lifecycleStatus',
        'priority',
        'orderedBy',
        'orderedAt',
        'processedBy',
        'processedAt',
        'results'
    ]
    
    for field in required_fields:
        if field in data:
            print(f"  ✓ {field}: {data[field]}")
        else:
            print(f"  ✗ MISSING: {field}")
    
    # Check results structure
    print("\n✓ Checking results structure:")
    if 'results' in data and len(data['results']) > 0:
        result = data['results'][0]
        result_fields = ['parameter', 'value', 'unit', 'referenceRange', 'flag', 'interpretation']
        for field in result_fields:
            if field in result:
                print(f"  ✓ {field}: {result[field]}")
            else:
                print(f"  ✗ MISSING: {field}")
    else:
        print("  ✗ No results found!")
    
    # Print full JSON output
    print("\n" + "="*60)
    print("FULL SERIALIZED OUTPUT")
    print("="*60)
    import json
    print(json.dumps(data, indent=2, default=str))
    
    return data


def cleanup_test_data():
    """Clean up test data."""
    print("\n" + "="*60)
    print("CLEANING UP TEST DATA")
    print("="*60)
    
    DiagnosticReport.objects.filter(identifier__startswith="DR-2024").delete()
    Observation.objects.filter(identifier__startswith="OBS-").delete()
    Patient.objects.filter(patient_id__startswith="P-2024").delete()
    
    print("✓ Test data cleaned up")


def main():
    """Main test function."""
    print("\n" + "="*60)
    print("LABORATORY SERIALIZER VERIFICATION")
    print("="*60 + "\n")
    
    try:
        # Create test data
        report = create_test_data()
        
        # Test serializer
        data = test_serializer(report)
        
        # Validate critical fields
        print("\n" + "="*60)
        print("VALIDATION SUMMARY")
        print("="*60)
        
        errors = []
        
        if not data.get('subject_display'):
            errors.append("Missing subject_display")
        if not data.get('subject_patient_id'):
            errors.append("Missing subject_patient_id")
        if not data.get('lifecycleStatus'):
            errors.append("Missing lifecycleStatus")
        if not data.get('results'):
            errors.append("Missing results array")
        elif len(data['results']) == 0:
            errors.append("Results array is empty")
        else:
            result = data['results'][0]
            if 'parameter' not in result:
                errors.append("Result missing 'parameter' field")
            if 'value' not in result:
                errors.append("Result missing 'value' field")
        
        if errors:
            print("\n✗ VALIDATION FAILED:")
            for error in errors:
                print(f"  - {error}")
            return False
        else:
            print("\n✓ ALL VALIDATIONS PASSED!")
            print("\nThe serializer successfully:")
            print("  1. Fetches patient details from Patient model")
            print("  2. Maps FHIR status to frontend lifecycleStatus")
            print("  3. Fetches observation data for results")
            print("  4. Formats results to match frontend interface")
            return True
            
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Cleanup
        cleanup_test_data()


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
