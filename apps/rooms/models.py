# apps/rooms/models.py

from django.db import models
from apps.hotels.models import Hotel


class RoomType(models.Model):
    hotel         = models.ForeignKey(
        Hotel, on_delete=models.CASCADE,
        related_name='room_types', verbose_name="الفندق"
    )
    name          = models.CharField(max_length=100, verbose_name="نوع الغرفة")
    max_occupancy = models.IntegerField(verbose_name="أقصى عدد نزلاء")
    description   = models.TextField(blank=True, verbose_name="وصف الغرفة")
    image         = models.ImageField(
        upload_to='rooms/', blank=True, null=True,
        verbose_name="صورة الغرفة"
    )
    breakfast_included = models.BooleanField(
        default=False, verbose_name="يشمل فطور الصباح"
    )

    # ⚠️ حُذفت: price_per_night, currency, discount_percentage,
    #           season_name, valid_from, valid_to
    # السبب: هذه البيانات موجودة في apps/pricing بشكل صحيح

    def __str__(self):
        return f"{self.name} - {self.hotel.name}"

    class Meta:
        verbose_name        = "نوع غرفة"
        verbose_name_plural = "أنواع الغرف"