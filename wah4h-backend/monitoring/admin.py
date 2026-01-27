from django.contrib import admin
from .models import Observation, ChargeItem, ChargeItemDefinition, NutritionOrder

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ('observation_id', 'subject', 'code', 'value_quantity', 'effective_datetime')
    search_fields = ('subject__last_name', 'code')

@admin.register(ChargeItem)
class ChargeItemAdmin(admin.ModelAdmin):
    list_display = ('chargeitem_id', 'subject', 'code', 'quantity_value', 'entered_date')

@admin.register(ChargeItemDefinition)
class ChargeItemDefinitionAdmin(admin.ModelAdmin):
    list_display = ('chargeitemdefinition_id', 'url', 'title', 'code')

@admin.register(NutritionOrder)
class NutritionOrderAdmin(admin.ModelAdmin):
    list_display = ('nutrition_order_id', 'patient', 'oral_diet_type', 'status', 'datetime')
    search_fields = ('patient__last_name', 'oral_diet_type')
    list_filter = ('status', 'oral_diet_type')