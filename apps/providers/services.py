from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from datetime import timedelta
from apps.providers.models import Provider, HotelMapping, ProviderPriceCache
from apps.bookings.services import apply_markup
import logging

logger = logging.getLogger('apps.providers')


class ProviderUnavailableError(Exception):
    pass


class BaseProviderAdapter:
    """
    Abstract base class لكل مزود خارجي.
    كل مزود جديد يرث من هذه الكلاس ويطبق fetch_prices().
    """
    def __init__(self, provider: Provider):
        self.provider = provider

    def fetch_prices(self, external_hotel_id: str, check_in, check_out) -> list:
        """
        يُرجع قائمة من:
        [{'room_type': str, 'price': Decimal, 'currency': str, 'available': bool}]
        """
        raise NotImplementedError("كل مزود يجب أن يطبق fetch_prices()")

    def apply_provider_markup(self, price: Decimal) -> Decimal:
        """تطبيق Markup المزود على السعر الخام."""
        if self.provider.markup_percentage and self.provider.markup_percentage > 0:
            return apply_markup(price, self.provider.markup_percentage)
        return price


class DirectContractAdapter(BaseProviderAdapter):
    """
    مزود العقود المباشرة — الأسعار مدخلة يدوياً في النظام.
    لا يحتاج API call، يجلب من pricing.models مباشرة.
    """
    def fetch_prices(self, external_hotel_id: str, check_in, check_out) -> list:
        from apps.pricing.services import get_best_room_price
        from apps.hotels.models import Hotel
        from apps.rooms.models import RoomType

        try:
            hotel = Hotel.objects.get(pk=external_hotel_id)
        except Hotel.DoesNotExist:
            return []

        results = []
        for room_type in RoomType.objects.filter(hotel=hotel):
            room_price = get_best_room_price(hotel, room_type, check_in)
            if room_price:
                final_price = self.apply_provider_markup(room_price.price_per_night)
                results.append({
                    'room_type': room_type.name,
                    'price': final_price,
                    'currency': 'MYR',
                    'available': True,
                    'breakfast_included': room_price.breakfast_included,
                })
        return results


class AgodaAdapter(BaseProviderAdapter):
    """
    Placeholder لـ Agoda API.
    يُفعَّل عند توفر API credentials حقيقية.
    """
    def fetch_prices(self, external_hotel_id: str, check_in, check_out) -> list:
        if not self.provider.api_key:
            raise ProviderUnavailableError("Agoda API key غير مضبوط")
        # TODO: تطبيق Agoda API call الفعلي
        # import requests
        # response = requests.get(self.provider.api_endpoint, ...)
        logger.info(f"Agoda adapter: fetch for hotel {external_hotel_id} (placeholder)")
        return []


PROVIDER_ADAPTERS = {
    'direct':  DirectContractAdapter,
    'agoda':   AgodaAdapter,
    'booking': BaseProviderAdapter,  # placeholder
    'expedia': BaseProviderAdapter,  # placeholder
}


def get_adapter(provider: Provider) -> BaseProviderAdapter:
    """Factory — يُرجع الـ Adapter المناسب للمزود."""
    adapter_class = PROVIDER_ADAPTERS.get(provider.provider_type, BaseProviderAdapter)
    return adapter_class(provider)


def get_cached_prices(mapping: HotelMapping, check_in, check_out):
    """جلب الأسعار من الـ Cache إذا لم تنتهِ صلاحيتها."""
    now = timezone.now()
    return ProviderPriceCache.objects.filter(
        mapping=mapping,
        check_in=check_in,
        check_out=check_out,
        expires_at__gt=now,
        is_available=True,
    )


def save_price_to_cache(mapping: HotelMapping, check_in, check_out,
                        room_type: str, raw_price: Decimal,
                        final_price: Decimal, currency: str,
                        cache_minutes: int = 60):
    """حفظ السعر في الـ Cache."""
    expires_at = timezone.now() + timedelta(minutes=cache_minutes)
    obj, _ = ProviderPriceCache.objects.update_or_create(
        mapping=mapping,
        check_in=check_in,
        check_out=check_out,
        room_type=room_type,
        defaults={
            'raw_price': raw_price,
            'final_price': final_price,
            'currency': currency,
            'expires_at': expires_at,
            'is_available': True,
        }
    )
    return obj


