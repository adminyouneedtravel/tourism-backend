from django.db import models
from apps.accounts.models import Agency
from apps.locations.models import City, Country
from apps.hotels.models import Hotel


class CustomPackage(models.Model):
    STATUS_CHOICES = [
        ('draft', 'مسودة'),
        ('published', 'منشورة'),
        ('archived', 'مؤرشفة'),
    ]

    country             = models.ForeignKey(
        'locations.Country', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='packages', verbose_name='الدولة'
    )
    agency              = models.ForeignKey(Agency, on_delete=models.CASCADE, related_name='custom_packages', verbose_name='الوكالة')
    title               = models.CharField(max_length=200, verbose_name='عنوان الباقة')
    description         = models.TextField(blank=True, verbose_name='وصف الباقة')
    image               = models.ImageField(upload_to='packages/', blank=True, null=True, verbose_name='صورة الباقة')
    total_nights        = models.PositiveIntegerField(default=1, verbose_name='إجمالي الليالي')
    total_days          = models.PositiveIntegerField(default=2, verbose_name='إجمالي الأيام')
    status              = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', verbose_name='الحالة')
    peak_surcharge_pct  = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='نسبة زيادة موسم الذروة %')
    currency_cost       = models.CharField(max_length=3, default='MYR', verbose_name='عملة التكلفة')
    currency_sell       = models.CharField(max_length=3, default='EUR', verbose_name='عملة البيع')
    is_custom_order     = models.BooleanField(
        default=False, verbose_name='باقة حسب الطلب'
    )
    client_name         = models.CharField(
        max_length=200, blank=True, verbose_name='اسم العميل'
    )
    client_phone        = models.CharField(
        max_length=20, blank=True, verbose_name='هاتف العميل'
    )
    client_email        = models.EmailField(
        blank=True, verbose_name='إيميل العميل'
    )
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'باقة مخصصة'
        verbose_name_plural = 'الباقات المخصصة'
        ordering = ['-created_at']

    def __str__(self):
        if self.is_custom_order and self.client_name:
            cities = ', '.join(self.cities.values_list('city__name', flat=True)[:3])
            return f"طلب {self.client_name} — {cities}"
        return f"{self.title} ({self.get_status_display()})"

    def auto_title(self):
        cities = list(self.cities.values_list('city__name', flat=True)[:3])
        nights = self.total_nights
        if cities:
            return f"{'، '.join(cities)} — {nights} ليالي"
        return f"باقة {nights} ليالي"


class PackagePaxConfig(models.Model):
    package              = models.OneToOneField(CustomPackage, on_delete=models.CASCADE, related_name='pax_config', verbose_name='الباقة')
    adults_count         = models.PositiveIntegerField(default=1, verbose_name='عدد البالغين')
    children_count       = models.PositiveIntegerField(default=0, verbose_name='عدد الأطفال (3-11)')
    infants_count        = models.PositiveIntegerField(default=0, verbose_name='عدد الرضع (0-2)')
    extra_bed_children   = models.BooleanField(default=False, verbose_name='سرير إضافي للأطفال')
    extra_bed_infants    = models.BooleanField(default=False, verbose_name='سرير إضافي للرضع')

    class Meta:
        verbose_name = 'إعداد الأفراد'
        verbose_name_plural = 'إعدادات الأفراد'

    def __str__(self):
        return f"{self.package.title} — {self.adults_count} بالغ / {self.children_count} طفل / {self.infants_count} رضيع"


class PackageCity(models.Model):
    package = models.ForeignKey(CustomPackage, on_delete=models.CASCADE, related_name='cities', verbose_name='الباقة')
    city    = models.ForeignKey(City, on_delete=models.CASCADE, verbose_name='المدينة')
    nights  = models.PositiveIntegerField(default=1, verbose_name='عدد الليالي في المدينة')
    order   = models.PositiveIntegerField(default=0, verbose_name='ترتيب المدينة')

    class Meta:
        verbose_name = 'مدينة في الباقة'
        verbose_name_plural = 'مدن الباقة'
        ordering = ['order']
        unique_together = ['package', 'city']

    def __str__(self):
        return f"{self.package.title} ← {self.city.name} ({self.nights} ليالي)"


class PackageHotel(models.Model):
    SOURCE_CHOICES = [
        ('manual', 'يدوي'),
        ('api', 'API خارجي'),
    ]

    package_city            = models.ForeignKey(PackageCity, on_delete=models.CASCADE, related_name='hotels', verbose_name='المدينة في الباقة')
    hotel                   = models.ForeignKey(Hotel, on_delete=models.CASCADE, verbose_name='الفندق')
    room_type               = models.CharField(max_length=100, blank=True, verbose_name='نوع الغرفة')
    rooms_count             = models.PositiveIntegerField(default=1, verbose_name='عدد الغرف')
    check_in_date           = models.DateField(verbose_name='تاريخ الوصول')
    check_out_date          = models.DateField(verbose_name='تاريخ المغادرة')
    nights                  = models.PositiveIntegerField(default=1, verbose_name='عدد الليالي')
    price_per_room_night_myr = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='سعر الغرفة/ليلة (MYR)')
    source                  = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='manual', verbose_name='مصدر السعر')
    api_reference_code      = models.CharField(max_length=100, blank=True, verbose_name='كود الفندق في API')
    profit_margin_pct       = models.DecimalField(max_digits=5, decimal_places=2, default=20, verbose_name='هامش الربح %')

    class Meta:
        verbose_name = 'فندق في الباقة'
        verbose_name_plural = 'فنادق الباقة'

    def __str__(self):
        return f"{self.hotel.name} — {self.package_city.city.name} ({self.nights} ليالي)"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.check_in_date and self.check_out_date:
            if self.check_in_date >= self.check_out_date:
                raise ValidationError('تاريخ الوصول يجب أن يكون قبل تاريخ المغادرة')
            overlapping = PackageHotel.objects.filter(
                package_city=self.package_city,
                check_in_date__lt=self.check_out_date,
                check_out_date__gt=self.check_in_date,
            ).exclude(pk=self.pk)
            if overlapping.exists():
                raise ValidationError('تواريخ هذا الفندق تتداخل مع فندق آخر في نفس المدينة')


