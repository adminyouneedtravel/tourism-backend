from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomPackageViewSet

router = DefaultRouter()
router.register(r'', CustomPackageViewSet, basename='custom-package')

urlpatterns = [
    path('', include(router.urls)),
]