# apps/accounts/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser


class Agency(models.Model):

    CURRENCY_CHOICES = [
        ('MYR', 'Malaysian Ringgit'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('SAR', 'Saudi Riyal'),
        ('AED', 'UAE Dirham'),
    ]

    STATUS_CHOICES = [
        ('pending',  'معلق للمراجعة'),
        ('active',   'نشط'),
        ('rejected', 'مرفوض'),
    ]

    name             = models.CharField(max_length=200, verbose_name="اسم الوكالة")
    phone            = models.CharField(max_length=20, blank=True, verbose_name="الهاتف")
    email            = models.EmailField(blank=True, verbose_name="البريد الإلكتروني")
    address          = models.TextField(blank=True, verbose_name="العنوان")
    logo             = models.ImageField(
        upload_to='agencies/logos/', blank=True, null=True,
        verbose_name="الشعار"
    )
    commission_rate  = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        verbose_name="نسبة العمولة (%)"
    )
    currency         = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES, default='MYR',
        verbose_name="العملة الافتراضية"
    )
    status           = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending',
        verbose_name="حالة الوكالة"
    )
    is_active        = models.BooleanField(default=False, verbose_name="نشطة")
    rejection_reason = models.TextField(blank=True, verbose_name="سبب الرفض")

    # ── حقول Approval ──────────────────────────────────────────────
    approved_at      = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ القبول")
    approved_by      = models.ForeignKey(
        'User', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_agencies',
        verbose_name="تمت الموافقة بواسطة"
    )

    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    # ── Properties ─────────────────────────────────────────────────
    @property
    def is_approved(self) -> bool:
        return self.status == 'active'

    @property
    def owner(self):
        """مالك الوكالة: أول مستخدم بدور agency مرتبط بها."""
        return self.employees.filter(role='agency').first()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name        = "وكالة شريكة"
        verbose_name_plural = "الوكالات الشريكة"
        ordering            = ['-created_at']


class User(AbstractUser):

    ROLE_CHOICES = [
        ('super_admin', 'مدير عام'),
        ('admin',       'مشرف'),
        ('agency',      'وكالة شريكة'),
        ('tourist',     'سائح'),
    ]

    role   = models.CharField(
        max_length=20, choices=ROLE_CHOICES,
        default='tourist', verbose_name="الدور"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='employees',
        verbose_name="الوكالة الشريكة"
    )
    phone  = models.CharField(max_length=20, blank=True, verbose_name="الهاتف")
    avatar = models.ImageField(
        upload_to='avatars/', blank=True, null=True,
        verbose_name="الصورة الشخصية"
    )

    @property
    def is_admin(self) -> bool:
        return self.role in ('super_admin', 'admin') or self.is_superuser

    @property
    def is_agency_user(self) -> bool:
        return self.role == 'agency'

    @property
    def is_tourist(self) -> bool:
        return self.role == 'tourist'

    @property
    def is_approved(self) -> bool:
        """للوكالة: هل الوكالة معتمدة؟"""
        if self.agency:
            return self.agency.is_approved
        return True  # Admin/Tourist دائماً approved

    @property
    def display_role(self) -> str:
        return dict(self.ROLE_CHOICES).get(self.role, self.role)

    def __str__(self):
        return f"{self.username} ({self.display_role})"

    class Meta:
        verbose_name        = "مستخدم"
        verbose_name_plural = "المستخدمون"
        ordering            = ['-date_joined']