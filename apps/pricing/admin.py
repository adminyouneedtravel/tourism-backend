# apps/pricing/admin.py

from django.contrib import admin
from .models import Season, RoomPrice, ExchangeRate


class RoomPriceInline(admin.TabularInline):
    model  = RoomPrice
    extra  = 1
    fields = [
        'room_type', 'price_per_night', 'discount_percentage',
        'breakfast_included', 'child_with_bed_price',
        'child_without_bed_price', 'infant_with_bed_price',
        'infant_without_bed_price',
    ]


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ['name', 'hotel', 'valid_from', 'valid_to']
    list_filter  = ['hotel']
    inlines      = [RoomPriceInline]


@admin.register(RoomPrice)
class RoomPriceAdmin(admin.ModelAdmin):
    list_display = ['season', 'room_type', 'price_per_night', 'breakfast_included']
    list_filter  = ['season__hotel', 'breakfast_included']


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display  = ['from_currency', 'to_currency', 'rate', 'valid_from', 'valid_to', 'is_active']
    list_filter   = ['from_currency', 'to_currency', 'is_active']
    list_editable = ['is_active']
    ordering      = ['-valid_from']
