# apps/packages/admin.py

from django.contrib import admin
from .models import TourPackage, PackageCity, PackageCityHotel, PackageCityService


class PackageCityHotelInline(admin.TabularInline):
    model  = PackageCityHotel
    extra  = 1
    fields = ['hotel', 'nights', 'is_default']


class PackageCityServiceInline(admin.TabularInline):
    model  = PackageCityService
    extra  = 1
    fields = ['service', 'custom_price']


class PackageCityInline(admin.StackedInline):
    model   = PackageCity
    extra   = 1
    fields  = ['city', 'nights', 'min_nights', 'max_nights']
    show_change_link = True


@admin.register(TourPackage)
class TourPackageAdmin(admin.ModelAdmin):
    list_display        = ['name', 'base_price', 'currency', 'is_customizable', 'is_active']
    list_filter         = ['is_active', 'is_customizable', 'currency']
    search_fields       = ['name']
    prepopulated_fields = {'slug': ('name',)}
    inlines             = [PackageCityInline]


@admin.register(PackageCity)
class PackageCityAdmin(admin.ModelAdmin):
    list_display = ['package', 'city', 'nights']
    list_filter  = ['city__country']
    inlines      = [PackageCityHotelInline, PackageCityServiceInline]