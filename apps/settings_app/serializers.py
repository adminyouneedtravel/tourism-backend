# apps/settings_app/serializers.py

from rest_framework import serializers
from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    site_logo_url = serializers.SerializerMethodField()

    class Meta:
        model  = SiteSettings
        fields = ['id', 'site_name', 'site_logo', 'site_logo_url', 'site_email', 'site_phone', 'site_address']

    def get_site_logo_url(self, obj) -> str | None:
        if obj.site_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.site_logo.url)
            return obj.site_logo.url
        return None