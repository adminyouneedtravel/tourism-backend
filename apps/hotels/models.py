from django.db import models
from apps.locations.models import City


class Hotel(models.Model):

    PROVIDER_TYPE_CHOICES = [
        ('direct',  'عقد مباشر'),
        ('agoda',   'Agoda'),
        ('booking', 'Booking.com'),
        ('expedia', 'Expedia'),
        ('custom',  'مزود مخصص'),
    ]

    city        = models.ForeignKey(
        City, on_delete=models.CASCADE,
        related_name='hotels', verbose_name="المدينة"
    )
    name        = models.CharField(max_length=200, verbose_name="اسم الفندق")
    address     = models.TextField(blank=True, default='', verbose_name="العنوان")
    stars       = models.IntegerField(
        choices=[(i, f"{i} ★") for i in range(1, 6)],
        default=3, verbose_name="النجوم"
    )
    description = models.TextField(blank=True, verbose_name="وصف الفندق")
    image       = models.ImageField(
        upload_to='hotels/', blank=True, null=True, verbose_name="صورة الفندق"
    )
    latitude    = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True, verbose_name="خط العرض"
    )
    longitude   = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True, verbose_name="خط الطول"
    )
    amenities   = models.JSONField(
        default=list, blank=True, verbose_name="المرافق والخدمات"
    )
    check_in_time  = models.TimeField(null=True, blank=True, verbose_name="وقت الدخول")
    check_out_time = models.TimeField(null=True, blank=True, verbose_name="وقت المغادرة")
    phone       = models.CharField(max_length=30, blank=True, verbose_name="هاتف الفندق")
    email       = models.EmailField(blank=True, verbose_name="بريد الفندق")
    website     = models.URLField(blank=True, verbose_name="الموقع الإلكتروني")
    provider_type = models.CharField(
        max_length=20, choices=PROVIDER_TYPE_CHOICES,
        default='direct', verbose_name="نوع المزود"
    )
    is_active   = models.BooleanField(default=True, verbose_name="نشط")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name        = "فندق"
        verbose_name_plural = "الفنادق"
        indexes = [
            models.Index(fields=['city', 'stars', 'is_active']),
            models.Index(fields=['provider_type']),
        ]
