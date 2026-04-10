from rest_framework import serializers
from .models import Season, RoomPrice


class RoomPriceSerializer(serializers.ModelSerializer):
    room_type_name = serializers.SerializerMethodField()

    class Meta:
        model = RoomPrice
        fields = [
            'id', 'season', 'room_type', 'room_type_name',
            'price_per_night', 'discount_percentage', 'breakfast_included',
            'child_with_bed_price', 'child_without_bed_price',
            'infant_with_bed_price', 'infant_without_bed_price',
        ]

    def get_room_type_name(self, obj):
        return obj.room_type.name if obj.room_type else None


class SeasonSerializer(serializers.ModelSerializer):
    prices = RoomPriceSerializer(many=True, read_only=True)
    hotel_name = serializers.SerializerMethodField()

    class Meta:
        model = Season
        fields = ['id', 'hotel', 'hotel_name', 'name', 'valid_from', 'valid_to', 'prices']

    def get_hotel_name(self, obj):
        return obj.hotel.name if obj.hotel else None