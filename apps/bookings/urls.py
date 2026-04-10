from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, AgencyDashboardStatsView

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='booking')

urlpatterns = [
    path('dashboard-stats/', AgencyDashboardStatsView.as_view(), name='agency-dashboard-stats'),
    path('', include(router.urls)),
]