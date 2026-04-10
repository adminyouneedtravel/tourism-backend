# apps/settings_app/urls.py

from django.urls import path
from .views import SiteSettingsView

urlpatterns = [
    path('', SiteSettingsView.as_view(), name='site-settings'),
]