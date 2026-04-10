from rest_framework import serializers
from ..models import TourPackage, PackageCity, PackageCityHotel, PackageCityService


class PackageCityServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()
    service_category = serializers.SerializerMethodField()

    class Meta:
        model = PackageCityService
        fields = ['id', 'service', 'service_name', 'service_category', 'custom_price']

    def get_service_name(self, obj):
        return obj.service.name if obj.service else None

    def get_service_category(self, obj):
        return obj.service.category.name if obj.service and obj.service.category else None


class PackageCityHotelSerializer(serializers.ModelSerializer):
    hotel_name = serializers.SerializerMethodField()
    hotel_stars = serializers.SerializerMethodField()
    hotel_image = serializers.SerializerMethodField()

    class Meta:
        model = PackageCityHotel
        fields = ['id', 'hotel', 'hotel_name', 'hotel_stars', 'hotel_image', 'nights']

    def get_hotel_name(self, obj):
        return obj.hotel.name if obj.hotel else None

    def get_hotel_stars(self, obj):
        return obj.hotel.stars if obj.hotel else None

    def get_hotel_image(self, obj):
        req = self.context.get('request')
        if obj.hotel and obj.hotel.image:
            return req.build_absolute_uri(obj.hotel.image.url) if req else obj.hotel.image.url
        return None


class PackageCitySerializer(serializers.ModelSerializer):
    city_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    city_image = serializers.SerializerMethodField()
    hotels = PackageCityHotelSerializer(many=True, read_only=True)
    services = PackageCityServiceSerializer(many=True, read_only=True)

    class Meta:
        model = PackageCity
        fields = ['id', 'city', 'city_name', 'country_name', 'city_image', 'nights', 'min_nights', 'max_nights', 'hotels', 'services']

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country_name(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None

    def get_city_image(self, obj):
        req = self.context.get('request')
        if obj.city and obj.city.image:
            return req.build_absolute_uri(obj.city.image.url) if req else obj.city.image.url
        return None


class TourPackageSerializer(serializers.ModelSerializer):
    cities = PackageCitySerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    total_nights = serializers.SerializerMethodField()
    cities_count = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()

    class Meta:
        model = TourPackage
        fields = [
            'id', 'name', 'slug', 'description',
            'base_price', 'currency', 'discount_percentage',
            'image', 'image_url', 'highlights', 'is_active', 'is_customizable',
            'cities', 'total_nights', 'cities_count', 'final_price',
        ]

    def get_image_url(self, obj):
        req = self.context.get('request')
        if obj.image:
            return req.build_absolute_uri(obj.image.url) if req else obj.image.url
        return None

    def get_total_nights(self, obj):
        return sum(c.nights for c in obj.cities.all())

    def get_cities_count(self, obj):
        return obj.cities.count()

    def get_final_price(self, obj):
        if obj.discount_percentage:
            return float(obj.base_price) * (1 - float(obj.discount_percentage) / 100)
        return float(obj.base_price)


# ─── Write Serializers ─────────────────────────────────────
class PackageCityServiceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageCityService
        fields = ['service', 'custom_price']


class PackageCityHotelWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageCityHotel
        fields = ['hotel', 'nights']


class PackageCityWriteSerializer(serializers.ModelSerializer):
    hotels = PackageCityHotelWriteSerializer(many=True, required=False)
    services = PackageCityServiceWriteSerializer(many=True, required=False)

    class Meta:
        model = PackageCity
        fields = ['city', 'nights', 'hotels', 'services']

    def create(self, validated_data):
        hotels_data = validated_data.pop('hotels', [])
        services_data = validated_data.pop('services', [])
        pkg_city = PackageCity.objects.create(**validated_data)
        for h in hotels_data:
            PackageCityHotel.objects.create(package_city=pkg_city, **h)
        for s in services_data:
            PackageCityService.objects.create(package_city=pkg_city, **s)
        return pkg_city