from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from apps.accounts.models import Agency
from apps.pricing.models import RoomPrice, Season
from apps.bookings.models import Booking, BookingHotel, BookingService
import datetime


def get_active_season(hotel, check_date=None):
    """إرجاع الموسم النشط للفندق في تاريخ معين."""
    if check_date is None:
        check_date = datetime.date.today()
    return Season.objects.filter(
        hotel=hotel,
        valid_from__lte=check_date,
        valid_to__gte=check_date
    ).first()


def apply_commission(base_price: Decimal, commission_rate: Decimal) -> Decimal:
    """
    تطبيق نسبة العمولة على السعر الأساسي.
    base_price: السعر من النظام
    commission_rate: نسبة مئوية (مثلاً 10.00 تعني 10%)
    يُرجع السعر بعد إضافة العمولة.
    """
    if not commission_rate or commission_rate <= 0:
        return base_price
    multiplier = Decimal('1') + (commission_rate / Decimal('100'))
    result = base_price * multiplier
    return result.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def apply_markup(base_price: Decimal, markup_percentage: Decimal) -> Decimal:
    """
    تطبيق Markup فوق السعر (مثل commission لكن من جانب الإدارة).
    """
    return apply_commission(base_price, markup_percentage)


def apply_discount(base_price: Decimal, discount_percentage: Decimal) -> Decimal:
    """تطبيق خصم على السعر."""
    if not discount_percentage or discount_percentage <= 0:
        return base_price
    multiplier = Decimal('1') - (discount_percentage / Decimal('100'))
    result = base_price * multiplier
    return result.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def get_room_price_for_agency(room_price: RoomPrice, agency: Agency) -> Decimal:
    """
    حساب سعر الغرفة لوكالة معينة:
    1. السعر الأساسي من RoomPrice
    2. تطبيق الخصم الموسمي إن وجد
    3. إضافة عمولة الوكالة
    """
    base = room_price.price_per_night

    # تطبيق الخصم الموسمي أولاً
    if room_price.discount_percentage:
        base = apply_discount(base, room_price.discount_percentage)

    # إضافة عمولة الوكالة
    if agency and agency.commission_rate:
        base = apply_commission(base, agency.commission_rate)

    return base


def calculate_booking_total(booking: Booking) -> Decimal:
    """
    حساب المجموع الكلي لحجز معين:
    - فنادق (عدد الغرف × الليالي × السعر)
    - خدمات (الكمية × السعر)
    - تطبيق عمولة الوكالة
    """
    total = Decimal('0.00')
    agency = booking.agency

    # حساب تكلفة الفنادق
    for booking_city in booking.cities.prefetch_related('hotels__room_price').all():
        for booking_hotel in booking_city.hotels.all():
            if booking_hotel.price_per_night_snapshot:
                hotel_cost = (
                    booking_hotel.price_per_night_snapshot
                    * booking_hotel.rooms_count
                    * booking_hotel.nights
                )
                total += hotel_cost
            elif booking_hotel.room_price:
                base_price = get_room_price_for_agency(
                    booking_hotel.room_price, agency
                )
                hotel_cost = base_price * booking_hotel.rooms_count * booking_hotel.nights
                total += hotel_cost

    # حساب تكلفة الخدمات
    for booking_service in booking.services.all():
        if booking_service.price_snapshot:
            service_cost = booking_service.price_snapshot * booking_service.quantity
            total += service_cost

    return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


@transaction.atomic
def confirm_booking_prices(booking: Booking) -> Booking:
    """
    تثبيت الأسعار في الـ snapshots وقت تأكيد الحجز.
    يجب استدعاؤها قبل تغيير status إلى confirmed.
    """
    agency = booking.agency

    for booking_city in booking.cities.prefetch_related('hotels__room_price').all():
        for booking_hotel in booking_city.hotels.all():
            if booking_hotel.room_price and not booking_hotel.price_per_night_snapshot:
                price = get_room_price_for_agency(booking_hotel.room_price, agency)
                booking_hotel.price_per_night_snapshot = price
                booking_hotel.currency_snapshot = booking.currency
                booking_hotel.save(update_fields=['price_per_night_snapshot', 'currency_snapshot'])

    for booking_service in booking.services.all():
        if booking_service.service and not booking_service.price_snapshot:
            base_price = booking_service.service.base_price
            if agency and agency.commission_rate:
                base_price = apply_commission(base_price, agency.commission_rate)
            booking_service.price_snapshot = base_price
            booking_service.currency_snapshot = booking.currency
            booking_service.save(update_fields=['price_snapshot', 'currency_snapshot'])

    # حساب المجموع وتحديثه
    calculated = calculate_booking_total(booking)
    if calculated > Decimal('0.00'):
        booking.total_price = calculated
        booking.save(update_fields=['total_price'])

    return booking
