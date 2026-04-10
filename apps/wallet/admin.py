from django.contrib import admin
from apps.wallet.models import Wallet, WalletTransaction, EscrowEntry


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display  = ['agency', 'balance', 'frozen_balance', 'available_balance', 'currency', 'is_active']
    list_filter   = ['currency', 'is_active']
    search_fields = ['agency__name']
    readonly_fields = ['balance', 'frozen_balance', 'created_at', 'updated_at']


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display  = ['wallet', 'transaction_type', 'amount', 'currency', 'status', 'created_at']
    list_filter   = ['transaction_type', 'status', 'currency']
    search_fields = ['wallet__agency__name', 'reference']
    readonly_fields = ['balance_before', 'balance_after', 'created_at']


@admin.register(EscrowEntry)
class EscrowEntryAdmin(admin.ModelAdmin):
    list_display  = ['booking', 'wallet', 'amount', 'currency', 'status', 'frozen_at']
    list_filter   = ['status', 'currency']
    readonly_fields = ['frozen_at', 'released_at']
