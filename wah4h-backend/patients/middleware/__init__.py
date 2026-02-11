"""
WAH4PC Middleware Package

Provides Django middleware for WAH4PC interoperability features.

Modules:
- transaction_middleware: X-Transaction-ID propagation across requests
"""

from .transaction_middleware import (
    get_transaction_id,
    set_transaction_id,
    generate_transaction_id,
    TransactionIDMiddleware,
    TransactionIDContextManager,
    TransactionIDFilter,
)

__all__ = [
    'get_transaction_id',
    'set_transaction_id',
    'generate_transaction_id',
    'TransactionIDMiddleware',
    'TransactionIDContextManager',
    'TransactionIDFilter',
]
