from rest_framework import serializers
from ..models import Hotel
from apps.locations.models import City


class HotelSerializer(serializers.ModelSerializer):
    city_name = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name',
            'city',        # ID للكتابة والقراءة
            'city_name',   # اسم المدينة للعرض
            'country',     # اسم الدولة للعرض
            'address', 'stars', 'description', 'image'
        ]

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None