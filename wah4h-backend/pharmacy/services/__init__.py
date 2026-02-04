"""
pharmacy/services/__init__.py

Public Interface for the Pharmacy Service Layer.

Exports:
1. ACLs (Read-Only): For use by external apps (Billing, Admission) via the Fortress Pattern.
"""

# Anti-Corruption Layer (Read-Only DTOs for External Apps)
from .pharmacy_acl import (
    InventoryACL,
    MedicationRequestACL,
    MedicationACL,
)

# Expose the ACL module itself for namespace usage
# (e.g., usage: from pharmacy.services import pharmacy_acl)
from . import pharmacy_acl

__all__ = [
    # ACL Classes
    'InventoryACL',
    'MedicationRequestACL',
    'MedicationACL',
    
    # ACL Module Namespace
    'pharmacy_acl',
]