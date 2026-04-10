from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.wallet.models import Wallet, WalletTransaction
from apps.wallet.serializers import WalletSerializer, WalletTransactionSerializer, CreditDebitSerializer
from apps.wallet import services as wallet_services


class WalletViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Wallet.objects.select_related('agency').all()
        if user.is_agency_user and user.agency:
            return Wallet.objects.filter(agency=user.agency)
        return Wallet.objects.none()

    @action(detail=True, methods=['post'], url_path='credit')
    def credit(self, request, pk=None):
        if not request.user.is_admin:
            return Response({'detail': 'غير مصرح'}, status=status.HTTP_403_FORBIDDEN)
        wallet = self.get_object()
        serializer = CreditDebitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tx = wallet_services.credit_wallet(
                agency=wallet.agency,
                amount=serializer.validated_data['amount'],
                notes=serializer.validated_data.get('notes', ''),
                created_by=request.user,
                reference=serializer.validated_data.get('reference', ''),
            )
            return Response(WalletTransactionSerializer(tx).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='debit')
    def debit(self, request, pk=None):
        if not request.user.is_admin:
            return Response({'detail': 'غير مصرح'}, status=status.HTTP_403_FORBIDDEN)
        wallet = self.get_object()
        serializer = CreditDebitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            tx = wallet_services.debit_wallet(
                agency=wallet.agency,
                amount=serializer.validated_data['amount'],
                notes=serializer.validated_data.get('notes', ''),
                created_by=request.user,
                reference=serializer.validated_data.get('reference', ''),
            )
            return Response(WalletTransactionSerializer(tx).data, status=status.HTTP_201_CREATED)
        except wallet_services.InsufficientBalanceError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WalletTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletTransactionSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return WalletTransaction.objects.select_related(
                'wallet__agency', 'booking', 'created_by'
            ).all()
        if user.is_agency_user and user.agency:
            return WalletTransaction.objects.filter(
                wallet__agency=user.agency
            ).select_related('booking')
        return WalletTransaction.objects.none()
