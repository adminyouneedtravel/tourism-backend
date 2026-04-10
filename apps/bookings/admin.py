# apps/bookings/admin.py

from django.contrib import admin
from .models import Booking, BookingPerson, BookingCity, BookingHotel, BookingService


class BookingPersonInline(admin.TabularInline):
    model  = BookingPerson
    extra  = 1
    fields = ['person_type', 'name', 'age']


class BookingCityInline(admin.TabularInline):
    model  = BookingCity
    extra  = 1
    fields = ['city', 'nights', 'order']


class BookingServiceInline(admin.TabularInline):
    model  = BookingService
    extra  = 1
    fields = ['service', 'quantity', 'price_snapshot', 'currency_snapshot']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display   = [
        'reference_number', 'client_name', 'client_phone',
        'booking_type', 'status', 'total_price', 'currency',
        'agency', 'created_by', 'created_at',
    ]
    list_filter    = ['status', 'booking_type', 'currency', 'agency']
    search_fields  = ['reference_number', 'client_name', 'client_phone']
    readonly_fields = ['reference_number', 'created_at', 'updated_at']
    inlines        = [BookingPersonInline, BookingCityInline, BookingServiceInline]

    fieldsets = (
        ('معلومات الحجز', {
            'fields': ('reference_number', 'booking_type', 'status', 'package', 'agency', 'created_by')
        }),
        ('معلومات العميل', {
            'fields': ('client_name', 'client_phone', 'client_email', 'notes')
        }),
        ('الأفراد', {
            'fields': ('adults', 'children', 'infants')
        }),
        ('المالية', {
            'fields': ('total_price', 'currency', 'country')
        }),
        ('التواريخ', {
            'fields': ('created_at', 'updated_at')
        }),
    )