# apps/settings_app/views.py

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUser
from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        settings = SiteSettings.get()
        return Response(SiteSettingsSerializer(settings, context={'request': request}).data)

    def patch(self, request):
        settings = SiteSettings.get()
        serializer = SiteSettingsSerializer(
            settings, data=request.data,
            partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)