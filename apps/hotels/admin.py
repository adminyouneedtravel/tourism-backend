# apps/hotels/admin.py

from django.contrib import admin
from .models import Hotel


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display  = ['name', 'city', 'stars']
    list_filter   = ['stars', 'city__country']
    search_fields = ['name', 'city__name']