def aggregate_hotel_prices(hotel, check_in, check_out) -> list:
    """
    جمع الأسعار من جميع المزودين النشطين للفندق.
    الترتيب: Redis Cache → DB Cache → API Live
    """
    from apps.core.cache_service import get_hotel_prices, set_hotel_prices

    check_in_str  = str(check_in)
    check_out_str = str(check_out)

    # 1. تحقق من Redis أولاً
    cached_result = get_hotel_prices(hotel.pk, check_in_str, check_out_str)
    if cached_result is not None:
        logger.debug(f"Redis HIT: hotel={hotel.pk} {check_in_str}→{check_out_str}")
        return cached_result

    logger.debug(f"Redis MISS: hotel={hotel.pk} — fetching from providers")
    results = []

    mappings = HotelMapping.objects.filter(
        hotel=hotel,
        provider__is_active=True,
        is_verified=True,
    ).select_related('provider').order_by('provider__priority')

    for mapping in mappings:
        # 2. تحقق من DB Cache
        db_cached = get_cached_prices(mapping, check_in, check_out)
        if db_cached.exists():
            for c in db_cached:
                results.append({
                    'provider':      mapping.provider.name,
                    'provider_type': mapping.provider.provider_type,
                    'room_type':     c.room_type,
                    'price':         c.final_price,
                    'currency':      c.currency,
                    'source':        'db_cache',
                })
            continue

        # 3. استدعاء API
        try:
            adapter = get_adapter(mapping.provider)
            prices  = adapter.fetch_prices(mapping.external_hotel_id, check_in, check_out)

            for p in prices:
                save_price_to_cache(
                    mapping=mapping,
                    check_in=check_in,
                    check_out=check_out,
                    room_type=p['room_type'],
                    raw_price=p['price'],
                    final_price=p['price'],
                    currency=p.get('currency', 'MYR'),
                )
                results.append({
                    'provider':      mapping.provider.name,
                    'provider_type': mapping.provider.provider_type,
                    'room_type':     p['room_type'],
                    'price':         p['price'],
                    'currency':      p.get('currency', 'MYR'),
                    'source':        'live',
                })

        except ProviderUnavailableError as e:
            logger.warning(f"Provider {mapping.provider.name} غير متاح: {e}")
        except Exception as e:
            logger.error(f"خطأ في جلب أسعار {mapping.provider.name}: {e}")

    results.sort(key=lambda x: x['price'])

    # 4. حفظ في Redis للطلبات القادمة
    if results:
        set_hotel_prices(hotel.pk, check_in_str, check_out_str, results)

    return results


def cached_unified_search(query: str, city_id: int = None, content_type: str = None) -> list:
    """unified_search مع Redis Cache."""
    from apps.core.cache_service import get_search_results, set_search_results

    cached = get_search_results(query, city_id, content_type)
    if cached is not None:
        logger.debug(f"Redis HIT: search='{query}'")
        return cached

    results = unified_search(query, city_id, content_type)
    result_data = [
        {
            'id':           r.pk,
            'content_type': r.content_type,
            'name':         r.name,
            'city':         r.city.name if r.city else None,
            'country':      r.country.name if r.country else None,
            'base_price':   str(r.base_price) if r.base_price else None,
            'currency':     r.currency,
        }
        for r in results
    ]
    set_search_results(query, result_data, city_id, content_type)
    return result_data


def index_hotel(hotel):
    """إضافة أو تحديث فندق في الفهرس الموحد."""
    from apps.providers.models import UnifiedSearchIndex
    from apps.pricing.services import get_current_season
    from apps.rooms.models import RoomType

    min_price = None
    for room_type in RoomType.objects.filter(hotel=hotel):
        rp = get_current_season(hotel)
        if rp:
            from apps.pricing.models import RoomPrice
            price = RoomPrice.objects.filter(
                season=rp, room_type=room_type
            ).values_list('price_per_night', flat=True).first()
            if price and (min_price is None or price < min_price):
                min_price = price

    tags = [hotel.name, hotel.city.name, hotel.city.country.name]
    tags += [f"{hotel.stars} نجوم"]
    if hotel.amenities:
        tags += hotel.amenities

    UnifiedSearchIndex.objects.update_or_create(
        content_type='hotel',
        object_id=hotel.pk,
        defaults={
            'name':             hotel.name,
            'name_normalized':  hotel.name.lower().strip(),
            'city':             hotel.city,
            'country':          hotel.city.country,
            'base_price':       min_price,
            'currency':         'MYR',
            'is_active':        hotel.is_active,
            'search_tags':      tags,
        }
    )


def index_service(service):
    """إضافة أو تحديث خدمة في الفهرس الموحد."""
    from apps.providers.models import UnifiedSearchIndex

    tags = [service.name, service.city.name, service.category.name]

    UnifiedSearchIndex.objects.update_or_create(
        content_type='service',
        object_id=service.pk,
        defaults={
            'name':             service.name,
            'name_normalized':  service.name.lower().strip(),
            'city':             service.city,
            'country':          service.city.country,
            'base_price':       service.base_price,
            'currency':         service.currency,
            'is_active':        service.is_active,
            'search_tags':      tags,
        }
    )


def unified_search(query: str, city_id: int = None, content_type: str = None,
                   min_price=None, max_price=None) -> list:
    """
    بحث موحد في الفنادق والخدمات والباقات.
    يُرجع نتائج مرتبة حسب الصلة.
    """
    from apps.providers.models import UnifiedSearchIndex
    from django.db.models import Q

    qs = UnifiedSearchIndex.objects.filter(is_active=True)

    if query:
        qs = qs.filter(
            Q(name_normalized__icontains=query.lower()) |
            Q(search_tags__icontains=query)
        )
    if city_id:
        qs = qs.filter(city_id=city_id)
    if content_type:
        qs = qs.filter(content_type=content_type)
    if min_price is not None:
        qs = qs.filter(base_price__gte=min_price)
    if max_price is not None:
        qs = qs.filter(base_price__lte=max_price)

    return list(qs.select_related('city', 'country', 'provider').order_by('base_price'))
