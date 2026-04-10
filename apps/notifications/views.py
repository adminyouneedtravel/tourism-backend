# apps/notifications/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # بدون [:50] لأن get_object() يحتاج queryset غير مقيد
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        # نُقيد العرض بـ 50 فقط عند الـ list
        qs = self.get_queryset()[:50]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    # ── GET /notifications/unread-count/ ──────────────────
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'count': count})

    # ── POST /notifications/{id}/mark-read/ ───────────────
    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'status': 'ok'})

    # ── POST /notifications/mark-all-read/ ────────────────
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({'status': 'ok'})