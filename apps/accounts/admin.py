# apps/accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display  = ['name', 'email', 'phone', 'currency', 'commission_rate', 'is_active', 'created_at']
    list_filter   = ['is_active', 'currency']
    search_fields = ['name', 'email', 'phone']
    list_editable = ['is_active', 'commission_rate']


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['username', 'email', 'role', 'agency', 'is_active']
    list_filter   = ['role', 'is_active', 'agency']
    search_fields = ['username', 'email', 'phone']
    list_editable = ['role']

    fieldsets = UserAdmin.fieldsets + (
        ('معلومات إضافية', {'fields': ('role', 'agency', 'phone', 'avatar')}),
    )