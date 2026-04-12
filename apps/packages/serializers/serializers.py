from rest_framework import serializers
from ..models import (
    CustomPackage, PackagePaxConfig, PackageCity,
    PackageHotel, PackageFlight, PackageTransfer,
    PackageTour, PackageProfitMargin, PackagePricing
)


class PackagePaxConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagePaxConfig
        fields = ['id', 'adults_count', 'children_count', 'infants_count',
                  'extra_bed_children', 'extra_bed_infants']


class PackageHotelSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source='hotel.name', read_only=True)
    hotel_stars = serializers.IntegerField(source='hotel.stars', read_only=True)

    class Meta:
        model = PackageHotel
        fields = ['id', 'hotel', 'hotel_name', 'hotel_stars', 'room_type',
                  'rooms_count', 'check_in_date', 'check_out_date', 'nights',
                  'price_per_room_night_myr', 'source', 'api_reference_code', 'profit_margin_pct']


class PackageCitySerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    hotels = PackageHotelSerializer(many=True, read_only=True)

    class Meta:
        model = PackageCity
        fields = ['id', 'city', 'city_name', 'nights', 'order', 'hotels']


class PackageFlightSerializer(serializers.ModelSerializer):
    from_city_name = serializers.CharField(source='from_city.name', read_only=True)
    to_city_name = serializers.CharField(source='to_city.name', read_only=True)

    class Meta:
        model = PackageFlight
        fields = ['id', 'from_city', 'from_city_name', 'to_city', 'to_city_name',
                  'api_flight_code', 'price_adult_myr', 'price_child_myr', 'price_infant_myr', 'profit_margin_pct']


class PackageTransferSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = PackageTransfer
        fields = ['id', 'city', 'city_name', 'transfer_type', 'price_myr', 'profit_margin_pct']


class PackageTourSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model = PackageTour
        fields = ['id', 'city', 'city_name', 'tour_name',
                  'price_adult_myr', 'price_child_myr', 'price_infant_myr', 'profit_margin_pct']


class PackageProfitMarginSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageProfitMargin
        fields = ['id', 'pax_from', 'pax_to', 'profit_per_adult_eur',
                  'profit_per_child_eur', 'profit_per_infant_eur', 'b2b_discount_eur']


class PackagePricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackagePricing
        fields = ['id', 'pax_count', 'total_cost_myr', 'total_cost_eur',
                  'selling_price_b2c_eur', 'selling_price_b2b_eur',
                  'price_per_pax_b2c_eur', 'price_per_pax_b2b_eur', 'calculated_at']


class CustomPackageSerializer(serializers.ModelSerializer):
    pax_config = PackagePaxConfigSerializer(read_only=True)
    cities = PackageCitySerializer(many=True, read_only=True)
    flights = PackageFlightSerializer(many=True, read_only=True)
    transfers = PackageTransferSerializer(many=True, read_only=True)
    tours = PackageTourSerializer(many=True, read_only=True)
    profit_margins = PackageProfitMarginSerializer(many=True, read_only=True)
    pricing_table = PackagePricingSerializer(many=True, read_only=True)
    agency_name = serializers.CharField(source='agency.name', read_only=True)

    class Meta:
        model = CustomPackage
        fields = [
            'id', 'agency', 'agency_name', 'title', 'description', 'image',
            'total_nights', 'total_days', 'status',
            'peak_surcharge_pct', 'currency_cost', 'currency_sell',
            'is_custom_order', 'client_name', 'client_phone', 'client_email',
            'pax_config', 'cities', 'flights', 'transfers', 'tours',
            'profit_margins', 'pricing_table',
            'created_at', 'updated_at',
        ]