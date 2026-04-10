# apps/locations/admin.py

from django.contrib import admin
from .models import Country, City


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display  = ['name']
    search_fields = ['name']


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display  = ['name', 'country']
    list_filter   = ['country']
    search_fields = ['name']