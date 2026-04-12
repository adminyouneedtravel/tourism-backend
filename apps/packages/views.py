from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import (
    CustomPackage, PackageCity, PackageHotel,
    PackagePaxConfig, PackageFlight, PackageTransfer,
    PackageTour, PackageProfitMargin, PackagePricing
)
from .services import calculate_package_price


class CustomPackageViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomPackage.objects.prefetch_related(
            'cities__hotels__hotel',
            'cities__city',
            'pax_config',
            'flights',
            'transfers',
            'tours',
            'profit_margins',
            'pricing_table',
        ).select_related('agency', 'country').all()

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        from .serializers.serializers import CustomPackageSerializer
        return CustomPackageSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    # ── إعداد الأفراد ──────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='set-pax')
    def set_pax(self, request, pk=None):
        package = self.get_object()
        data = request.data
        pax, _ = PackagePaxConfig.objects.update_or_create(
            package=package,
            defaults={
                'adults_count':       data.get('adults_count', 1),
                'children_count':     data.get('children_count', 0),
                'infants_count':      data.get('infants_count', 0),
                'extra_bed_children': data.get('extra_bed_children', False),
                'extra_bed_infants':  data.get('extra_bed_infants', False),
            }
        )
        from .serializers.serializers import PackagePaxConfigSerializer
        return Response(PackagePaxConfigSerializer(pax).data, status=status.HTTP_200_OK)

    # ── المدن ──────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='add-city')
    def add_city(self, request, pk=None):
        package = self.get_object()
        from apps.locations.models import City
        city = get_object_or_404(City, pk=request.data.get('city_id'))
        if package.country and city.country != package.country:
            return Response(
                {'error': 'المدينة لا تنتمي لدولة الباقة'},
                status=status.HTTP_400_BAD_REQUEST
            )
        pkg_city, created = PackageCity.objects.get_or_create(
            package=package,
            city=city,
            defaults={
                'nights': request.data.get('nights', 1),
                'order':  request.data.get('order', package.cities.count() + 1),
            }
        )
        if not created:
            return Response({'error': 'المدينة موجودة مسبقاً في الباقة'}, status=status.HTTP_400_BAD_REQUEST)
        from .serializers.serializers import PackageCitySerializer
        return Response(PackageCitySerializer(pkg_city).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remove-city/(?P<city_id>[^/.]+)')
    def remove_city(self, request, pk=None, city_id=None):
        package = self.get_object()
        PackageCity.objects.filter(package=package, id=city_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── الفنادق ────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='add-hotel')
    def add_hotel(self, request, pk=None):
        package = self.get_object()
        from apps.hotels.models import Hotel
        from django.core.exceptions import ValidationError
        pkg_city = get_object_or_404(PackageCity, pk=request.data.get('package_city_id'), package=package)
        hotel    = get_object_or_404(Hotel, pk=request.data.get('hotel_id'))
        pkg_hotel = PackageHotel(
            package_city            = pkg_city,
            hotel                   = hotel,
            room_type               = request.data.get('room_type', ''),
            rooms_count             = request.data.get('rooms_count', 1),
            check_in_date           = request.data.get('check_in_date'),
            check_out_date          = request.data.get('check_out_date'),
            nights                  = request.data.get('nights', 1),
            price_per_room_night_myr= request.data.get('price_per_room_night_myr', 0),
            source                  = request.data.get('source', 'manual'),
            profit_margin_pct       = request.data.get('profit_margin_pct', 20),
        )
        try:
            pkg_hotel.full_clean()
            pkg_hotel.save()
        except ValidationError as e:
            return Response({'error': e.message_dict}, status=status.HTTP_400_BAD_REQUEST)
        from .serializers.serializers import PackageHotelSerializer
        return Response(PackageHotelSerializer(pkg_hotel).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='remove-hotel/(?P<hotel_id>[^/.]+)')
    def remove_hotel(self, request, pk=None, hotel_id=None):
        package = self.get_object()
        PackageHotel.objects.filter(package_city__package=package, id=hotel_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ── الطيران ────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='add-flight')
    def add_flight(self, request, pk=None):
        package = self.get_object()
        from apps.locations.models import City
        flight = PackageFlight.objects.create(
            package          = package,
            from_city        = get_object_or_404(City, pk=request.data.get('from_city_id')),
            to_city          = get_object_or_404(City, pk=request.data.get('to_city_id')),
            api_flight_code  = request.data.get('api_flight_code', ''),
            price_adult_myr  = request.data.get('price_adult_myr', 0),
            price_child_myr  = request.data.get('price_child_myr', 0),
            price_infant_myr  = request.data.get('price_infant_myr', 0),
            profit_margin_pct = request.data.get('profit_margin_pct', 15),
        )
        from .serializers.serializers import PackageFlightSerializer
        return Response(PackageFlightSerializer(flight).data, status=status.HTTP_201_CREATED)

    # ── النقل ──────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='add-transfer')
    def add_transfer(self, request, pk=None):
        package = self.get_object()
        from apps.locations.models import City
        transfer = PackageTransfer.objects.create(
            package       = package,
            city          = get_object_or_404(City, pk=request.data.get('city_id')),
            transfer_type = request.data.get('transfer_type', 'local'),
            price_myr         = request.data.get('price_myr', 0),
            profit_margin_pct = request.data.get('profit_margin_pct', 25),
        )
        from .serializers.serializers import PackageTransferSerializer
        return Response(PackageTransferSerializer(transfer).data, status=status.HTTP_201_CREATED)

    # ── الجولات ────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='add-tour')
    def add_tour(self, request, pk=None):
        package = self.get_object()
        from apps.locations.models import City
        tour = PackageTour.objects.create(
            package          = package,
            city             = get_object_or_404(City, pk=request.data.get('city_id')),
            tour_name        = request.data.get('tour_name', ''),
            price_adult_myr  = request.data.get('price_adult_myr', 0),
            price_child_myr  = request.data.get('price_child_myr', 0),
            price_infant_myr  = request.data.get('price_infant_myr', 0),
            profit_margin_pct = request.data.get('profit_margin_pct', 15),
        )
        from .serializers.serializers import PackageTourSerializer
        return Response(PackageTourSerializer(tour).data, status=status.HTTP_201_CREATED)

    # ── التسعير ────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='calculate-price')
    def calculate_price(self, request, pk=None):
        package = self.get_object()
        result  = calculate_package_price(package)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='pricing')
    def pricing(self, request, pk=None):
        package  = self.get_object()
        from .serializers.serializers import PackagePricingSerializer
        pricing  = PackagePricing.objects.filter(package=package).order_by('pax_count')
        return Response(PackagePricingSerializer(pricing, many=True).data)

    # ── الحالة ─────────────────────────────────────────────────

    @action(detail=True, methods=['get'], url_path='best-hotel-price')
    def best_hotel_price(self, request, pk=None):
        """
        يرجع أفضل سعر لفندق محدد (ContractPrice vs API)
        params: hotel_id, room_type, check_in, check_out, pax_count
        """
        from apps.hotels.models import Hotel
        from apps.providers.services import get_best_hotel_price
        hotel_id   = request.query_params.get('hotel_id')
        room_type  = request.query_params.get('room_type', 'superior')
        check_in   = request.query_params.get('check_in')
        check_out  = request.query_params.get('check_out')
        pax_count  = int(request.query_params.get('pax_count', 2))

        if not hotel_id or not check_in or not check_out:
            return Response({'error': 'hotel_id, check_in, check_out مطلوبة'}, status=400)

        try:
            from datetime import date
            hotel = Hotel.objects.get(pk=hotel_id)
            ci = date.fromisoformat(check_in)
            co = date.fromisoformat(check_out)
            result = get_best_hotel_price(hotel, room_type, ci, co, pax_count)
            if result:
                return Response({
                    'hotel_id':          hotel.id,
                    'hotel_name':        hotel.name,
                    'price_myr':         str(result['price']),
                    'source':            result['source'],
                    'includes_breakfast':result['includes_breakfast'],
                    'extra_bed_price':   str(result['extra_bed_price']),
                })
            return Response({'price_myr': None, 'source': None})
        except Hotel.DoesNotExist:
            return Response({'error': 'الفندق غير موجود'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        package = self.get_object()
        if not hasattr(package, 'pax_config'):
            return Response({'error': 'يجب تحديد إعداد الأفراد أولاً'}, status=status.HTTP_400_BAD_REQUEST)
        if not package.cities.exists():
            return Response({'error': 'يجب إضافة مدينة واحدة على الأقل'}, status=status.HTTP_400_BAD_REQUEST)
        package.status = 'published'
        package.save()
        return Response({'status': 'published'})

    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        package = self.get_object()
        package.status = 'archived'
        package.save()
        return Response({'status': 'archived'})