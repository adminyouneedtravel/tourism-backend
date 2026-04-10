from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.wallet.views import WalletViewSet, WalletTransactionViewSet

router = DefaultRouter()
router.register(r'wallets', WalletViewSet, basename='wallet')
router.register(r'wallet-transactions', WalletTransactionViewSet, basename='wallet-transaction')

urlpatterns = [
    path('', include(router.urls)),
]
