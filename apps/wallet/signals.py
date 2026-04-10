from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from apps.bookings.models import Booking
import logging

logger = logging.getLogger('apps.bookings')

# تم نقل منطق Wallet إلى BookingViewSet.update_status
# الـ signals هنا معطلة لتجنب التعارض والتنفيذ المزدوج
