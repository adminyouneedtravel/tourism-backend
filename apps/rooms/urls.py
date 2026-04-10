from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoomTypeViewSet

router = DefaultRouter()
router.register(r'', RoomTypeViewSet, basename='roomtype')

urlpatterns = [
    path('', include(router.urls)),
]
