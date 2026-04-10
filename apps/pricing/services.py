from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from apps.pricing.models import Season, RoomPrice


def get_current_season(hotel):
    """الموسم النشط الآن للفندق."""
    today = timezone.localdate()
    return Season.objects.filter(
        hotel=hotel,
        valid_from__lte=today,
        valid_to__gte=today
    ).first()


def get_best_room_price(hotel, room_type, date=None):
    """
    إرجاع أفضل RoomPrice لفندق ونوع غرفة في تاريخ معين.
    يعيد None إذا لم يجد موسماً نشطاً.
    """
    from django.db.models import Q
    from apps.pricing.models import Season
    import datetime

    if date is None:
        date = timezone.localdate()

    season = Season.objects.filter(
        hotel=hotel,
        valid_from__lte=date,
        valid_to__gte=date
    ).first()

    if not season:
        return None

    return RoomPrice.objects.filter(
        season=season,
        room_type=room_type
    ).first()


def calculate_room_cost(room_price: RoomPrice, nights: int, rooms: int = 1) -> Decimal:
    """حساب تكلفة غرفة لعدد ليالٍ وغرف."""
    base = room_price.price_per_night
    if room_price.discount_percentage:
        discount = room_price.discount_percentage / Decimal('100')
        base = base * (Decimal('1') - discount)
    total = base * nights * rooms
    return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
