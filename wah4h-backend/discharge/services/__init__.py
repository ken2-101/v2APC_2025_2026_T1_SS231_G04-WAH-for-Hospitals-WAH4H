"""
Discharge Module Public Interface
=================================
Exposes the public services and ACLs for the Discharge App.

Consumers:
- Write Operations: Use DischargeService, ProcedureService
- Read Operations: Use DischargeACL, ProcedureACL
"""

from discharge.services.discharge_service import (
    DischargeService,
    ProcedureService,
)

from discharge.services.discharge_acl import (
    DischargeACL,
    ProcedureACL,
)

__all__ = [
    # Write Services
    'DischargeService',
    'ProcedureService',
    
    # Read ACLs
    'DischargeACL',
    'ProcedureACL',
]