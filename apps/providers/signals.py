from django.db.models.signals import post_save
from django.dispatch import receiver
import logging

logger = logging.getLogger('apps.providers')


@receiver(post_save, sender='hotels.Hotel')
def index_hotel_on_save(sender, instance, **kwargs):
    try:
        from apps.providers.services import index_hotel
        index_hotel(instance)
    except Exception as e:
        logger.warning(f"فشل فهرسة الفندق {instance.name}: {e}")


@receiver(post_save, sender='services.Service')
def index_service_on_save(sender, instance, **kwargs):
    try:
        from apps.providers.services import index_service
        index_service(instance)
    except Exception as e:
        logger.warning(f"فشل فهرسة الخدمة {instance.name}: {e}")
