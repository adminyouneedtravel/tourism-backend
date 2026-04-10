from django.db import models
from apps.hotels.models import Hotel


class Provider(models.Model):
    """
    مزود بيانات خارجي (Agoda, Booking.com, Expedia, إلخ)
    أو داخلي (Direct Contract).
    """
    PROVIDER_TYPE_CHOICES = [
        ('direct',   'عقد مباشر (Extranet)'),
        ('agoda',    'Agoda API'),
        ('booking',  'Booking.com API'),
        ('expedia',  'Expedia API'),
        ('custom',   'مزود مخصص'),
    ]

    name         = models.CharField(max_length=100, verbose_name="اسم المزود")
    provider_type = models.CharField(
        max_length=20, choices=PROVIDER_TYPE_CHOICES,
        default='direct', verbose_name="نوع المزود"
    )
    is_active    = models.BooleanField(
        default=False,
        verbose_name="مفعّل",
        help_text="تفعيل أو تعطيل هذا المزود بضغطة زر دون التأثير على باقي النظام"
    )
    api_endpoint = models.URLField(blank=True, verbose_name="رابط API")
    api_key      = models.CharField(max_length=500, blank=True, verbose_name="مفتاح API")
    api_secret   = models.CharField(max_length=500, blank=True, verbose_name="Secret Key")
    markup_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=0, verbose_name="Markup (%)",
        help_text="نسبة الربح المضافة فوق سعر المزود"
    )
    priority     = models.PositiveIntegerField(
        default=1,
        verbose_name="الأولوية",
        help_text="رقم أقل = أولوية أعلى في عرض النتائج"
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "✓" if self.is_active else "✗"
        return f"[{status}] {self.name} ({self.get_provider_type_display()})"

    class Meta:
        verbose_name        = "مزود بيانات"
        verbose_name_plural = "مزودو البيانات"
        ordering            = ['priority']


class HotelMapping(models.Model):
    """
    ربط فندق في النظام بمعرّفه في كل مزود خارجي.
    يحل مشكلة ظهور نفس الفندق بأسماء مختلفة من مصادر مختلفة.
    """
    hotel            = models.ForeignKey(
        Hotel, on_delete=models.CASCADE,
        related_name='provider_mappings', verbose_name="الفندق في النظام"
    )
    provider         = models.ForeignKey(
        Provider, on_delete=models.CASCADE,
        related_name='hotel_mappings', verbose_name="المزود"
    )
    external_hotel_id = models.CharField(
        max_length=200, verbose_name="معرّف الفندق عند المزود"
    )
    external_name    = models.CharField(
        max_length=300, blank=True,
        verbose_name="اسم الفندق عند المزود",
        help_text="الاسم كما يظهر في API المزود (قد يختلف عن اسمنا)"
    )
    is_verified      = models.BooleanField(
        default=False,
        verbose_name="تم التحقق",
        help_text="هل تم التأكد يدوياً أن هذا نفس الفندق؟"
    )
    last_synced      = models.DateTimeField(null=True, blank=True, verbose_name="آخر مزامنة")
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.hotel.name} ↔ {self.provider.name} ({self.external_hotel_id})"

    class Meta:
        unique_together     = ['hotel', 'provider']
        verbose_name        = "ربط فندق بمزود"
        verbose_name_plural = "ربط الفنادق بالمزودين"


class ProviderPriceCache(models.Model):
    """
    Cache للأسعار القادمة من المزودين الخارجيين.
    يقلل الضغط على الـ APIs ويسرع البحث.
    """
    mapping      = models.ForeignKey(
        HotelMapping, on_delete=models.CASCADE,
        related_name='price_cache', verbose_name="الربط"
    )
    check_in     = models.DateField(verbose_name="تاريخ الوصول")
    check_out    = models.DateField(verbose_name="تاريخ المغادرة")
    room_type    = models.CharField(max_length=100, verbose_name="نوع الغرفة")
    raw_price    = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="السعر من المزود"
    )
    final_price  = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="السعر بعد Markup"
    )
    currency     = models.CharField(max_length=3, default='MYR')
    cached_at    = models.DateTimeField(auto_now_add=True)
    expires_at   = models.DateTimeField(verbose_name="ينتهي الـ Cache")
    is_available = models.BooleanField(default=True)

    class Meta:
        verbose_name        = "Cache سعر من مزود"
        verbose_name_plural = "Cache أسعار المزودين"
        indexes             = [
            models.Index(fields=['mapping', 'check_in', 'check_out']),
            models.Index(fields=['expires_at']),
        ]


class UnifiedSearchIndex(models.Model):
    """
    فهرس بحث موحد لجميع المحتوى القابل للحجز.
    يجمع الفنادق والخدمات والباقات في جدول واحد
    لتسريع البحث وتوحيد النتائج.
    """

    CONTENT_TYPE_CHOICES = [
        ('hotel',   'فندق'),
        ('service', 'خدمة'),
        ('package', 'باقة'),
    ]

    content_type    = models.CharField(
        max_length=10, choices=CONTENT_TYPE_CHOICES,
        verbose_name="نوع المحتوى"
    )
    object_id       = models.PositiveIntegerField(verbose_name="معرف الكائن")
    name            = models.CharField(max_length=300, verbose_name="الاسم")
    name_normalized = models.CharField(
        max_length=300, verbose_name="الاسم الموحد",
        help_text="lowercase بدون مسافات زائدة للمقارنة"
    )
    city            = models.ForeignKey(
        'locations.City', on_delete=models.CASCADE,
        null=True, blank=True, verbose_name="المدينة"
    )
    country         = models.ForeignKey(
        'locations.Country', on_delete=models.CASCADE,
        null=True, blank=True, verbose_name="الدولة"
    )
    base_price      = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True, verbose_name="السعر الأساسي"
    )
    currency        = models.CharField(max_length=3, default='MYR')
    provider        = models.ForeignKey(
        Provider, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name="المزود"
    )
    is_active       = models.BooleanField(default=True)
    search_tags     = models.JSONField(
        default=list, blank=True,
        verbose_name="كلمات بحث",
        help_text='["فندق","كوالا","5 نجوم","مسبح"]'
    )
    last_indexed    = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.content_type}] {self.name}"

    class Meta:
        verbose_name        = "فهرس بحث موحد"
        verbose_name_plural = "فهارس البحث الموحدة"
        indexes = [
            models.Index(fields=['content_type', 'is_active']),
            models.Index(fields=['city', 'content_type']),
            models.Index(fields=['name_normalized']),
            models.Index(fields=['base_price', 'currency']),
        ]
        unique_together = ['content_type', 'object_id']
