from django.db import models
from apps.locations.models import City
from apps.hotels.models import Hotel
from apps.services.models import Service


class TourPackage(models.Model):
    name                = models.CharField(max_length=200, verbose_name="اسم الباقة")
    slug                = models.SlugField(unique=True, verbose_name="الرابط")
    description         = models.TextField(verbose_name="وصف الباقة")
    base_price          = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="السعر الأساسي")
    currency            = models.CharField(max_length=3, default='MYR', verbose_name="العملة")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="نسبة الخصم (%)")
    image               = models.ImageField(upload_to='packages/', blank=True, null=True, verbose_name="صورة الباقة")
    highlights          = models.TextField(blank=True, verbose_name="المميزات الرئيسية")
    is_active           = models.BooleanField(default=True, verbose_name="الباقة نشطة")

    # ← جديد: نوع الباقة
    is_customizable     = models.BooleanField(
        default=False,
        verbose_name="باقة قابلة للتخصيص",
        help_text="إذا كانت مفعّلة، يمكن للعميل اختيار الفنادق وعدد الليالي والخدمات الاختيارية"
    )

    def __str__(self):
        return f"{'[مخصصة] ' if self.is_customizable else ''}{self.name}"

    class Meta:
        verbose_name = "باقة سياحية"
        verbose_name_plural = "الباقات السياحية"


class PackageCity(models.Model):
    package = models.ForeignKey(TourPackage, on_delete=models.CASCADE, related_name='cities')
    city    = models.ForeignKey(City, on_delete=models.CASCADE, verbose_name="المدينة")
    nights  = models.PositiveIntegerField(default=1, verbose_name="عدد الليالي")

    # ← جديد: في الباقة المخصصة، هذا الحد الأدنى للليالي وليس ثابتاً
    min_nights = models.PositiveIntegerField(default=1, verbose_name="الحد الأدنى للليالي")
    max_nights = models.PositiveIntegerField(default=14, verbose_name="الحد الأقصى للليالي")

    class Meta:
        unique_together = ['package', 'city']
        verbose_name = "مدينة داخل الباقة"
        verbose_name_plural = "المدن داخل الباقة"

    def __str__(self):
        return f"{self.package.name} ← {self.city.name}"


class PackageCityHotel(models.Model):
    package_city = models.ForeignKey(PackageCity, on_delete=models.CASCADE, related_name='hotels')
    hotel        = models.ForeignKey(Hotel, on_delete=models.CASCADE, verbose_name="الفندق")
    nights       = models.PositiveIntegerField(default=1, verbose_name="عدد الليالي")

    # ← جديد: في الباقة المخصصة هذا الفندق "متاح للاختيار" وليس إلزامياً
    is_default   = models.BooleanField(default=False, verbose_name="فندق افتراضي")

    class Meta:
        unique_together = ['package_city', 'hotel']
        verbose_name = "فندق في مدينة"
        verbose_name_plural = "الفنادق في المدن"


class PackageCityService(models.Model):
    package_city = models.ForeignKey(PackageCity, on_delete=models.CASCADE, related_name='services')
    service      = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name="الخدمة")
    custom_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name="سعر مخصص")

    class Meta:
        unique_together = ['package_city', 'service']
        verbose_name = "خدمة في مدينة"
        verbose_name_plural = "الخدمات في المدن"