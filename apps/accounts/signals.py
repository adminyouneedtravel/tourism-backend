from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.accounts.models import Agency
import logging

logger = logging.getLogger('apps.accounts')


@receiver(post_save, sender=Agency)
def create_wallet_on_approval(sender, instance, created, **kwargs):
    """
    إنشاء محفظة تلقائياً عند قبول الوكالة لأول مرة.
    """
    if instance.status == 'active' and instance.is_active:
        try:
            from apps.wallet.models import Wallet
            wallet, was_created = Wallet.objects.get_or_create(
                agency=instance,
                defaults={'currency': instance.currency or 'MYR'}
            )
            if was_created:
                logger.info(f"تم إنشاء محفظة للوكالة: {instance.name}")
        except Exception as e:
            logger.error(f"فشل إنشاء محفظة للوكالة {instance.name}: {e}")
