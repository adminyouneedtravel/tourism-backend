from django.contrib import admin
from apps.providers.models import Provider, HotelMapping, ProviderPriceCache


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display  = ['name', 'provider_type', 'is_active', 'markup_percentage', 'priority']
    list_filter   = ['provider_type', 'is_active']
    list_editable = ['is_active', 'priority']
    search_fields = ['name']


@admin.register(HotelMapping)
class HotelMappingAdmin(admin.ModelAdmin):
    list_display  = ['hotel', 'provider', 'external_hotel_id', 'external_name', 'is_verified', 'last_synced']
    list_filter   = ['provider', 'is_verified']
    list_editable = ['is_verified']
    search_fields = ['hotel__name', 'external_hotel_id', 'external_name']
    autocomplete_fields = ['hotel']


@admin.register(ProviderPriceCache)
class ProviderPriceCacheAdmin(admin.ModelAdmin):
    list_display  = ['mapping', 'check_in', 'check_out', 'room_type', 'final_price', 'currency', 'expires_at']
    list_filter   = ['currency', 'is_available']
    readonly_fields = ['cached_at']
