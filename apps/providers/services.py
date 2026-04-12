from decimal import Decimal
from django.utils import timezone
from apps.providers.models import HotelMapping, ContractPrice, ProviderPriceCache


def get_best_hotel_price(hotel, room_type, check_in, check_out, pax_count):
    """
    يقارن سعر العقد المباشر مع سعر الـ API ويرجع الأقل.

    Returns:
        dict: {
            'price': Decimal,
            'source': 'contract' | 'api' | None,
            'includes_breakfast': bool,
            'extra_bed_price': Decimal,
        }
        أو None إذا لم يوجد أي سعر.
    """
    contract_price = _get_contract_price(hotel, room_type, check_in, pax_count)
    api_price      = _get_api_price(hotel, room_type, check_in, check_out)

    if contract_price and api_price:
        if contract_price['price'] <= api_price['price']:
            return contract_price
        return api_price

    if contract_price:
        return contract_price

    if api_price:
        return api_price

    return None


def _get_contract_price(hotel, room_type, check_in, pax_count):
    """
    يجلب سعر العقد المباشر الفعّال لهذا الفندق.
    """
    try:
        mapping = HotelMapping.objects.get(hotel=hotel, provider__is_active=True)
    except HotelMapping.DoesNotExist:
        return None

    contract = ContractPrice.objects.filter(
        mapping=mapping,
        room_type=room_type,
        min_pax__lte=pax_count,
        max_pax__gte=pax_count,
        valid_from__lte=check_in,
        valid_to__gte=check_in,
        is_active=True,
    ).first()

    if not contract:
        return None

    return {
        'price':              contract.price_myr,
        'source':             'contract',
        'includes_breakfast': contract.includes_breakfast,
        'extra_bed_price':    contract.extra_bed_price_myr,
    }


def _get_api_price(hotel, room_type, check_in, check_out):
    """
    يجلب أحدث سعر من الـ API Cache لهذا الفندق.
    """
    now = timezone.now()

    cache = ProviderPriceCache.objects.filter(
        mapping__hotel=hotel,
        room_type=room_type,
        check_in=check_in,
        check_out=check_out,
        is_available=True,
        expires_at__gt=now,
    ).order_by('final_price').first()

    if not cache:
        return None

    return {
        'price':              cache.final_price,
        'source':             'api',
        'includes_breakfast': False,
        'extra_bed_price':    Decimal('0.00'),
    }

def index_hotel(hotel):
    """فهرسة الفندق في UnifiedSearchIndex"""
    from apps.providers.models import UnifiedSearchIndex
    UnifiedSearchIndex.objects.update_or_create(
        content_type='hotel',
        object_id=hotel.id,
        defaults={
            'name':            hotel.name,
            'name_normalized': hotel.name.lower().strip(),
            'city':            hotel.city,
            'country':         hotel.city.country if hotel.city else None,
            'base_price':      None,
            'currency':        'MYR',
            'is_active':       hotel.is_active,
        }
    )


def index_service(service):
    """فهرسة الخدمة في UnifiedSearchIndex"""
    from apps.providers.models import UnifiedSearchIndex
    UnifiedSearchIndex.objects.update_or_create(
        content_type='service',
        object_id=service.id,
        defaults={
            'name':            service.name,
            'name_normalized': service.name.lower().strip(),
            'city':            service.city,
            'country':         service.city.country if service.city else None,
            'base_price':      service.base_price,
            'currency':        service.currency,
            'is_active':       service.is_active,
        }
    )
