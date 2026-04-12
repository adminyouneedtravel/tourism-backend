from django.contrib import admin
from .models import (
    CustomPackage, PackagePaxConfig, PackageCity,
    PackageHotel, PackageFlight, PackageTransfer,
    PackageTour, PackageProfitMargin, PackagePricing
)


class PackagePaxConfigInline(admin.StackedInline):
    model = PackagePaxConfig
    extra = 0


class PackageCityInline(admin.TabularInline):
    model = PackageCity
    extra = 0


class PackageHotelInline(admin.TabularInline):
    model = PackageHotel
    extra = 0


class PackageFlightInline(admin.TabularInline):
    model = PackageFlight
    extra = 0


class PackageTransferInline(admin.TabularInline):
    model = PackageTransfer
    extra = 0


class PackageTourInline(admin.TabularInline):
    model = PackageTour
    extra = 0


class PackageProfitMarginInline(admin.TabularInline):
    model = PackageProfitMargin
    extra = 0


@admin.register(CustomPackage)
class CustomPackageAdmin(admin.ModelAdmin):
    list_display = ['title', 'agency', 'status', 'total_nights', 'currency_cost', 'currency_sell', 'created_at']
    list_filter = ['status', 'currency_cost', 'currency_sell']
    search_fields = ['title']
    inlines = [
        PackagePaxConfigInline,
        PackageCityInline,
        PackageFlightInline,
        PackageTransferInline,
        PackageTourInline,
        PackageProfitMarginInline,
    ]