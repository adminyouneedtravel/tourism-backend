from django.contrib import admin
from apps.providers.models import Provider, HotelMapping, ProviderPriceCache, ContractPrice


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display  = ['name', 'provider_type', 'is_active', 'markup_percentage', 'priority']
    list_filter   = ['provider_type', 'is_active']
    list_editable = ['is_active', 'priority']
    search_fields = ['name']


class ContractPriceInline(admin.TabularInline):
    model       = ContractPrice
    extra       = 1
    fields      = [
        'room_type', 'price_myr', 'extra_bed_price_myr',
        'min_pax', 'max_pax', 'includes_breakfast',
        'valid_from', 'valid_to', 'is_active', 'notes'
    ]
    ordering    = ['room_type', 'min_pax']


@admin.register(HotelMapping)
class HotelMappingAdmin(admin.ModelAdmin):
    list_display        = ['hotel', 'provider', 'external_hotel_id', 'external_name', 'is_verified', 'last_synced']
    list_filter         = ['provider', 'is_verified']
    list_editable       = ['is_verified']
    search_fields       = ['hotel__name', 'external_hotel_id', 'external_name']
    autocomplete_fields = ['hotel']
    inlines             = [ContractPriceInline]


@admin.register(ContractPrice)
class ContractPriceAdmin(admin.ModelAdmin):
    list_display  = [
        'mapping', 'room_type', 'price_myr', 'extra_bed_price_myr',
        'min_pax', 'max_pax', 'includes_breakfast',
        'valid_from', 'valid_to', 'is_active'
    ]
    list_filter   = ['room_type', 'is_active', 'includes_breakfast']
    list_editable = ['is_active']
    search_fields = ['mapping__hotel__name', 'mapping__external_name']
    ordering      = ['mapping__hotel__name', 'room_type', 'min_pax']
    date_hierarchy = 'valid_from'


@admin.register(ProviderPriceCache)
class ProviderPriceCacheAdmin(admin.ModelAdmin):
    list_display    = ['mapping', 'check_in', 'check_out', 'room_type', 'final_price', 'currency', 'expires_at']
    list_filter     = ['currency', 'is_available']
    readonly_fields = ['cached_at']