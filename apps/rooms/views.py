# apps/rooms/views.py

from rest_framework import viewsets
from .models import RoomType
from .serializers import RoomTypeSerializer
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin


class RoomTypeViewSet(viewsets.ModelViewSet):
    serializer_class = RoomTypeSerializer

    def get_queryset(self):
        qs = RoomType.objects.select_related('hotel')
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        return qs.order_by('hotel', 'name')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]
