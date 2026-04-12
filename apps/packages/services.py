from decimal import Decimal
from apps.pricing.models import ExchangeRate
from apps.providers.services import get_best_hotel_price
from .models import (
    CustomPackage, PackagePaxConfig, PackageCity,
    PackageHotel, PackageFlight, PackageTransfer,
    PackageTour, PackagePricing
)


def apply_margin(cost: Decimal, margin_pct: Decimal) -> Decimal:
    return cost * (1 + margin_pct / Decimal('100'))


def calculate_package_price(package: CustomPackage) -> dict:
    try:
        pax_config = package.pax_config
    except PackagePaxConfig.DoesNotExist:
        return {'error': 'لم يتم تحديد إعداد الأفراد للباقة'}

    exchange_rate = ExchangeRate.get_rate('MYR', 'EUR')
    if not exchange_rate:
        return {'error': 'لا يوجد سعر صرف فعّال لـ MYR/EUR'}

    adults   = pax_config.adults_count
    children = pax_config.children_count
    infants  = pax_config.infants_count
    total_pax = adults + children + infants

    # ── حساب كل عنصر مع هامش ربحه ──────────────────────
    hotels_cost    = _calc_hotels(package, pax_config)
    flights_cost   = _calc_flights(package, adults, children, infants)
    transfers_cost = _calc_transfers(package)
    tours_cost     = _calc_tours(package, adults, children, infants)

    total_cost_myr = hotels_cost + flights_cost + transfers_cost + tours_cost
    total_cost_eur = (total_cost_myr / exchange_rate).quantize(Decimal('0.01'))

    price_per_pax_b2c = (total_cost_eur / total_pax).quantize(Decimal('0.01')) if total_pax else Decimal('0')

    pricing, _ = PackagePricing.objects.update_or_create(
        package=package,
        pax_count=total_pax,
        defaults={
            'total_cost_myr':        total_cost_myr.quantize(Decimal('0.01')),
            'total_cost_eur':        total_cost_eur,
            'selling_price_b2c_eur': total_cost_eur,
            'selling_price_b2b_eur': total_cost_eur,
            'price_per_pax_b2c_eur': price_per_pax_b2c,
            'price_per_pax_b2b_eur': price_per_pax_b2c,
        }
    )

    return {
        'pax_count':             total_pax,
        'total_cost_myr':        str(total_cost_myr.quantize(Decimal('0.01'))),
        'total_cost_eur':        str(total_cost_eur),
        'selling_price_b2c_eur': str(total_cost_eur),
        'selling_price_b2b_eur': str(total_cost_eur),
        'price_per_pax_b2c_eur': str(price_per_pax_b2c),
        'price_per_pax_b2b_eur': str(price_per_pax_b2c),
        'breakdown': {
            'hotels_myr':    str(hotels_cost.quantize(Decimal('0.01'))),
            'flights_myr':   str(flights_cost.quantize(Decimal('0.01'))),
            'transfers_myr': str(transfers_cost.quantize(Decimal('0.01'))),
            'tours_myr':     str(tours_cost.quantize(Decimal('0.01'))),
        }
    }


def _calc_hotels(package, pax_config):
    import math
    total = Decimal('0.00')
    total_pax = pax_config.adults_count + pax_config.children_count

    for hotel in PackageHotel.objects.filter(
        package_city__package=package
    ).select_related('hotel', 'package_city'):

        rooms = math.ceil(total_pax / 2)
        base_cost = hotel.price_per_room_night_myr * rooms * hotel.nights

        if pax_config.extra_bed_children:
            base_cost += Decimal('40') * pax_config.children_count * hotel.nights
        if pax_config.extra_bed_infants:
            base_cost += Decimal('40') * pax_config.infants_count * hotel.nights

        total += apply_margin(base_cost, hotel.profit_margin_pct)

    return total


def _calc_flights(package, adults, children, infants):
    total = Decimal('0.00')
    for flight in PackageFlight.objects.filter(package=package):
        base = (
            flight.price_adult_myr  * adults +
            flight.price_child_myr  * children +
            flight.price_infant_myr * infants
        )
        total += apply_margin(base, flight.profit_margin_pct)
    return total


def _calc_transfers(package):
    total = Decimal('0.00')
    for transfer in PackageTransfer.objects.filter(package=package):
        total += apply_margin(transfer.price_myr, transfer.profit_margin_pct)
    return total


def _calc_tours(package, adults, children, infants):
    total = Decimal('0.00')
    for tour in PackageTour.objects.filter(package=package):
        base = (
            tour.price_adult_myr  * adults +
            tour.price_child_myr  * children +
            tour.price_infant_myr * infants
        )
        total += apply_margin(base, tour.profit_margin_pct)
    return total


def _calculate_rooms_needed(pax_count):
    import math
    return math.ceil(pax_count / 2)