class PackageFlight(models.Model):
    package          = models.ForeignKey(CustomPackage, on_delete=models.CASCADE, related_name='flights', verbose_name='الباقة')
    from_city        = models.ForeignKey(City, on_delete=models.CASCADE, related_name='flights_from', verbose_name='من مدينة')
    to_city          = models.ForeignKey(City, on_delete=models.CASCADE, related_name='flights_to', verbose_name='إلى مدينة')
    api_flight_code  = models.CharField(max_length=100, blank=True, verbose_name='كود الرحلة')
    price_adult_myr  = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر البالغ (MYR)')
    price_child_myr  = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر الطفل (MYR)')
    price_infant_myr = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر الرضيع (MYR)')
    profit_margin_pct = models.DecimalField(max_digits=5, decimal_places=2, default=15, verbose_name='هامش الربح %')

    class Meta:
        verbose_name = 'رحلة طيران'
        verbose_name_plural = 'رحلات الطيران'

    def __str__(self):
        return f"{self.from_city.name} → {self.to_city.name}"


class PackageTransfer(models.Model):
    TRANSFER_TYPE_CHOICES = [
        ('airport_pickup', 'استقبال مطار'),
        ('intercity', 'نقل بين المدن'),
        ('local', 'نقل محلي'),
    ]

    package       = models.ForeignKey(CustomPackage, on_delete=models.CASCADE, related_name='transfers', verbose_name='الباقة')
    city          = models.ForeignKey(City, on_delete=models.CASCADE, verbose_name='المدينة')
    transfer_type = models.CharField(max_length=20, choices=TRANSFER_TYPE_CHOICES, verbose_name='نوع النقل')
    price_myr     = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='السعر (MYR)')
    profit_margin_pct = models.DecimalField(max_digits=5, decimal_places=2, default=25, verbose_name='هامش الربح %')

    class Meta:
        verbose_name = 'نقل'
        verbose_name_plural = 'خدمات النقل'

    def __str__(self):
        return f"{self.get_transfer_type_display()} — {self.city.name}"


class PackageTour(models.Model):
    package          = models.ForeignKey(CustomPackage, on_delete=models.CASCADE, related_name='tours', verbose_name='الباقة')
    city             = models.ForeignKey(City, on_delete=models.CASCADE, verbose_name='المدينة')
    tour_name        = models.CharField(max_length=200, verbose_name='اسم الجولة')
    price_adult_myr  = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر البالغ (MYR)')
    price_child_myr  = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر الطفل (MYR)')
    price_infant_myr = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر الرضيع (MYR)')
    profit_margin_pct = models.DecimalField(max_digits=5, decimal_places=2, default=30, verbose_name='هامش الربح %')

    class Meta:
        verbose_name = 'جولة سياحية'
        verbose_name_plural = 'الجولات السياحية'

    def __str__(self):
        return f"{self.tour_name} — {self.city.name}"


class PackageProfitMargin(models.Model):
    package               = models.ForeignKey(CustomPackage, on_delete=models.CASCADE, related_name='profit_margins', verbose_name='الباقة', null=True, blank=True)
    pax_from              = models.PositiveIntegerField(verbose_name='من عدد أفراد')
    pax_to                = models.PositiveIntegerField(verbose_name='إلى عدد أفراد')
    profit_per_adult_eur  = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='ربح البالغ (EUR)')
    profit_per_child_eur  = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='ربح الطفل (EUR)')
    profit_per_infant_eur = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='ربح الرضيع (EUR)')
    b2b_discount_eur      = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='خصم B2B (EUR)')

    class Meta:
        verbose_name = 'هامش الربح'
        verbose_name_plural = 'هوامش الربح'
        ordering = ['pax_from']

    def __str__(self):
        pkg = self.package.title if self.package else 'افتراضي'
        return f"{pkg} — {self.pax_from} إلى {self.pax_to} أفراد"


class PackagePricing(models.Model):
    package                  = models.ForeignKey(CustomPackage, on_delete=models.CASCADE, related_name='pricing_table', verbose_name='الباقة')
    pax_count                = models.PositiveIntegerField(verbose_name='عدد الأفراد')
    total_cost_myr           = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='إجمالي التكلفة (MYR)')
    total_cost_eur           = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='إجمالي التكلفة (EUR)')
    selling_price_b2c_eur    = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر البيع B2C (EUR)')
    selling_price_b2b_eur    = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر البيع B2B (EUR)')
    price_per_pax_b2c_eur    = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر الفرد B2C (EUR)')
    price_per_pax_b2b_eur    = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='سعر الفرد B2B (EUR)')
    calculated_at            = models.DateTimeField(auto_now=True, verbose_name='تاريخ الحساب')

    class Meta:
        verbose_name = 'تسعير الباقة'
        verbose_name_plural = 'جداول التسعير'
        unique_together = ['package', 'pax_count']
        ordering = ['pax_count']

    def __str__(self):
        return f"{self.package.title} — {self.pax_count} أفراد | B2C: {self.selling_price_b2c_eur} EUR"