from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import Hotel
from .serializers.serializers import HotelSerializer

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated]
    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

