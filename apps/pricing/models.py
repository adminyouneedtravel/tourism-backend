from django.db import models
from apps.hotels.models import Hotel
from apps.rooms.models import RoomType


class Season(models.Model):
    hotel = models.ForeignKey(
        Hotel, on_delete=models.CASCADE, related_name='seasons', verbose_name="الفندق"
    )
    name = models.CharField(max_length=100, verbose_name="اسم الموسم")
    valid_from = models.DateField(verbose_name="سارية من")
    valid_to = models.DateField(verbose_name="سارية إلى")

    def __str__(self):
        return f"{self.name} ({self.valid_from} → {self.valid_to})"

    class Meta:
        verbose_name = "موسم"
        verbose_name_plural = "المواسم"
        ordering = ['valid_from']


class RoomPrice(models.Model):
    season = models.ForeignKey(
        Season, on_delete=models.CASCADE, related_name='prices', verbose_name="الموسم"
    )
    room_type = models.ForeignKey(
        RoomType, on_delete=models.CASCADE, related_name='prices', verbose_name="نوع الغرفة"
    )

    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="سعر الغرفة لليلة")
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="نسبة الخصم (%)"
    )
    breakfast_included = models.BooleanField(default=False, verbose_name="يشمل فطور الصباح")

    # الحقول الجديدة التي طلبتها
    child_with_bed_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="سعر طفل بسرير"
    )
    child_without_bed_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="سعر طفل بدون سرير"
    )
    infant_with_bed_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="سعر رضيع بسرير"
    )
    infant_without_bed_price = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="سعر رضيع بدون سرير"
    )

    class Meta:
        unique_together = ['season', 'room_type']
        verbose_name = "تسعير غرفة"
        verbose_name_plural = "أسعار الغرف"

    def __str__(self):
        return f"{self.season.name} - {self.room_type.name}"

class ExchangeRate(models.Model):
    from_currency = models.CharField(max_length=3, verbose_name='من عملة')
    to_currency   = models.CharField(max_length=3, verbose_name='إلى عملة')
    rate          = models.DecimalField(max_digits=12, decimal_places=6, verbose_name='سعر الصرف')
    valid_from    = models.DateField(verbose_name='صالح من')
    valid_to      = models.DateField(null=True, blank=True, verbose_name='صالح حتى')
    is_active     = models.BooleanField(default=True, verbose_name='فعّال')
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'سعر الصرف'
        verbose_name_plural = 'أسعار الصرف'
        ordering            = ['-valid_from']
        indexes             = [
            models.Index(fields=['from_currency', 'to_currency', 'is_active']),
        ]

    def __str__(self):
        return f"1 {self.from_currency} = {self.rate} {self.to_currency} (من {self.valid_from})"

    @classmethod
    def get_rate(cls, from_currency, to_currency):
        """
        يرجع أحدث سعر صرف فعّال بين عملتين.
        """
        from django.utils import timezone
        today = timezone.now().date()
        obj = cls.objects.filter(
            from_currency=from_currency,
            to_currency=to_currency,
            is_active=True,
            valid_from__lte=today,
        ).filter(
            models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=today)
        ).first()
        return obj.rate if obj else None
