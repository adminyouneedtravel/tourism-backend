from django.db import models
from apps.accounts.models import User, Agency
from apps.locations.models import Country, City
from apps.hotels.models import Hotel
from apps.services.models import Service
from apps.packages.models import TourPackage
from apps.pricing.models import RoomPrice


class Booking(models.Model):

    BOOKING_TYPE_CHOICES = [
        ('agency', 'باقة الوكالة'),
        ('custom', 'باقة مخصصة'),
    ]
    STATUS_CHOICES = [
        ('pending',   'معلق للمراجعة'),
        ('confirmed', 'مؤكد'),
        ('cancelled', 'ملغي'),
        ('completed', 'مكتمل'),
    ]

    agency       = models.ForeignKey(
        Agency, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bookings',
        verbose_name="الوكالة"
    )
    created_by   = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bookings',
        verbose_name="أنشئ بواسطة"
    )
    booking_type = models.CharField(
        max_length=10, choices=BOOKING_TYPE_CHOICES,
        default='custom', verbose_name="نوع الحجز"
    )
    status       = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending', verbose_name="حالة الحجز"
    )
    package      = models.ForeignKey(
        TourPackage, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bookings',
        verbose_name="الباقة السياحية"
    )
    client_name  = models.CharField(max_length=200, verbose_name="اسم العميل")
    client_phone = models.CharField(max_length=20, verbose_name="رقم الهاتف")
    client_email = models.EmailField(blank=True, verbose_name="البريد الالكتروني")
    notes        = models.TextField(blank=True, verbose_name="ملاحظات")
    adults       = models.PositiveIntegerField(default=1, verbose_name="عدد البالغين")
    children     = models.PositiveIntegerField(default=0, verbose_name="عدد الاطفال")
    infants      = models.PositiveIntegerField(default=0, verbose_name="عدد الرضع")
    country      = models.ForeignKey(
        Country, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name="الدولة المقصودة"
    )
    total_price  = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True, verbose_name="السعر الاجمالي"
    )
    currency     = models.CharField(max_length=3, default='MYR', verbose_name="العملة")
    reference_number = models.CharField(
        max_length=20, unique=True, blank=True,
        verbose_name="رقم المرجع"
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import uuid
            self.reference_number = f"YNT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_number} - {self.client_name}"

    class Meta:
        verbose_name        = "حجز"
        verbose_name_plural = "الحجوزات"
        ordering            = ['-created_at']


class BookingPerson(models.Model):
    PERSON_TYPE = [
        ('adult',  'بالغ'),
        ('child',  'طفل'),
        ('infant', 'رضيع'),
    ]
    booking     = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='persons'
    )
    person_type = models.CharField(max_length=10, choices=PERSON_TYPE)
    age         = models.PositiveIntegerField(null=True, blank=True, verbose_name="العمر")
    name        = models.CharField(max_length=100, blank=True, verbose_name="الاسم")

    class Meta:
        verbose_name        = "فرد في الحجز"
        verbose_name_plural = "افراد الحجز"


class BookingCity(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='cities'
    )
    city    = models.ForeignKey(
        City, on_delete=models.CASCADE, verbose_name="المدينة"
    )
    nights  = models.PositiveIntegerField(default=1, verbose_name="عدد الليالي")
    order   = models.PositiveIntegerField(default=0, verbose_name="الترتيب")

    class Meta:
        ordering            = ['order']
        verbose_name        = "مدينة في الحجز"
        verbose_name_plural = "مدن الحجز"


class BookingHotel(models.Model):
    booking_city             = models.ForeignKey(
        BookingCity, on_delete=models.CASCADE, related_name='hotels'
    )
    hotel                    = models.ForeignKey(
        Hotel, on_delete=models.CASCADE, verbose_name="الفندق"
    )
    room_price               = models.ForeignKey(
        RoomPrice, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name="تسعير الغرفة"
    )
    nights                   = models.PositiveIntegerField(default=1, verbose_name="عدد الليالي")
    rooms_count              = models.PositiveIntegerField(default=1, verbose_name="عدد الغرف")
    price_per_night_snapshot = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name="سعر الليلة وقت الحجز"
    )
    currency_snapshot        = models.CharField(
        max_length=3, default='MYR',
        verbose_name="العملة وقت الحجز"
    )

    class Meta:
        verbose_name        = "فندق في الحجز"
        verbose_name_plural = "فنادق الحجز"


class BookingService(models.Model):
    booking           = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='services'
    )
    service           = models.ForeignKey(
        Service, on_delete=models.CASCADE, verbose_name="الخدمة"
    )
    quantity          = models.PositiveIntegerField(default=1, verbose_name="الكمية")
    price_snapshot    = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name="السعر وقت الحجز"
    )
    currency_snapshot = models.CharField(
        max_length=3, default='MYR',
        verbose_name="العملة وقت الحجز"
    )

    class Meta:
        verbose_name        = "خدمة في الحجز"
        verbose_name_plural = "خدمات الحجز"
