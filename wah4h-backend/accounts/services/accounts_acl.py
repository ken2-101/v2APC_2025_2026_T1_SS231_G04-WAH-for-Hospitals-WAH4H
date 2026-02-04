"""
accounts/services/accounts_acl.py

Read-Only Service Layer (ACL - Anti-Corruption Layer) for the accounts app.
This module provides a clean interface for external apps (Admission, Billing, etc.) 
to consume account data without directly touching models.

Architecture Pattern: Fortress Pattern - Read-Only DTOs
- External apps must NEVER import models directly from accounts
- All data is returned as dictionaries (DTOs)
- Strict separation between internal services.py (Write) and this ACL (Read)

Context: Philippine LGU Hospital System
"""

from typing import Dict, Any, Optional
from django.core.exceptions import ObjectDoesNotExist

from accounts.models import Practitioner, Location, Organization, PractitionerRole


class PractitionerACL:
    """
    Read-Only Service Layer for Practitioner data.
    
    Provides validation and data retrieval for practitioners without exposing
    the underlying model structure to external apps.
    """
    
    @staticmethod
    def validate_practitioner_exists(practitioner_id: int) -> bool:
        """
        Check if a practitioner exists in the system.
        
        Args:
            practitioner_id: Primary key of the practitioner
            
        Returns:
            bool: True if practitioner exists, False otherwise
        """
        try:
            Practitioner.objects.get(practitioner_id=practitioner_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_practitioner_summary(practitioner_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve practitioner summary as a DTO.
        
        Critical for Billing: Returns license_number for insurance claims.
        
        Args:
            practitioner_id: Primary key of the practitioner
            
        Returns:
            Dictionary with practitioner data or None if not found.
            
            DTO Fields:
                - id (int): Practitioner ID
                - full_name (str): Combined first + last name
                - license_number (str): Mapped from qualification_identifier (Critical for Billing)
                - specialty (str|None): From linked PractitionerRole.specialty_code if exists
                - active (bool): Practitioner active status
        """
        try:
            practitioner = Practitioner.objects.get(practitioner_id=practitioner_id)
            
            # Construct full name
            full_name = f"{practitioner.first_name} {practitioner.last_name}"
            
            # Get specialty from active PractitionerRole if exists
            specialty = None
            try:
                practitioner_role = PractitionerRole.objects.filter(
                    practitioner=practitioner,
                    active=True
                ).first()
                if practitioner_role:
                    specialty = practitioner_role.specialty_code
            except Exception:
                # Fail gracefully if PractitionerRole lookup fails
                pass
            
            return {
                'id': practitioner.practitioner_id,
                'full_name': full_name,
                'license_number': practitioner.qualification_identifier,
                'specialty': specialty,
                'active': practitioner.active
            }
        except ObjectDoesNotExist:
            return None


class LocationACL:
    """
    Read-Only Service Layer for Location data.
    
    Provides validation and data retrieval for locations (wards, rooms, etc.)
    without exposing the underlying model structure to external apps.
    """
    
    @staticmethod
    def validate_location_exists(location_id: int) -> bool:
        """
        Check if a location exists in the system.
        
        Args:
            location_id: Primary key of the location
            
        Returns:
            bool: True if location exists, False otherwise
        """
        try:
            Location.objects.get(location_id=location_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_location_summary(location_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve location summary as a DTO.
        
        Args:
            location_id: Primary key of the location
            
        Returns:
            Dictionary with location data or None if not found.
            
            DTO Fields:
                - id (int): Location ID
                - name (str): Location name
                - type_code (str): Location type (e.g., Ward, Room)
                - status (str): Location operational status
                - managing_organization_id (int|None): Managing organization ID
        """
        try:
            location = Location.objects.get(location_id=location_id)
            
            # Get managing organization ID if present
            managing_org_id = None
            if location.managing_organization:
                managing_org_id = location.managing_organization.organization_id
            
            return {
                'id': location.location_id,
                'name': location.name,
                'type_code': location.type_code,
                'status': location.status,
                'managing_organization_id': managing_org_id
            }
        except ObjectDoesNotExist:
            return None


class OrganizationACL:
    """
    Read-Only Service Layer for Organization data.
    
    Provides validation and data retrieval for organizations (hospitals, clinics)
    without exposing the underlying model structure to external apps.
    """
    
    @staticmethod
    def validate_organization_exists(organization_id: int) -> bool:
        """
        Check if an organization exists in the system.
        
        Args:
            organization_id: Primary key of the organization
            
        Returns:
            bool: True if organization exists, False otherwise
        """
        try:
            Organization.objects.get(organization_id=organization_id)
            return True
        except ObjectDoesNotExist:
            return False
    
    @staticmethod
    def get_organization_summary(organization_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieve organization summary as a DTO.
        
        Args:
            organization_id: Primary key of the organization
            
        Returns:
            Dictionary with organization data or None if not found.
            
            DTO Fields:
                - id (int): Organization ID
                - name (str): Organization name
                - type_code (str): Organization type code
        """
        try:
            organization = Organization.objects.get(organization_id=organization_id)
            
            return {
                'id': organization.organization_id,
                'name': organization.name,
                'type_code': organization.type_code
            }
        except ObjectDoesNotExist:
            return None
