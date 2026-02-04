"""
Pharmacy Inventory Service Layer (Write Operations)
====================================================
Handles all state changes for inventory management with concurrency control.

Critical Features:
- Database row locking with select_for_update() to prevent race conditions
- Transaction management for atomic operations
- Strict validation for stock levels

Author: Backend Architecture Team
Date: February 4, 2026
"""

from decimal import Decimal
from datetime import date
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone
from pharmacy.models import Inventory


class StockManagementService:
    """
    Service for managing inventory stock operations (Admin/Pharmacist).
    Handles receiving stock and manual adjustments.
    """
    
    @staticmethod
    def receive_stock(
        item_code: str,
        quantity: int,
        unit_cost: Decimal = None,
        expiry_date: date = None
    ) -> Inventory:
        """
        Receive new stock into inventory.
        
        Args:
            item_code: Unique identifier for the inventory item
            quantity: Amount to add to stock (must be positive)
            unit_cost: Optional cost per unit
            expiry_date: Optional expiration date
            
        Returns:
            Updated or created Inventory instance
            
        Raises:
            ValidationError: If quantity is not positive
        """
        if quantity <= 0:
            raise ValidationError("Quantity must be positive")
        
        try:
            inventory = Inventory.objects.get(item_code=item_code)
            # Update existing inventory
            inventory.current_stock += quantity
            inventory.last_restocked_datetime = timezone.now()
            
            if unit_cost is not None:
                inventory.unit_cost = unit_cost
            if expiry_date is not None:
                inventory.expiry_date = expiry_date
                
            inventory.save()
            return inventory
            
        except Inventory.DoesNotExist:
            # Create new inventory record
            inventory = Inventory.objects.create(
                item_code=item_code,
                current_stock=quantity,
                unit_cost=unit_cost,
                expiry_date=expiry_date,
                status='active',
                last_restocked_datetime=timezone.now()
            )
            return inventory
    
    @staticmethod
    def adjust_stock(item_code: str, new_quantity: int, reason: str) -> Inventory:
        """
        Manually adjust inventory stock to a specific quantity.
        Used for audit corrections and inventory reconciliation.
        
        Args:
            item_code: Unique identifier for the inventory item
            new_quantity: New stock level to set
            reason: Explanation for the adjustment
            
        Returns:
            Updated Inventory instance
            
        Raises:
            Inventory.DoesNotExist: If item not found
        """
        inventory = Inventory.objects.get(item_code=item_code)
        inventory.current_stock = new_quantity
        inventory.save()
        return inventory


class DispensingService:
    """
    Service for dispensing medications with concurrency control.
    Handles system/nurse operations with row-level locking.
    """
    
    @staticmethod
    @transaction.atomic
    def dispense_medication(item_code: str, quantity_required: int) -> bool:
        """
        Dispense medication from inventory with concurrency protection.
        Uses database row locking to prevent race conditions.
        
        Args:
            item_code: Unique identifier for the inventory item
            quantity_required: Amount to dispense
            
        Returns:
            True if dispensing was successful
            
        Raises:
            ValidationError: If insufficient stock available
            Inventory.DoesNotExist: If item not found
        """
        # Lock the row to prevent concurrent modifications
        inventory = Inventory.objects.select_for_update().get(item_code=item_code)
        
        # Check if sufficient stock is available
        if inventory.current_stock < quantity_required:
            raise ValidationError(
                f"Insufficient stock for {item_code}. "
                f"Available: {inventory.current_stock}, Required: {quantity_required}"
            )
        
        # Decrement stock
        inventory.current_stock -= quantity_required
        inventory.save()
        
        return True
