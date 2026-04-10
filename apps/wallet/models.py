from django.db import models
from decimal import Decimal
from apps.accounts.models import Agency, User


class Wallet(models.Model):
    """محفظة مالية لكل وكالة شريكة."""

    CURRENCY_CHOICES = [
        ('MYR', 'Malaysian Ringgit'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('SAR', 'Saudi Riyal'),
        ('AED', 'UAE Dirham'),
    ]

    agency          = models.OneToOneField(
        Agency, on_delete=models.CASCADE,
        related_name='wallet', verbose_name="الوكالة"
    )
    balance         = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=Decimal('0.00'), verbose_name="الرصيد المتاح"
    )
    frozen_balance  = models.DecimalField(
        max_digits=12, decimal_places=2,
        default=Decimal('0.00'), verbose_name="الرصيد المجمد (Escrow)"
    )
    currency        = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES,
        default='MYR', verbose_name="العملة"
    )
    is_active       = models.BooleanField(default=True, verbose_name="نشطة")
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    @property
    def available_balance(self) -> Decimal:
        """الرصيد الفعلي القابل للاستخدام."""
        return self.balance - self.frozen_balance

    def __str__(self):
        return f"Wallet — {self.agency.name} | {self.balance} {self.currency}"

    class Meta:
        verbose_name        = "محفظة"
        verbose_name_plural = "المحافظ"


class WalletTransaction(models.Model):
    """سجل كامل لكل عملية على المحفظة."""

    TRANSACTION_TYPE_CHOICES = [
        ('credit',  'إيداع'),
        ('debit',   'سحب'),
        ('freeze',  'تجميد (Escrow)'),
        ('unfreeze','إلغاء تجميد'),
        ('refund',  'استرداد'),
        ('charge',  'خصم نهائي'),
    ]

    STATUS_CHOICES = [
        ('pending',   'معلق'),
        ('completed', 'مكتمل'),
        ('failed',    'فاشل'),
        ('reversed',  'مُعكوس'),
    ]

    wallet           = models.ForeignKey(
        Wallet, on_delete=models.CASCADE,
        related_name='transactions', verbose_name="المحفظة"
    )
    transaction_type = models.CharField(
        max_length=10, choices=TRANSACTION_TYPE_CHOICES,
        verbose_name="نوع العملية"
    )
    amount           = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="المبلغ"
    )
    currency         = models.CharField(
        max_length=3, default='MYR',
        verbose_name="العملة"
    )
    status           = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending', verbose_name="الحالة"
    )
    balance_before   = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="الرصيد قبل العملية"
    )
    balance_after    = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="الرصيد بعد العملية"
    )
    # ربط اختياري بحجز
    booking          = models.ForeignKey(
        'bookings.Booking', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='wallet_transactions',
        verbose_name="الحجز المرتبط"
    )
    reference        = models.CharField(
        max_length=100, blank=True,
        verbose_name="مرجع العملية"
    )
    notes            = models.TextField(blank=True, verbose_name="ملاحظات")
    created_by       = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='wallet_transactions',
        verbose_name="بواسطة"
    )
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_transaction_type_display()} | {self.amount} {self.currency} | {self.wallet.agency.name}"

    class Meta:
        verbose_name        = "عملية محفظة"
        verbose_name_plural = "عمليات المحافظ"
        ordering            = ['-created_at']


class EscrowEntry(models.Model):
    """
    تتبع مبالغ Escrow المربوطة بحجوزات محددة.
    عند تأكيد الحجز: تجميد المبلغ.
    عند إتمام الحجز: خصم المبلغ نهائياً.
    عند إلغاء الحجز: إعادة المبلغ للرصيد.
    """

    STATUS_CHOICES = [
        ('frozen',   'مجمد'),
        ('released', 'محرر — خُصم نهائياً'),
        ('refunded', 'مُسترد'),
    ]

    wallet    = models.ForeignKey(
        Wallet, on_delete=models.CASCADE,
        related_name='escrow_entries', verbose_name="المحفظة"
    )
    booking   = models.OneToOneField(
        'bookings.Booking', on_delete=models.CASCADE,
        related_name='escrow', verbose_name="الحجز"
    )
    amount    = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name="المبلغ المجمد"
    )
    currency  = models.CharField(max_length=3, default='MYR')
    status    = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='frozen', verbose_name="الحالة"
    )
    frozen_at   = models.DateTimeField(auto_now_add=True)
    released_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Escrow {self.amount} {self.currency} — {self.booking.reference_number}"

    class Meta:
        verbose_name        = "قيد Escrow"
        verbose_name_plural = "قيود Escrow"
        ordering            = ['-frozen_at']
