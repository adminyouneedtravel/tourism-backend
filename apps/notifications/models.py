# apps/notifications/models.py

from django.db import models
from apps.accounts.models import User


class Notification(models.Model):

    TYPE_CHOICES = [
        ('new_booking',       'حجز جديد'),
        ('booking_status',    'تغيير حالة حجز'),
        ('new_agency',        'وكالة جديدة'),
        ('agency_approved',   'قبول وكالة'),
        ('agency_rejected',   'رفض وكالة'),
    ]

    recipient    = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="المستلم"
    )
    type         = models.CharField(
        max_length=20, choices=TYPE_CHOICES,
        verbose_name="نوع الإشعار"
    )
    title        = models.CharField(max_length=200, verbose_name="العنوان")
    message      = models.TextField(verbose_name="الرسالة")
    is_read      = models.BooleanField(default=False, verbose_name="مقروء")
    link         = models.CharField(max_length=200, blank=True, verbose_name="الرابط")
    reference_id = models.IntegerField(null=True, blank=True, verbose_name="معرف المصدر")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "إشعار"
        verbose_name_plural = "الإشعارات"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.recipient.username} — {self.title}"