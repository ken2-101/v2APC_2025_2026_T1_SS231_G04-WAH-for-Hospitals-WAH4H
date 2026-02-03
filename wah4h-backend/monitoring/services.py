from django.apps import apps


class ResourceResolver:
    """
    Service class for resolving manual foreign key IDs to human-readable data.
    Uses lazy loading to avoid circular imports and maintains strict app decoupling.
    """
    
    @staticmethod
    def _get_object_or_none(app_label, model_name, pk):
        """
        Helper method to fetch a model instance by primary key.
        Returns None if the model or instance doesn't exist.
        
        Args:
            app_label (str): The app label (e.g., 'patients', 'admission')
            model_name (str): The model name (e.g., 'Patient', 'Encounter')
            pk (int): The primary key of the object to fetch
            
        Returns:
            Model instance or None
        """
        if not pk:
            return None
            
        try:
            Model = apps.get_model(app_label, model_name)
            return Model.objects.filter(pk=pk).first()
        except (LookupError, AttributeError):
            return None
    
    @staticmethod
    def resolve_patient(subject_id):
        """
        Resolve a patient ID to human-readable data.
        
        Args:
            subject_id (int): The patient primary key
            
        Returns:
            dict: Patient data or fallback dictionary
        """
        patient = ResourceResolver._get_object_or_none('patients', 'Patient', subject_id)
        
        if not patient:
            return {
                'full_name': 'Unknown Patient',
                'first_name': 'Unknown',
                'last_name': 'Unknown',
                'patient_id': None,
                'birthdate': None,
                'gender': None
            }
        
        full_name_parts = [
            patient.first_name or '',
            patient.middle_name or '',
            patient.last_name or ''
        ]
        full_name = ' '.join(filter(None, full_name_parts)).strip() or 'Unknown Patient'
        
        return {
            'full_name': full_name,
            'first_name': patient.first_name,
            'last_name': patient.last_name,
            'patient_id': patient.patient_id,
            'birthdate': patient.birthdate,
            'gender': patient.gender
        }
    
    @staticmethod
    def resolve_practitioner(practitioner_id):
        """
        Resolve a practitioner ID to human-readable data.
        Used for performer_id, assessor_id, performer_actor_id.
        
        Args:
            practitioner_id (int): The practitioner primary key
            
        Returns:
            dict: Practitioner data or fallback dictionary
        """
        practitioner = ResourceResolver._get_object_or_none('accounts', 'Practitioner', practitioner_id)
        
        if not practitioner:
            return {
                'full_name': 'Unknown Practitioner',
                'first_name': 'Unknown',
                'last_name': 'Unknown',
                'identifier': None
            }
        
        full_name_parts = [
            practitioner.first_name or '',
            practitioner.middle_name or '',
            practitioner.last_name or ''
        ]
        full_name = ' '.join(filter(None, full_name_parts)).strip() or 'Unknown Practitioner'
        
        return {
            'full_name': full_name,
            'first_name': practitioner.first_name,
            'last_name': practitioner.last_name,
            'identifier': practitioner.identifier
        }
    
    @staticmethod
    def resolve_encounter(encounter_id):
        """
        Resolve an encounter ID to human-readable data.
        
        Args:
            encounter_id (int): The encounter primary key
            
        Returns:
            dict: Encounter data or fallback dictionary
        """
        encounter = ResourceResolver._get_object_or_none('admission', 'Encounter', encounter_id)
        
        if not encounter:
            return {
                'identifier': 'Unknown',
                'status': 'Unknown',
                'class': None,
                'period_start': None
            }
        
        return {
            'identifier': encounter.identifier,
            'status': encounter.status,
            'class': encounter.class_field,
            'period_start': encounter.period_start
        }
    
    @staticmethod
    def resolve_account(account_id):
        """
        Resolve an account ID to human-readable data.
        
        Args:
            account_id (int): The account primary key
            
        Returns:
            dict: Account data or fallback dictionary
        """
        account = ResourceResolver._get_object_or_none('billing', 'Account', account_id)
        
        if not account:
            return {
                'identifier': 'Unknown',
                'name': 'Unknown Account',
                'status': 'Unknown'
            }
        
        return {
            'identifier': account.identifier,
            'name': account.name,
            'status': account.status
        }
    
    @staticmethod
    def resolve_organization(organization_id):
        """
        Resolve an organization ID to human-readable data.
        
        Args:
            organization_id (int): The organization primary key
            
        Returns:
            dict: Organization data or fallback dictionary
        """
        organization = ResourceResolver._get_object_or_none('accounts', 'Organization', organization_id)
        
        if not organization:
            return {
                'name': 'Unknown Organization',
                'type_code': None
            }
        
        return {
            'name': organization.name,
            'type_code': organization.type_code
        }
    
    @staticmethod
    def resolve_location(location_id):
        """
        Resolve a location ID to human-readable data.
        
        Args:
            location_id (int): The location primary key
            
        Returns:
            dict: Location data or fallback dictionary
        """
        location = ResourceResolver._get_object_or_none('accounts', 'Location', location_id)
        
        if not location:
            return {
                'name': 'Unknown Location',
                'status': 'Unknown'
            }
        
        return {
            'name': location.name,
            'status': location.status
        }
