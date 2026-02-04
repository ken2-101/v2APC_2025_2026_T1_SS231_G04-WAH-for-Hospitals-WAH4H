from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from datetime import datetime, timedelta, date
import random

# Import models from all 8 apps
from accounts.models import Organization, Location, Practitioner, PractitionerRole, User
from patients.models import Patient, Condition
from admission.models import Encounter
from discharge.models import Discharge, Procedure as DischargeProcedure
from monitoring.models import Observation
from pharmacy.models import Medication, MedicationRequest, MedicationRequestDosage
from billing.models import Account, Claim, ClaimItem
from laboratory.models import LabTestDefinition, DiagnosticReport, Specimen


class Command(BaseCommand):
    help = 'Seed the database with realistic mock data for all 8 modules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_data()

        self.stdout.write(self.style.SUCCESS('Starting hospital data seeding...'))
        
        # Step 1: Accounts (The Foundation)
        self.seed_accounts()
        
        # Step 2: Patients
        self.seed_patients()
        
        # Step 3: Admissions (Encounters)
        self.seed_encounters()
        
        # Step 4: Clinical Data
        self.seed_clinical_data()
        
        # Step 5: Billing
        self.seed_billing()
        
        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

    @transaction.atomic
    def clear_data(self):
        self.stdout.write('Clearing existing data...')
        
        # Delete in reverse dependency order
        ClaimItem.objects.all().delete()
        Claim.objects.all().delete()
        Account.objects.all().delete()
        
        MedicationRequestDosage.objects.all().delete()
        MedicationRequest.objects.all().delete()
        Medication.objects.all().delete()
        
        Observation.objects.all().delete()
        DischargeProcedure.objects.all().delete()
        Discharge.objects.all().delete()
        Specimen.objects.all().delete()
        DiagnosticReport.objects.all().delete()
        LabTestDefinition.objects.all().delete()
        
        Encounter.objects.all().delete()
        Condition.objects.all().delete()
        Patient.objects.all().delete()
        
        User.objects.all().delete()
        PractitionerRole.objects.all().delete()
        Practitioner.objects.all().delete()
        Location.objects.all().delete()
        Organization.objects.all().delete()
        
        self.stdout.write(self.style.SUCCESS('Data cleared successfully'))

    def seed_accounts(self):
        self.stdout.write('Seeding accounts module...')
        
        # Create Organizations
        org1 = Organization.objects.create(
            identifier='ORG-001',
            status='active',
            name='Main Hospital',
            active=True,
            type_code='prov',
            telecom='+63-2-1234-5678',
            address_line='123 Health Street',
            address_city='Manila',
            address_state='Metro Manila',
            address_country='Philippines',
            address_postal_code='1000'
        )
        
        org2 = Organization.objects.create(
            identifier='ORG-002',
            status='active',
            name='City Clinic',
            active=True,
            type_code='prov',
            telecom='+63-2-8765-4321',
            address_line='456 Medical Avenue',
            address_city='Quezon City',
            address_state='Metro Manila',
            address_country='Philippines',
            address_postal_code='1100'
        )
        
        self.stdout.write(self.style.SUCCESS(f'Created 2 Organizations'))
        
        # Create Locations
        locations_data = [
            {'name': 'Emergency Room', 'identifier': 'LOC-ER-001', 'type_code': 'ER', 'postal': '1001'},
            {'name': 'Intensive Care Unit', 'identifier': 'LOC-ICU-001', 'type_code': 'ICU', 'postal': '1002'},
            {'name': 'Ward A', 'identifier': 'LOC-WARD-A', 'type_code': 'WARD', 'postal': '1003'},
            {'name': 'Pharmacy', 'identifier': 'LOC-PHARM-001', 'type_code': 'PHARM', 'postal': '1004'},
            {'name': 'Laboratory', 'identifier': 'LOC-LAB-001', 'type_code': 'LAB', 'postal': '1005'},
        ]
        
        self.locations = []
        for loc_data in locations_data:
            location = Location.objects.create(
                identifier=loc_data['identifier'],
                status='active',
                name=loc_data['name'],
                type_code=loc_data['type_code'],
                managing_organization=org1,
                address_line='Hospital Complex',
                address_city='Manila',
                address_country='Philippines',
                address_postal_code=loc_data['postal']
            )
            self.locations.append(location)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(self.locations)} Locations'))
        
        # Create Practitioners
        practitioner_names = [
            ('John', 'Smith', 'MD', 'Doctor'),
            ('Maria', 'Garcia', 'MD', 'Doctor'),
            ('Robert', 'Lee', 'MD', 'Doctor'),
            ('Anna', 'Santos', 'MD', 'Doctor'),
            ('Michael', 'Cruz', 'MD', 'Doctor'),
            ('Linda', 'Reyes', 'RN', 'Nurse'),
            ('David', 'Tan', 'RN', 'Nurse'),
            ('Sarah', 'Lim', 'RN', 'Nurse'),
            ('James', 'Ramos', 'RN', 'Nurse'),
            ('Emma', 'Dela Cruz', 'RN', 'Nurse'),
        ]
        
        self.practitioners = []
        for idx, (first, last, suffix, role) in enumerate(practitioner_names, start=1):
            practitioner = Practitioner.objects.create(
                identifier=f'PRAC-{idx:03d}',
                status='active',
                active=True,
                first_name=first,
                last_name=last,
                suffix_name=suffix,
                gender=random.choice(['male', 'female']),
                birth_date=date(1970 + random.randint(0, 30), random.randint(1, 12), random.randint(1, 28)),
                telecom=f'+63-9{random.randint(100000000, 999999999)}',
                address_city='Manila',
                address_country='Philippines'
            )
            self.practitioners.append(practitioner)
            
            # Create PractitionerRole
            PractitionerRole.objects.create(
                identifier=f'ROLE-{idx:03d}',
                status='active',
                active=True,
                practitioner=practitioner,
                organization=org1,
                location=random.choice(self.locations),
                role_code=role.lower(),
                specialty_code='general' if role == 'Doctor' else 'nursing'
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(self.practitioners)} Practitioners with roles'))
        
        # Create Superuser
        admin_practitioner = Practitioner.objects.create(
            identifier='PRAC-ADMIN',
            status='active',
            active=True,
            first_name='Admin',
            last_name='User',
            suffix_name='',
            gender='male',
            telecom='+63-912-345-6789'
        )
        
        if not User.objects.filter(username='admin').exists():
            User.objects.create(
                practitioner=admin_practitioner,
                username='admin',
                email='admin@hospital.com',
                password=make_password('password123'),
                first_name='Admin',
                last_name='User',
                role='administrator',
                status='active',
                is_staff=True,
                is_active=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS('Created superuser: admin / password123'))
        
    def seed_patients(self):
        self.stdout.write('Seeding patients module...')
        
        first_names = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena', 'Luis', 'Sofia',
                       'Miguel', 'Carmen', 'Antonio', 'Isabel', 'Francisco', 'Teresa', 'Manuel', 'Patricia',
                       'Rafael', 'Laura', 'Diego', 'Beatriz', 'Jorge', 'Lucia', 'Fernando', 'Cristina',
                       'Ricardo', 'Monica', 'Alejandro', 'Veronica', 'Pablo', 'Diana', 'Andres', 'Natalia',
                       'Gabriel', 'Adriana', 'Daniel', 'Claudia', 'Roberto', 'Gloria', 'Eduardo', 'Sandra',
                       'Sergio', 'Raquel', 'Javier', 'Silvia', 'Marcos', 'Andrea', 'Oscar', 'Victoria']
        
        last_names = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Flores', 'Ramos', 'Mendoza',
                      'Torres', 'Rivera', 'Gonzales', 'Fernandez', 'Lopez', 'Martinez', 'Rodriguez',
                      'Hernandez', 'Perez', 'Sanchez', 'Ramirez', 'Castillo', 'Dela Cruz', 'Villanueva',
                      'Aquino', 'Valdez', 'Santiago', 'Morales', 'Navarro', 'Aguilar', 'Gutierrez', 'Alvarez']
        
        self.patients = []
        for i in range(50):
            patient = Patient.objects.create(
                patient_id=f'PAT-{i+1:05d}',
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                middle_name=random.choice(first_names),
                gender=random.choice(['male', 'female']),
                birthdate=date(1940 + random.randint(0, 60), random.randint(1, 12), random.randint(1, 28)),
                civil_status=random.choice(['single', 'married', 'widowed']),
                nationality='Filipino',
                blood_type=random.choice(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']),
                mobile_number=f'+63-9{random.randint(100000000, 999999999)}',
                address_line=f'{random.randint(1, 999)} Street {random.randint(1, 50)}',
                address_city=random.choice(['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig']),
                address_state='Metro Manila',
                address_country='Philippines',
                address_postal_code=f'{random.randint(1000, 1999)}',
                philhealth_id=f'{random.randint(1000000000, 9999999999):012d}',
                occupation=random.choice(['Teacher', 'Driver', 'Vendor', 'Clerk', 'Guard', 'Retired']),
                religion=random.choice(['Catholic', 'Protestant', 'Islam', 'Buddhist']),
                contact_first_name=random.choice(first_names),
                contact_last_name=random.choice(last_names),
                contact_mobile_number=f'+63-9{random.randint(100000000, 999999999)}',
                contact_relationship=random.choice(['spouse', 'child', 'sibling', 'parent'])
            )
            self.patients.append(patient)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(self.patients)} Patients'))
    
    def seed_encounters(self):
        self.stdout.write('Seeding admission module (Encounters)...')
        
        encounter_classes = ['inpatient', 'outpatient', 'emergency']
        encounter_statuses = ['in-progress', 'finished']
        
        self.encounters = []
        for i in range(30):
            patient = random.choice(self.patients)
            practitioner = random.choice(self.practitioners)
            location = random.choice(self.locations)
            
            days_ago = random.randint(1, 90)
            start_date = datetime.now().date() - timedelta(days=days_ago)
            status = random.choice(encounter_statuses)
            end_date = start_date + timedelta(days=random.randint(1, 7)) if status == 'finished' else None
            
            encounter = Encounter.objects.create(
                identifier=f'ENC-{i+1:05d}',
                status=status,
                class_field=random.choice(encounter_classes),
                type='consultation',
                service_type='general-medicine',
                subject_id=patient.id,
                participant_individual_id=practitioner.practitioner_id,
                location_id=location.location_id,
                period_start=start_date,
                period_end=end_date,
                reason_code=random.choice(['fever', 'injury', 'checkup', 'surgery', 'emergency']),
                admit_source=random.choice(['referral', 'emergency', 'walk-in']),
                location_status='active'
            )
            self.encounters.append(encounter)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(self.encounters)} Encounters'))
    
    def seed_clinical_data(self):
        self.stdout.write('Seeding clinical data (Procedures, Observations, Medications)...')
        
        # Seed Procedures (Discharge module)
        procedure_codes = [
            ('appendectomy', 'Appendectomy'),
            ('xray', 'X-Ray Examination'),
            ('bloodtest', 'Blood Test'),
            ('ct-scan', 'CT Scan'),
            ('ultrasound', 'Ultrasound'),
            ('surgery', 'Surgical Procedure'),
            ('biopsy', 'Tissue Biopsy'),
            ('ecg', 'Electrocardiogram'),
        ]
        
        procedure_count = 0
        for encounter in self.encounters:
            num_procedures = random.randint(1, 2)
            for _ in range(num_procedures):
                code, display = random.choice(procedure_codes)
                DischargeProcedure.objects.create(
                    identifier=f'PROC-{procedure_count+1:05d}',
                    status=random.choice(['completed', 'in-progress']),
                    encounter_id=encounter.encounter_id,
                    subject_id=encounter.subject_id,
                    code_code=code,
                    code_display=display,
                    category_code='procedure',
                    category_display='Procedure',
                    performed_datetime=timezone.make_aware(datetime.combine(encounter.period_start, datetime.min.time()))
                )
                procedure_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {procedure_count} Procedures'))
        
        # Seed Observations (Monitoring module)
        observation_codes = [
            ('8867-4', 'Heart Rate', 60, 100),
            ('8480-6', 'Systolic Blood Pressure', 90, 140),
            ('8462-4', 'Diastolic Blood Pressure', 60, 90),
            ('8310-5', 'Body Temperature', 36.0, 37.5),
            ('59408-5', 'Oxygen Saturation', 95, 100),
            ('9279-1', 'Respiratory Rate', 12, 20),
        ]
        
        observation_count = 0
        for encounter in self.encounters:
            num_observations = random.randint(3, 6)
            for _ in range(num_observations):
                code, display, min_val, max_val = random.choice(observation_codes)
                value = round(random.uniform(min_val, max_val), 1)
                
                Observation.objects.create(
                    identifier=f'OBS-{observation_count+1:05d}',
                    status='final',
                    code=code,
                    category='vital-signs',
                    subject_id=encounter.subject_id,
                    encounter_id=encounter.encounter_id,
                    value_quantity=value,
                    effective_datetime=timezone.make_aware(datetime.combine(encounter.period_start, datetime.min.time())),
                    issued=timezone.now()
                )
                observation_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {observation_count} Observations'))
        
        # Seed Medications (Pharmacy module)
        medication_list = [
            ('paracetamol', 'Paracetamol 500mg'),
            ('amoxicillin', 'Amoxicillin 250mg'),
            ('ibuprofen', 'Ibuprofen 400mg'),
            ('aspirin', 'Aspirin 100mg'),
            ('metformin', 'Metformin 500mg'),
            ('omeprazole', 'Omeprazole 20mg'),
            ('losartan', 'Losartan 50mg'),
            ('amlodipine', 'Amlodipine 5mg'),
        ]
        
        self.medications = []
        for idx, (code, display) in enumerate(medication_list, start=1):
            medication = Medication.objects.create(
                identifier=f'MED-{idx:03d}',
                status='active',
                code_code=code,
                code_display=display,
                code_system='http://www.nlm.nih.gov/research/umls/rxnorm'
            )
            self.medications.append(medication)
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(self.medications)} Medications'))
        
        # Seed Medication Requests
        medication_request_count = 0
        for encounter in self.encounters:
            num_requests = random.randint(1, 3)
            for _ in range(num_requests):
                medication = random.choice(self.medications)
                practitioner = random.choice(self.practitioners)
                
                med_request = MedicationRequest.objects.create(
                    identifier=f'MEDREQ-{medication_request_count+1:05d}',
                    status=random.choice(['active', 'completed']),
                    subject_id=encounter.subject_id,
                    encounter_id=encounter.encounter_id,
                    requester_id=practitioner.practitioner_id,
                    medication_code=medication.code_code,
                    medication_display=medication.code_display,
                    intent='order',
                    priority='routine',
                    authored_on=timezone.make_aware(datetime.combine(encounter.period_start, datetime.min.time())),
                    dispense_quantity=random.randint(10, 30)
                )
                
                # Add dosage instructions
                MedicationRequestDosage.objects.create(
                    medication_request=med_request,
                    dosage_text=f'Take {random.randint(1, 3)} tablet(s) {random.choice(["once", "twice", "three times"])} daily',
                    dosage_route='oral'
                )
                
                medication_request_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {medication_request_count} Medication Requests'))
        
        # Seed Lab Test Definitions
        lab_tests = [
            ('CBC', 'Complete Blood Count', 'hematology', 500.00),
            ('URINALYSIS', 'Urinalysis', 'chemistry', 200.00),
            ('XRAY-CHEST', 'Chest X-Ray', 'radiology', 800.00),
            ('ECG', 'Electrocardiogram', 'cardiology', 600.00),
            ('LIPID', 'Lipid Profile', 'chemistry', 750.00),
        ]
        
        for code, name, category, price in lab_tests:
            LabTestDefinition.objects.create(
                identifier=f'LAB-{code}',
                status='active',
                code=code,
                name=name,
                category=category,
                base_price=price,
                turnaround_time='24h'
            )
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(lab_tests)} Lab Test Definitions'))
    
    def seed_billing(self):
        self.stdout.write('Seeding billing module...')
        
        # Create Accounts for encounters
        account_count = 0
        self.accounts = []
        for encounter in self.encounters:
            account = Account.objects.create(
                identifier=f'ACC-{account_count+1:05d}',
                status='active',
                type='patient',
                name=f'Account for Encounter {encounter.identifier}',
                subject_id=encounter.subject_id,
                servicePeriod_start=encounter.period_start,
                servicePeriod_end=encounter.period_end
            )
            self.accounts.append(account)
            account_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {len(self.accounts)} Accounts'))
        
        # Create Claims (Invoices)
        claim_count = 0
        for encounter in self.encounters:
            is_paid = random.choice([True, False])
            
            claim = Claim.objects.create(
                identifier=f'CLAIM-{claim_count+1:05d}',
                status='active' if not is_paid else 'cancelled',
                type='institutional',
                use='claim',
                patient_id=encounter.subject_id,
                provider_id=encounter.participant_individual_id if encounter.participant_individual_id else 1,
                billablePeriod_start=encounter.period_start,
                billablePeriod_end=encounter.period_end or encounter.period_start,
                created=timezone.make_aware(datetime.combine(encounter.period_start, datetime.min.time())),
                priority='normal'
            )
            
            # Create Claim Items (Line items)
            item_count = random.randint(2, 5)
            total_amount = 0
            for seq in range(1, item_count + 1):
                service_code = random.choice(['consultation', 'medication', 'laboratory', 'procedure', 'room'])
                unit_price = random.randint(500, 5000)
                quantity = random.randint(1, 3)
                amount = unit_price * quantity
                total_amount += amount
                
                ClaimItem.objects.create(
                    claim=claim,
                    sequence=str(seq),
                    productOrService=service_code,
                    servicedDate=str(encounter.period_start),
                    unitPrice=unit_price,
                    net=str(amount),
                    quantity=quantity
                )
            
            # Update claim total
            claim.total = str(total_amount)
            claim.save()
            
            claim_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {claim_count} Claims with line items'))
        self.stdout.write(self.style.SUCCESS(f'Mix of paid and unpaid invoices for gatekeeper testing'))
