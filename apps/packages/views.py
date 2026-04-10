from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from rest_framework.response import Response
from .models import TourPackage, PackageCity, PackageCityHotel, PackageCityService
from .serializers.serializers import (
    TourPackageSerializer, PackageCityWriteSerializer
)


class TourPackageViewSet(viewsets.ModelViewSet):
    queryset = TourPackage.objects.prefetch_related(
        'cities__hotels', 'cities__services',
        'cities__city', 'cities__city__country'
    ).all()
    serializer_class = TourPackageSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_serializer_context(self):
        return {'request': self.request}

    # POST /api/packages/{id}/add-city/
    @action(detail=True, methods=['post'], url_path='add-city')
    def add_city(self, request, pk=None):
        package = self.get_object()
        serializer = PackageCityWriteSerializer(data=request.data)
        if serializer.is_valid():
            pkg_city = serializer.save(package=package)
            return Response({'id': pkg_city.id, 'message': 'تمت إضافة المدينة'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE /api/packages/cities/{city_id}/
    @action(detail=False, methods=['delete'], url_path='cities/(?P<city_id>[^/.]+)')
    def remove_city(self, request, city_id=None):
        try:
            PackageCity.objects.filter(id=city_id).delete()
            return Response({'message': 'تم حذف المدينة'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)