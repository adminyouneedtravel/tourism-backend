from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SeasonViewSet, RoomPriceViewSet

router = DefaultRouter()
router.register(r'seasons', SeasonViewSet)
router.register(r'room-prices', RoomPriceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]