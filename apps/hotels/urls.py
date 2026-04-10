from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotelViewSet

router = DefaultRouter()
router.register(r'', HotelViewSet)  # ← أزلنا 'hotels' لتجنب التكرار

urlpatterns = [
    path('', include(router.urls)),
]