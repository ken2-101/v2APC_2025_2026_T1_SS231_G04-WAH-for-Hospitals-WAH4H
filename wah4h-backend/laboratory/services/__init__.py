"""
laboratory/services/__init__.py

Public Interface for the Laboratory Service Layer.

Exports:
1. ACLs (Read-Only): For use by external apps (Billing, Admission) via the Fortress Pattern.
"""

# Anti-Corruption Layer (Read-Only DTOs for External Apps)
from .laboratory_acl import (
    LabCatalogACL,
    LabReportACL,
)

# Expose the ACL module itself for namespace usage
# (e.g., usage: from laboratory.services import laboratory_acl)
from . import laboratory_acl

__all__ = [
    # ACL Classes
    'LabCatalogACL',
    'LabReportACL',
    
    # ACL Module Namespace
    'laboratory_acl',
]