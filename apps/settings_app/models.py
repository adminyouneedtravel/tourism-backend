# apps/settings_app/models.py

from django.db import models


class SiteSettings(models.Model):
    site_name    = models.CharField(max_length=200, default='You Need Travel', verbose_name="اسم الموقع")
    site_logo    = models.ImageField(
        upload_to='site/', blank=True, null=True,
        verbose_name="شعار الموقع"
    )
    site_email   = models.EmailField(blank=True, verbose_name="البريد الإلكتروني")
    site_phone   = models.CharField(max_length=20, blank=True, verbose_name="الهاتف")
    site_address = models.TextField(blank=True, verbose_name="العنوان")
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "إعدادات الموقع"
        verbose_name_plural = "إعدادات الموقع"

    def __str__(self):
        return self.site_name

    @classmethod
    def get(cls):
        """دائماً يرجع سجل واحد — ينشئه إذا لم يكن موجوداً."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj