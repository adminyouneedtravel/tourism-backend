from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from apps.pricing.models import RoomPrice, Season
import logging

logger = logging.getLogger('apps.pricing')


@receiver(post_save, sender=RoomPrice)
@receiver(post_delete, sender=RoomPrice)
def invalidate_price_cache(sender, instance, **kwargs):
    """مسح Redis cache عند تغيير أي سعر."""
    try:
        from apps.core.cache_service import invalidate_hotel_prices
        hotel_id = instance.season.hotel_id
        invalidate_hotel_prices(hotel_id)
        logger.info(f"Price cache invalidated: hotel={hotel_id}")
    except Exception as e:
        logger.warning(f"فشل مسح price cache: {e}")


@receiver(post_save, sender=Season)
@receiver(post_delete, sender=Season)
def invalidate_season_cache(sender, instance, **kwargs):
    """مسح Redis cache عند تغيير أي موسم."""
    try:
        from apps.core.cache_service import invalidate_hotel_prices
        invalidate_hotel_prices(instance.hotel_id)
    except Exception as e:
        logger.warning(f"فشل مسح season cache: {e}")
