from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from apps.wallet.models import Wallet, WalletTransaction, EscrowEntry
from apps.accounts.models import Agency


class InsufficientBalanceError(Exception):
    pass


class WalletNotFoundError(Exception):
    pass


def get_or_create_wallet(agency: Agency) -> Wallet:
    """جلب أو إنشاء محفظة للوكالة."""
    wallet, _ = Wallet.objects.get_or_create(
        agency=agency,
        defaults={'currency': agency.currency or 'MYR'}
    )
    return wallet


@transaction.atomic
def credit_wallet(agency: Agency, amount: Decimal, notes: str = '', created_by=None, reference: str = '') -> WalletTransaction:
    """
    إيداع مبلغ في محفظة الوكالة.
    يستخدم select_for_update لمنع Race Conditions.
    """
    if amount <= 0:
        raise ValueError("المبلغ يجب أن يكون أكبر من صفر")

    wallet = Wallet.objects.select_for_update().get(agency=agency)
    balance_before = wallet.balance
    wallet.balance += amount
    wallet.save(update_fields=['balance', 'updated_at'])

    return WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type='credit',
        amount=amount,
        currency=wallet.currency,
        status='completed',
        balance_before=balance_before,
        balance_after=wallet.balance,
        notes=notes,
        created_by=created_by,
        reference=reference,
    )


@transaction.atomic
def debit_wallet(agency: Agency, amount: Decimal, notes: str = '', created_by=None, reference: str = '') -> WalletTransaction:
    """سحب مبلغ من محفظة الوكالة مع التحقق من الرصيد الكافي."""
    if amount <= 0:
        raise ValueError("المبلغ يجب أن يكون أكبر من صفر")

    wallet = Wallet.objects.select_for_update().get(agency=agency)

    if wallet.available_balance < amount:
        raise InsufficientBalanceError(
            f"الرصيد المتاح {wallet.available_balance} {wallet.currency} غير كافٍ للخصم {amount}"
        )

    balance_before = wallet.balance
    wallet.balance -= amount
    wallet.save(update_fields=['balance', 'updated_at'])

    return WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type='debit',
        amount=amount,
        currency=wallet.currency,
        status='completed',
        balance_before=balance_before,
        balance_after=wallet.balance,
        notes=notes,
        created_by=created_by,
        reference=reference,
    )


@transaction.atomic
def freeze_for_booking(booking, created_by=None) -> EscrowEntry:
    """
    تجميد مبلغ الحجز في Escrow.
    يُستدعى عند تأكيد الحجز (status → confirmed).
    """
    agency = booking.agency
    if not agency:
        raise WalletNotFoundError("الحجز غير مرتبط بوكالة")

    wallet = Wallet.objects.select_for_update().get(agency=agency)
    amount = booking.total_price

    if not amount or amount <= 0:
        raise ValueError("مبلغ الحجز غير محدد، احسب المجموع أولاً")

    if wallet.available_balance < amount:
        raise InsufficientBalanceError(
            f"الرصيد المتاح {wallet.available_balance} {wallet.currency} غير كافٍ لتجميد {amount}"
        )

    # تجميد المبلغ
    wallet.frozen_balance += amount
    wallet.save(update_fields=['frozen_balance', 'updated_at'])

    # إنشاء سجل العملية
    WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type='freeze',
        amount=amount,
        currency=wallet.currency,
        status='completed',
        balance_before=wallet.balance,
        balance_after=wallet.balance,
        booking=booking,
        created_by=created_by,
        notes=f"تجميد لحجز {booking.reference_number}",
    )

    # إنشاء قيد Escrow
    escrow = EscrowEntry.objects.create(
        wallet=wallet,
        booking=booking,
        amount=amount,
        currency=wallet.currency,
        status='frozen',
    )

    return escrow


@transaction.atomic
def release_escrow(booking, created_by=None) -> WalletTransaction:
    """
    خصم نهائي للمبلغ المجمد بعد إتمام الحجز.
    يُستدعى عند تغيير status → completed.
    """
    try:
        escrow = EscrowEntry.objects.select_for_update().get(
            booking=booking, status='frozen'
        )
    except EscrowEntry.DoesNotExist:
        raise ValueError(f"لا يوجد قيد Escrow نشط للحجز {booking.reference_number}")

    wallet = Wallet.objects.select_for_update().get(id=escrow.wallet_id)
    amount = escrow.amount

    balance_before = wallet.balance
    wallet.balance -= amount
    wallet.frozen_balance -= amount
    wallet.save(update_fields=['balance', 'frozen_balance', 'updated_at'])

    escrow.status = 'released'
    escrow.released_at = timezone.now()
    escrow.save(update_fields=['status', 'released_at'])

    return WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type='charge',
        amount=amount,
        currency=wallet.currency,
        status='completed',
        balance_before=balance_before,
        balance_after=wallet.balance,
        booking=booking,
        created_by=created_by,
        notes=f"خصم نهائي للحجز {booking.reference_number}",
    )


@transaction.atomic
def refund_escrow(booking, created_by=None) -> WalletTransaction:
    """
    استرداد المبلغ المجمد عند إلغاء الحجز.
    يُستدعى عند تغيير status → cancelled.
    """
    try:
        escrow = EscrowEntry.objects.select_for_update().get(
            booking=booking, status='frozen'
        )
    except EscrowEntry.DoesNotExist:
        raise ValueError(f"لا يوجد قيد Escrow نشط للحجز {booking.reference_number}")

    wallet = Wallet.objects.select_for_update().get(id=escrow.wallet_id)
    amount = escrow.amount

    balance_before = wallet.balance
    wallet.frozen_balance -= amount
    wallet.save(update_fields=['frozen_balance', 'updated_at'])

    escrow.status = 'refunded'
    escrow.released_at = timezone.now()
    escrow.save(update_fields=['status', 'released_at'])

    return WalletTransaction.objects.create(
        wallet=wallet,
        transaction_type='refund',
        amount=amount,
        currency=wallet.currency,
        status='completed',
        balance_before=balance_before,
        balance_after=wallet.balance,
        booking=booking,
        created_by=created_by,
        notes=f"استرداد لإلغاء الحجز {booking.reference_number}",
    )
