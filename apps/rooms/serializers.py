# apps/rooms/serializers.py

from rest_framework import serializers
from .models import RoomType


class RoomTypeSerializer(serializers.ModelSerializer):
    hotel_name = serializers.SerializerMethodField()

    class Meta:
        model  = RoomType
        fields = [
            'id', 'hotel', 'hotel_name', 'name',
            'max_occupancy', 'description', 'image',
            'breakfast_included',
        ]
        read_only_fields = ['id']

    def get_hotel_name(self, obj) -> str:
        return obj.hotel.name if obj.hotel else None