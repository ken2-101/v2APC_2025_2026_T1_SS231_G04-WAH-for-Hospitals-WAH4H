"""
Monitoring Anti-Corruption Layer (Read Operations)
===================================================
Fortress Pattern: Read-only interface for Monitoring Module.

This is the ONLY way external apps can access Monitoring data.
Returns: Dictionaries (DTOs) only - NO Django model objects.

Consumers:
- Billing Module: Access ChargeItem data
- Dashboard/Analytics: Vital sign trends
- Patient Module: Clinical observations history
- Laboratory Module: Validate observations exist
"""

from typing import List, Dict, Optional, Any
from django.core.exceptions import ObjectDoesNotExist

# Local Model Imports (Allowed within module boundary)
from monitoring.models import Observation, ObservationComponent, ChargeItem


class ObservationACL:
    """
    Read-Only Service Layer for Observation data.
    
    CRITICAL: This is the dependency that Laboratory module is waiting for.
    Provides validation and data retrieval for observations without exposing
    the underlying model structure to external apps.
    """
    
    @staticmethod
    def validate_observation_exists(observation_id: int) -> bool:
        """
        Check if an observation exists in the system.
        
        CRITICAL: Laboratory module depends on this method.
        
        Args:
            observation_id: Primary key of the observation
            
        Returns:
            bool: True if observation exists, False otherwise
        """
        try:
            Observation.objects.get(observation_id=observation_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_observation_details(observation_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve observation details as a DTO with nested components.
        
        Args:
            observation_id: Primary key of the observation
            
        Returns:
            Dictionary with observation data or None if not found.
            
            DTO Fields:
                - observation_id (int): Observation ID
                - identifier (str): FHIR identifier
                - status (str): Observation status
                - code (str): Observation code
                - category (str): Observation category
                - subject_id (int): Patient ID
                - encounter_id (int): Encounter ID
                - performer_id (int): Practitioner ID
                - effective_datetime (str): When observed
                - issued (str): When result released
                - value_quantity (float): Primary numeric value
                - value_string (str): String value
                - value_codeableconcept (str): Coded value
                - interpretation (str): Clinical interpretation
                - note (str): Additional notes
                - reference_range_low (str): Lower reference limit
                - reference_range_high (str): Upper reference limit
                - components (list): List of component dictionaries
                - created_at (str): Creation timestamp
                - updated_at (str): Update timestamp
        """
        try:
            observation = Observation.objects.get(observation_id=observation_id)
            return _observation_to_dict(observation)
        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def get_patient_observations(
        patient_id: int, 
        category: Optional[str] = None,
        encounter_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all observations for a patient, optionally filtered by category or encounter.
        
        Args:
            patient_id: Patient ID (subject_id)
            category: Optional category filter (e.g., 'vital-signs', 'laboratory')
            encounter_id: Optional encounter ID filter
            
        Returns:
            List of observation summary dictionaries
        """
        try:
            queryset = Observation.objects.filter(subject_id=patient_id)
            
            if category:
                queryset = queryset.filter(category=category)
            
            if encounter_id:
                queryset = queryset.filter(encounter_id=encounter_id)
            
            observations = queryset.order_by('-effective_datetime')[:100]
            
            return [_observation_to_dict(obs) for obs in observations]
        except Exception:
            return []
    
    @staticmethod
    def get_encounter_observations(
        encounter_id: int,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all observations for an encounter, optionally filtered by category.
        
        Args:
            encounter_id: Encounter ID
            category: Optional category filter (e.g., 'vital-signs', 'laboratory')
            
        Returns:
            List of observation summary dictionaries
        """
        try:
            queryset = Observation.objects.filter(encounter_id=encounter_id)
            
            if category:
                queryset = queryset.filter(category=category)
            
            observations = queryset.order_by('-effective_datetime')
            
            return [_observation_to_dict(obs) for obs in observations]
        except Exception:
            return []
    
    @staticmethod
    def get_latest_observation(
        patient_id: int,
        code: str,
        encounter_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get the most recent observation for a patient by code.
        
        Useful for retrieving latest vital sign or lab result.
        
        Args:
            patient_id: Patient ID (subject_id)
            code: Observation code (e.g., 'blood-pressure', 'heart-rate')
            encounter_id: Optional encounter ID filter
            
        Returns:
            Observation dictionary or None if not found
        """
        try:
            queryset = Observation.objects.filter(
                subject_id=patient_id,
                code=code
            )
            
            if encounter_id:
                queryset = queryset.filter(encounter_id=encounter_id)
            
            observation = queryset.order_by('-effective_datetime').first()
            
            if observation:
                return _observation_to_dict(observation)
            return None
        except Exception:
            return None


class ChargeItemACL:
    """
    Read-Only Service Layer for ChargeItem data.
    
    Provides validation and data retrieval for charge items without exposing
    the underlying model structure to external apps.
    """
    
    @staticmethod
    def validate_charge_item_exists(chargeitem_id: int) -> bool:
        """
        Check if a charge item exists in the system.
        
        Args:
            chargeitem_id: Primary key of the charge item
            
        Returns:
            bool: True if charge item exists, False otherwise
        """
        try:
            ChargeItem.objects.get(chargeitem_id=chargeitem_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_charge_item_details(chargeitem_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve charge item details as a DTO.
        
        Args:
            chargeitem_id: Primary key of the charge item
            
        Returns:
            Dictionary with charge item data or None if not found
        """
        try:
            charge_item = ChargeItem.objects.get(chargeitem_id=chargeitem_id)
            return _charge_item_to_full_dict(charge_item)
        except ObjectDoesNotExist:
            return None
    
    @staticmethod
    def get_encounter_charges(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all charge items for an encounter.
        
        CRITICAL: Billing module depends on this method.
        
        Args:
            encounter_id: Encounter ID (context_id)
            
        Returns:
            List of charge item dictionaries for billing
        """
        try:
            charge_items = ChargeItem.objects.filter(
                context_id=encounter_id
            ).order_by('-entered_date')
            
            return [_charge_item_to_billing_dict(item) for item in charge_items]
        except Exception:
            return []
    
    @staticmethod
    def get_patient_charges(
        patient_id: int,
        account_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get all charge items for a patient, optionally filtered by account.
        
        Args:
            patient_id: Patient ID (subject_id)
            account_id: Optional billing account ID filter
            
        Returns:
            List of charge item dictionaries
        """
        try:
            queryset = ChargeItem.objects.filter(subject_id=patient_id)
            
            if account_id:
                queryset = queryset.filter(account_id=account_id)
            
            charge_items = queryset.order_by('-entered_date')[:100]
            
            return [_charge_item_to_billing_dict(item) for item in charge_items]
        except Exception:
            return []
    
    @staticmethod
    def get_charge_items_by_code(
        code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get charge items by service/product code, optionally filtered by date range.
        
        Useful for analytics and reporting.
        
        Args:
            code: Charge item code
            start_date: Optional start date (ISO format)
            end_date: Optional end date (ISO format)
            
        Returns:
            List of charge item dictionaries
        """
        try:
            queryset = ChargeItem.objects.filter(code=code)
            
            if start_date:
                queryset = queryset.filter(occurrence_datetime__gte=start_date)
            
            if end_date:
                queryset = queryset.filter(occurrence_datetime__lte=end_date)
            
            charge_items = queryset.order_by('-occurrence_datetime')[:200]
            
            return [_charge_item_to_billing_dict(item) for item in charge_items]
        except Exception:
            return []


class MonitoringACL:
    """
    General monitoring data access for clinical applications.
    """
    
    @staticmethod
    def get_encounter_observations(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all observations for a specific encounter.
        
        Args:
            encounter_id: Encounter primary key (integer)
        
        Returns:
            List of observation dictionaries with nested components
        """
        try:
            observations = Observation.objects.filter(
                encounter_id=encounter_id
            ).prefetch_related('components').order_by('-effective_datetime')
            
            return [_observation_to_dict(obs) for obs in observations]
        except Exception:
            return []
    
    @staticmethod
    def get_patient_observations(patient_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get most recent observations for a patient across all encounters.
        
        Args:
            patient_id: Patient primary key (integer)
            limit: Maximum number of results (default: 50)
        
        Returns:
            List of observation dictionaries with nested components
        """
        try:
            observations = Observation.objects.filter(
                subject_id=patient_id
            ).prefetch_related('components').order_by('-effective_datetime')[:limit]
            
            return [_observation_to_dict(obs) for obs in observations]
        except Exception:
            return []
    
    @staticmethod
    def get_observation_by_id(observation_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a specific observation by its ID.
        
        Args:
            observation_id: Observation primary key (integer)
        
        Returns:
            Observation dictionary with nested components or None if not found
        """
        try:
            observation = Observation.objects.prefetch_related('components').get(
                observation_id=observation_id
            )
            return _observation_to_dict(observation)
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None


class BillingACL:
    """
    Billing-specific data access for financial operations.
    """
    
    @staticmethod
    def get_billable_items(encounter_id: int) -> List[Dict[str, Any]]:
        """
        Get all billable charge items for an encounter.
        
        Args:
            encounter_id: Encounter primary key (integer)
        
        Returns:
            List of charge item dictionaries with billing-relevant fields
        """
        try:
            charge_items = ChargeItem.objects.filter(
                context_id=encounter_id
            ).order_by('-occurrence_datetime')
            
            return [_charge_item_to_billing_dict(item) for item in charge_items]
        except Exception:
            return []
    
    @staticmethod
    def get_patient_charge_items(patient_id: int) -> List[Dict[str, Any]]:
        """
        Get all charge items for a patient across all encounters.
        
        Args:
            patient_id: Patient primary key (integer)
        
        Returns:
            List of charge item dictionaries
        """
        try:
            charge_items = ChargeItem.objects.filter(
                subject_id=patient_id
            ).order_by('-occurrence_datetime')
            
            return [_charge_item_to_billing_dict(item) for item in charge_items]
        except Exception:
            return []
    
    @staticmethod
    def get_charge_item_by_id(chargeitem_id: int) -> Optional[Dict[str, Any]]:
        """
        Get a specific charge item by its ID.
        
        Args:
            chargeitem_id: ChargeItem primary key (integer)
        
        Returns:
            Charge item dictionary or None if not found
        """
        try:
            charge_item = ChargeItem.objects.get(chargeitem_id=chargeitem_id)
            return _charge_item_to_full_dict(charge_item)
        except ObjectDoesNotExist:
            return None
        except Exception:
            return None


class DashboardACL:
    """
    Dashboard/Analytics-specific data access for visualization.
    """
    
    @staticmethod
    def get_vital_trends(patient_id: int, code: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get trend data for a specific vital sign over time.
        
        Args:
            patient_id: Patient primary key (integer)
            code: Observation code (e.g., "85354-9" for Blood Pressure)
            limit: Maximum number of data points (default: 10)
        
        Returns:
            List of simplified vital sign data points: {date, value, unit, code}
        """
        try:
            observations = Observation.objects.filter(
                subject_id=patient_id,
                code=code
            ).prefetch_related('components').order_by('-effective_datetime')[:limit]
            
            return [_observation_to_trend_dict(obs) for obs in observations]
        except Exception:
            return []
    
    @staticmethod
    def get_recent_vitals(patient_id: int, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent vital signs for a patient (simplified format).
        
        Args:
            patient_id: Patient primary key (integer)
            limit: Maximum number of results (default: 20)
        
        Returns:
            List of simplified observation dictionaries
        """
        try:
            observations = Observation.objects.filter(
                subject_id=patient_id
            ).prefetch_related('components').order_by('-effective_datetime')[:limit]
            
            return [_observation_to_dashboard_dict(obs) for obs in observations]
        except Exception:
            return []


# ============================================================================
# INTERNAL HELPER FUNCTIONS (Private - Do not export)
# ============================================================================

def _observation_to_dict(observation: Observation) -> Dict[str, Any]:
    """
    Convert Observation model to full dictionary (DTO) with nested components.
    """
    components_data = []
    if hasattr(observation, 'components'):
        components_data = [_component_to_dict(comp) for comp in observation.components.all()]
    
    return {
        'observation_id': observation.observation_id,
        'identifier': observation.identifier or "",
        'status': observation.status or "",
        'code': observation.code or "",
        'category': observation.category or "",
        'subject_id': observation.subject_id,
        'encounter_id': observation.encounter_id,
        'performer_id': observation.performer_id,
        'effective_datetime': observation.effective_datetime.isoformat() if observation.effective_datetime else None,
        'effective_period_start': observation.effective_period_start.isoformat() if observation.effective_period_start else None,
        'effective_period_end': observation.effective_period_end.isoformat() if observation.effective_period_end else None,
        'issued': observation.issued.isoformat() if observation.issued else None,
        'value_string': observation.value_string or "",
        'value_boolean': observation.value_boolean,
        'value_integer': observation.value_integer or "",
        'value_quantity': float(observation.value_quantity) if observation.value_quantity else None,
        'value_codeableconcept': observation.value_codeableconcept or "",
        'value_datetime': observation.value_datetime.isoformat() if observation.value_datetime else None,
        'interpretation': observation.interpretation or "",
        'note': observation.note or "",
        'body_site': observation.body_site or "",
        'method': observation.method or "",
        'reference_range_low': observation.reference_range_low or "",
        'reference_range_high': observation.reference_range_high or "",
        'reference_range_text': observation.reference_range_text or "",
        'data_absent_reason': observation.data_absent_reason or "",
        'components': components_data,
        'created_at': observation.created_at.isoformat() if hasattr(observation, 'created_at') else None,
        'updated_at': observation.updated_at.isoformat() if hasattr(observation, 'updated_at') else None,
    }


def _component_to_dict(component: ObservationComponent) -> Dict[str, Any]:
    """
    Convert ObservationComponent model to dictionary (DTO).
    """
    return {
        'component_id': component.component_id,
        'code': component.code or "",
        'value_quantity': float(component.value_quantity) if component.value_quantity else None,
        'value_codeableconcept': component.value_codeableconcept or "",
        'value_string': component.value_string or "",
        'value_boolean': component.value_boolean,
        'value_integer': component.value_integer or "",
        'value_datetime': component.value_datetime.isoformat() if component.value_datetime else None,
        'interpretation': component.interpretation or "",
        'data_absent_reason': component.data_absent_reason or "",
        'reference_range_low': component.reference_range_low or "",
        'reference_range_high': component.reference_range_high or "",
        'reference_range_text': component.reference_range_text or "",
    }


def _observation_to_trend_dict(observation: Observation) -> Dict[str, Any]:
    """
    Convert Observation to simplified trend data point for charts.
    """
    # Primary value (could be from parent or first component)
    value = None
    unit = None
    
    if observation.value_quantity is not None:
        value = float(observation.value_quantity)
    elif observation.value_integer:
        try:
            value = float(observation.value_integer)
        except (ValueError, TypeError):
            pass
    
    # If no parent value, try first component
    if value is None and hasattr(observation, 'components'):
        components = list(observation.components.all())
        if components and components[0].value_quantity is not None:
            value = float(components[0].value_quantity)
    
    return {
        'date': observation.effective_datetime.isoformat() if observation.effective_datetime else None,
        'value': value,
        'unit': unit or "",
        'code': observation.code or "",
        'observation_id': observation.observation_id,
    }


def _observation_to_dashboard_dict(observation: Observation) -> Dict[str, Any]:
    """
    Convert Observation to simplified dashboard format.
    """
    # Extract primary value
    value_display = ""
    if observation.value_quantity is not None:
        value_display = str(float(observation.value_quantity))
    elif observation.value_string:
        value_display = observation.value_string
    elif observation.value_codeableconcept:
        value_display = observation.value_codeableconcept
    
    # Include components for multi-value observations (e.g., BP)
    components_summary = []
    if hasattr(observation, 'components'):
        for comp in observation.components.all():
            if comp.value_quantity is not None:
                components_summary.append({
                    'code': comp.code,
                    'value': float(comp.value_quantity)
                })
    
    return {
        'observation_id': observation.observation_id,
        'code': observation.code or "",
        'category': observation.category or "",
        'effective_datetime': observation.effective_datetime.isoformat() if observation.effective_datetime else None,
        'value_display': value_display,
        'interpretation': observation.interpretation or "",
        'components': components_summary,
        'status': observation.status or "",
    }


def _charge_item_to_billing_dict(charge_item: ChargeItem) -> Dict[str, Any]:
    """
    Convert ChargeItem to billing-focused dictionary (DTO).
    """
    return {
        'chargeitem_id': charge_item.chargeitem_id,
        'identifier': charge_item.identifier or "",
        'status': charge_item.status or "",
        'code': charge_item.code or "",
        'subject_id': charge_item.subject_id,
        'context_id': charge_item.context_id,
        'account_id': charge_item.account_id,
        'occurrence_datetime': charge_item.occurrence_datetime.isoformat() if charge_item.occurrence_datetime else None,
        'quantity_value': float(charge_item.quantity_value) if charge_item.quantity_value else None,
        'quantity_unit': charge_item.quantity_unit or "",
        'price_override_value': float(charge_item.price_override_value) if charge_item.price_override_value else None,
        'price_override_currency': charge_item.price_override_currency or "",
        'override_reason': charge_item.override_reason or "",
        'product_codeableconcept': charge_item.product_codeableconcept or "",
        'note': charge_item.note or "",
    }


def _charge_item_to_full_dict(charge_item: ChargeItem) -> Dict[str, Any]:
    """
    Convert ChargeItem to full detail dictionary (DTO).
    """
    return {
        'chargeitem_id': charge_item.chargeitem_id,
        'identifier': charge_item.identifier or "",
        'status': charge_item.status or "",
        'code': charge_item.code or "",
        'subject_id': charge_item.subject_id,
        'context_id': charge_item.context_id,
        'account_id': charge_item.account_id,
        'partof_id': charge_item.partof_id,
        'performing_organization_id': charge_item.performing_organization_id,
        'requesting_organization_id': charge_item.requesting_organization_id,
        'performer_actor_id': charge_item.performer_actor_id,
        'enterer_id': charge_item.enterer_id,
        'cost_center_id': charge_item.cost_center_id,
        'definition_uri': charge_item.definition_uri or "",
        'definition_canonical': charge_item.definition_canonical or "",
        'occurrence_datetime': charge_item.occurrence_datetime.isoformat() if charge_item.occurrence_datetime else None,
        'occurrence_period_start': charge_item.occurrence_period_start.isoformat() if charge_item.occurrence_period_start else None,
        'occurrence_period_end': charge_item.occurrence_period_end.isoformat() if charge_item.occurrence_period_end else None,
        'entered_date': charge_item.entered_date.isoformat() if charge_item.entered_date else None,
        'performer_function': charge_item.performer_function or "",
        'bodysite_code': charge_item.bodysite_code or "",
        'bodysite_system': charge_item.bodysite_system or "",
        'factor_override': charge_item.factor_override or "",
        'price_override_value': float(charge_item.price_override_value) if charge_item.price_override_value else None,
        'price_override_currency': charge_item.price_override_currency or "",
        'override_reason': charge_item.override_reason or "",
        'reason_code': charge_item.reason_code or "",
        'reason_system': charge_item.reason_system or "",
        'service_reference': charge_item.service_reference or "",
        'product_reference': charge_item.product_reference or "",
        'product_codeableconcept': charge_item.product_codeableconcept or "",
        'quantity_value': float(charge_item.quantity_value) if charge_item.quantity_value else None,
        'quantity_unit': charge_item.quantity_unit or "",
        'supporting_information': charge_item.supporting_information or "",
        'note': charge_item.note or "",
        'created_at': charge_item.created_at.isoformat() if hasattr(charge_item, 'created_at') else None,
        'updated_at': charge_item.updated_at.isoformat() if hasattr(charge_item, 'updated_at') else None,
    }


__all__ = [
    'MonitoringACL',
    'BillingACL',
    'DashboardACL',
]
