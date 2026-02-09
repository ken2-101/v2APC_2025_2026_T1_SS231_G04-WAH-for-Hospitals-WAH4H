"""
Discharge Module Public Interface
=================================
Exposes the public services and ACLs for the Discharge App.

Consumers:
- Write Operations: Use DischargeWorkflowService, ProcedureService
- Read Operations: Use DischargeACL, ProcedureACL
"""

from .discharge_services import (
    DischargeWorkflowService,
    ProcedureService,
)

from .discharge_acl import (
    DischargeACL,
    ProcedureACL,
)

__all__ = [
    # Write Services
    'DischargeWorkflowService',
    'ProcedureService',
    
    # Read ACLs
    'DischargeACL',
    'ProcedureACL',
]