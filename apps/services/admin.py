from django.contrib import admin
from .models import ServiceCategory, Service


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display        = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display  = ['name', 'category', 'city', 'service_type', 'base_price', 'currency', 'is_optional', 'is_active']
    list_filter   = ['category', 'city__country', 'service_type', 'is_optional', 'is_active']
    search_fields = ['name', 'city__name']
