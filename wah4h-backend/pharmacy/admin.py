# pharmacy/admin.py
from django.contrib import admin
from .models import Prescription, InventoryItem, DispenseLog

admin.site.register(Prescription)
admin.site.register(InventoryItem)
admin.site.register(DispenseLog)
