from django.contrib import admin
from .models import Organization, Location, Practitioner, PractitionerRole, User, Endpoint, HealthcareService

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('organization_id', 'name', 'nhfr_code', 'type_code', 'active', 'status')
    search_fields = ('name', 'nhfr_code', 'type_code')
    list_filter = ('active', 'status')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('location_id', 'name', 'physical_type_code', 'type_code', 'operational_status', 'status')
    search_fields = ('name', 'physical_type_code', 'type_code')
    list_filter = ('operational_status', 'status', 'mode')

@admin.register(Practitioner)
class PractitionerAdmin(admin.ModelAdmin):
    list_display = ('practitioner_id', 'first_name', 'last_name', 'identifier', 'active', 'gender', 'status')
    search_fields = ('first_name', 'last_name', 'identifier')
    list_filter = ('active', 'gender', 'status')

@admin.register(PractitionerRole)
class PractitionerRoleAdmin(admin.ModelAdmin):
    list_display = ('practitioner_role_id', 'practitioner', 'organization', 'role_code', 'specialty_code', 'active', 'status')
    search_fields = ('practitioner__last_name', 'role_code', 'specialty_code')
    list_filter = ('active', 'status', 'role_code')

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('practitioner', 'username', 'email', 'role', 'status', 'last_login')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('role', 'status')

@admin.register(Endpoint)
class EndpointAdmin(admin.ModelAdmin):
    list_display = ('endpoint_id', 'name', 'connection_type', 'managing_organization', 'status')
    search_fields = ('name', 'connection_type', 'address')
    list_filter = ('status', 'connection_type')

@admin.register(HealthcareService)
class HealthcareServiceAdmin(admin.ModelAdmin):
    list_display = ('healthcare_service_id', 'name', 'category', 'type', 'provided_by', 'active', 'status')
    search_fields = ('name', 'category', 'type', 'specialty')
    list_filter = ('active', 'status', 'category')
