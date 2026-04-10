from rest_framework import serializers
from apps.wallet.models import Wallet, WalletTransaction, EscrowEntry


class WalletSerializer(serializers.ModelSerializer):
    agency_name       = serializers.CharField(source='agency.name', read_only=True)
    available_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model  = Wallet
        fields = [
            'id', 'agency', 'agency_name',
            'balance', 'frozen_balance', 'available_balance',
            'currency', 'is_active', 'updated_at'
        ]
        read_only_fields = ['balance', 'frozen_balance', 'agency']


class WalletTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = WalletTransaction
        fields = [
            'id', 'wallet', 'transaction_type', 'transaction_type_display',
            'amount', 'currency', 'status', 'status_display',
            'balance_before', 'balance_after',
            'booking', 'reference', 'notes', 'created_at'
        ]
        read_only_fields = fields


class CreditDebitSerializer(serializers.Serializer):
    amount    = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    notes     = serializers.CharField(required=False, allow_blank=True)
    reference = serializers.CharField(required=False, allow_blank=True)
