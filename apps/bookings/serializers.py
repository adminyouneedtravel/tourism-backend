from rest_framework import serializers
from .models import Booking, BookingPerson, BookingCity, BookingHotel, BookingService


class BookingPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPerson
        fields = ['id', 'person_type', 'age', 'name']


class BookingHotelSerializer(serializers.ModelSerializer):
    hotel_name  = serializers.SerializerMethodField()
    hotel_stars = serializers.SerializerMethodField()

    class Meta:
        model = BookingHotel
        fields = ['id', 'hotel', 'hotel_name', 'hotel_stars', 'room_price', 'nights', 'rooms_count']

    def get_hotel_name(self, obj):
        return obj.hotel.name if obj.hotel else None

    def get_hotel_stars(self, obj):
        return obj.hotel.stars if obj.hotel else None


class BookingCitySerializer(serializers.ModelSerializer):
    city_name    = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    hotels       = BookingHotelSerializer(many=True, read_only=True)

    class Meta:
        model = BookingCity
        fields = ['id', 'city', 'city_name', 'country_name', 'nights', 'order', 'hotels']

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country_name(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None


class BookingServiceSerializer(serializers.ModelSerializer):
    service_name     = serializers.SerializerMethodField()
    service_category = serializers.SerializerMethodField()
    is_optional      = serializers.SerializerMethodField()

    class Meta:
        model = BookingService
        fields = ['id', 'service', 'service_name', 'service_category', 'is_optional', 'quantity', 'price_snapshot']

    def get_service_name(self, obj):
        return obj.service.name if obj.service else None

    def get_service_category(self, obj):
        return obj.service.category.name if obj.service and obj.service.category else None

    def get_is_optional(self, obj):
        return obj.service.is_optional if obj.service else None


class BookingSerializer(serializers.ModelSerializer):
    persons      = BookingPersonSerializer(many=True, read_only=True)
    cities       = BookingCitySerializer(many=True, read_only=True)
    services     = BookingServiceSerializer(many=True, read_only=True)
    package_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    total_nights = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'booking_type', 'status',
            'package', 'package_name',
            'client_name', 'client_phone', 'client_email', 'notes',
            'adults', 'children', 'infants',
            'country', 'country_name',
            'total_price', 'currency',
            'total_nights',
            'persons', 'cities', 'services',
            'created_at', 'updated_at',
        ]

    def get_package_name(self, obj):
        return obj.package.name if obj.package else None

    def get_country_name(self, obj):
        return obj.country.name if obj.country else None

    def get_total_nights(self, obj):
        return sum(c.nights for c in obj.cities.all())


# ─── Write Serializer ─────────────────────────────────────
class BookingCreateSerializer(serializers.ModelSerializer):
    persons  = BookingPersonSerializer(many=True, required=False)
    cities   = serializers.ListField(child=serializers.DictField(), required=False)
    services = serializers.ListField(child=serializers.DictField(), required=False)

    class Meta:
        model = Booking
        fields = [
            'booking_type', 'package',
            'client_name', 'client_phone', 'client_email', 'notes',
            'adults', 'children', 'infants',
            'country', 'total_price', 'currency',
            'persons', 'cities', 'services',
        ]

    def create(self, validated_data):
        persons_data  = validated_data.pop('persons', [])
        cities_data   = validated_data.pop('cities', [])
        services_data = validated_data.pop('services', [])

        booking = Booking.objects.create(**validated_data)

        # أفراد
        for p in persons_data:
            BookingPerson.objects.create(booking=booking, **p)

        # مدن + فنادق
        for i, city_data in enumerate(cities_data):
            hotels_data = city_data.pop('hotels', [])
            booking_city = BookingCity.objects.create(
                booking=booking, order=i,
                city_id=city_data['city'],
                nights=city_data.get('nights', 1),
            )
            for h in hotels_data:
                BookingHotel.objects.create(
                    booking_city=booking_city,
                    hotel_id=h['hotel'],
                    room_price_id=h.get('room_price'),
                    nights=h.get('nights', city_data.get('nights', 1)),
                    rooms_count=h.get('rooms_count', 1),
                )

        # خدمات
        for s in services_data:
            BookingService.objects.create(
                booking=booking,
                service_id=s['service'],
                quantity=s.get('quantity', 1),
                price_snapshot=s.get('price_snapshot'),
            )

        return booking