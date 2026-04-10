from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import Season, RoomPrice
from .serializers import SeasonSerializer, RoomPriceSerializer


class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Season.objects.prefetch_related('prices').all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        return qs


class RoomPriceViewSet(viewsets.ModelViewSet):
    queryset = RoomPrice.objects.all()
    serializer_class = RoomPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = RoomPrice.objects.all()
        season_id = self.request.query_params.get('season')
        room_type_id = self.request.query_params.get('room_type')
        if season_id:
            qs = qs.filter(season_id=season_id)
        if room_type_id:
            qs = qs.filter(room_type_id=room_type_id)
        return qs