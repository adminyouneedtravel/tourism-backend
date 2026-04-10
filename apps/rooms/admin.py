# apps/rooms/admin.py

from django.contrib import admin
from .models import RoomType


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display  = ['name', 'hotel', 'max_occupancy', 'breakfast_included']
    list_filter   = ['breakfast_included', 'hotel__city']
    search_fields = ['name', 'hotel__name']