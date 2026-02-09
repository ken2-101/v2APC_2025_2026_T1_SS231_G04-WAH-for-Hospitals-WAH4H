"""
accounts/services/__init__.py

Public Interface for the Accounts Service Layer.

Exports:
1. Internal Services (Write/Admin): For use within the accounts app or admin dashboards.
2. ACLs (Read-Only): For use by external apps (Admission, Billing) via the Fortress Pattern.
"""

# Internal Services (Write Operations & Business Logic)
from .accounts_services import (
    OrganizationService,
    LocationService,
    PractitionerService,
    PractitionerRoleService,
)

# Anti-Corruption Layer (Read-Only DTOs for External Apps)
from .accounts_acl import (
    PractitionerACL,
    LocationACL,
    OrganizationACL,
)

# Expose the ACL module itself for namespace usage 
# (e.g., usage: from accounts.services import accounts_acl)
from . import accounts_acl

__all__ = [
    # Internal Services
    'OrganizationService',
    'LocationService',
    'PractitionerService',
    'PractitionerRoleService',

    # ACL Classes
    'PractitionerACL',
    'LocationACL',
    'OrganizationACL',
    
    # ACL Module Namespace
    'accounts_acl',
]