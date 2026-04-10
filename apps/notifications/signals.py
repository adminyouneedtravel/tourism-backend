# apps/notifications/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.bookings.models import Booking
from apps.accounts.models import Agency
from .models import Notification

User = get_user_model()


def _should_notify(recipient, type: str, reference_id: int) -> bool:
    """
    يمنع إنشاء إشعار جديد إذا كان يوجد إشعار مشابه
    بنفس النوع والمصدر — سواء مقروء أو غير مقروء.
    """
    return not Notification.objects.filter(
        recipient    = recipient,
        type         = type,
        reference_id = reference_id,
    ).exists()


def notify_admins(type: str, title: str, message: str, reference_id: int, link: str = ''):
    admins = User.objects.filter(role__in=['super_admin', 'admin'], is_active=True)
    notifications = [
        Notification(
            recipient    = admin,
            type         = type,
            title        = title,
            message      = message,
            link         = link,
            reference_id = reference_id,
        )
        for admin in admins
        if _should_notify(admin, type, reference_id)
    ]
    if notifications:
        Notification.objects.bulk_create(notifications)


def notify_user(user, type: str, title: str, message: str, reference_id: int, link: str = ''):
    if _should_notify(user, type, reference_id):
        Notification.objects.create(
            recipient    = user,
            type         = type,
            title        = title,
            message      = message,
            link         = link,
            reference_id = reference_id,
        )


# ── حجز جديد ─────────────────────────────────────────────
@receiver(post_save, sender=Booking)
def on_booking_saved(sender, instance, created, **kwargs):
    if created:
        notify_admins(
            type         = 'new_booking',
            title        = 'حجز جديد',
            message      = f'حجز جديد من {instance.client_name} — {instance.adults + instance.children} فرد',
            reference_id = instance.id,
            link         = '/bookings',
        )
        if instance.agency:
            agency_users = User.objects.filter(agency=instance.agency, is_active=True)
            for user in agency_users:
                notify_user(
                    user         = user,
                    type         = 'new_booking',
                    title        = 'تم استلام حجزك',
                    message      = f'تم استلام حجز {instance.client_name} بنجاح وهو قيد المراجعة',
                    reference_id = instance.id,
                    link         = '/bookings',
                )


# ── تغيير حالة الحجز ─────────────────────────────────────
def notify_booking_status_change(booking: Booking, new_status: str, changed_by):
    STATUS_LABELS = {
        'confirmed': 'مؤكد',
        'cancelled': 'ملغي',
        'completed': 'مكتمل',
        'pending':   'معلق',
    }
    label = STATUS_LABELS.get(new_status, new_status)

    # reference_id فريد = booking.id * 100 + status_index
    # لضمان إشعار منفصل لكل تغيير حالة
    status_index = list(STATUS_LABELS.keys()).index(new_status) if new_status in STATUS_LABELS else 9
    reference_id = booking.id * 100 + status_index

    if booking.agency:
        agency_users = User.objects.filter(agency=booking.agency, is_active=True)
        for user in agency_users:
            notify_user(
                user         = user,
                type         = 'booking_status',
                title        = 'تم تحديث حالة الحجز',
                message      = f'حجز {booking.client_name} أصبح {label}',
                reference_id = reference_id,
                link         = '/bookings',
            )


# ── وكالة جديدة ───────────────────────────────────────────
@receiver(post_save, sender=Agency)
def on_agency_saved(sender, instance, created, **kwargs):
    if created:
        notify_admins(
            type         = 'new_agency',
            title        = 'طلب انضمام وكالة جديدة',
            message      = f'وكالة "{instance.name}" تطلب الانضمام للمنصة',
            reference_id = instance.id,
            link         = '/agencies',
        )
    else:
        if instance.status == 'active' and instance.approved_at:
            agency_users = User.objects.filter(agency=instance, is_active=True)
            for user in agency_users:
                notify_user(
                    user         = user,
                    type         = 'agency_approved',
                    title        = '🎉 تمت الموافقة على وكالتك',
                    message      = f'تهانينا! تمت الموافقة على وكالة "{instance.name}"، يمكنك الآن البدء',
                    reference_id = instance.id,
                    link         = '/dashboard',
                )
        elif instance.status == 'rejected':
            agency_users = User.objects.filter(agency=instance)
            for user in agency_users:
                notify_user(
                    user         = user,
                    type         = 'agency_rejected',
                    title        = 'تم رفض طلب وكالتك',
                    message      = f'نأسف، تم رفض طلب وكالة "{instance.name}". {instance.rejection_reason or ""}',
                    reference_id = instance.id,
                    link         = '/',
                )