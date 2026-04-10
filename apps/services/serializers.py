from rest_framework import serializers
from .models import ServiceCategory, Service


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'description', 'icon']


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    city_name     = serializers.SerializerMethodField()

    class Meta:
        model  = Service
        fields = [
            'id', 'name', 'description', 'image',
            'category', 'category_name',
            'city', 'city_name',
            'service_type', 'base_price', 'currency',
            'price_per', 'discount_percentage',
            'vehicle_type', 'vehicle_capacity',
            'pickup_location', 'dropoff_location',
            'duration_hours', 'max_participants',
            'includes_guide', 'includes_meals',
            'meeting_point', 'extra_data',
            'is_optional', 'is_active',
            'relative_day', 'created_at',
        ]

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None
