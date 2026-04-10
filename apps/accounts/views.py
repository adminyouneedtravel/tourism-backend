# apps/accounts/views.py

import logging

from django.contrib.auth import authenticate
from django.db import transaction
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Agency, User

logger = logging.getLogger(__name__)
from .permissions import IsAdminUser, IsAgencyOrAdmin
from .serializers import (
    AgencySerializer,
    AgencyDetailSerializer,
    LoginSerializer,
    RegisterAgencySerializer,
    RegisterTouristSerializer,
    UserSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    AdminUserSerializer,
)


# ─────────────────────────────────────────────
# Auth Helper
# ─────────────────────────────────────────────

def _jwt_response(user: User, request=None) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access":  str(refresh.access_token),
        "refresh": str(refresh),
        "user":    UserSerializer(user, context={"request": request}).data,
    }


# ─────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────

class LoginThrottle(UserRateThrottle):
    scope = 'login'


class LoginView(APIView):
    permission_classes  = [AllowAny]
    throttle_classes    = [LoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        logger.info(f"Login: {user.username} ({user.role})")
        return Response(_jwt_response(user, request), status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# Register Tourist
# ─────────────────────────────────────────────

class RegisterTouristView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterTouristSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(_jwt_response(user, request), status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# Register Agency
# ─────────────────────────────────────────────

class RegisterAgencyView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = RegisterAgencySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            user = serializer.save()
        return Response(
            {
                "message": "تم استلام طلبك. سيتم مراجعته من قِبل الإدارة.",
                "user":    UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────
# Logout
# ─────────────────────────────────────────────

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh", ""))
            token.blacklist()
            logger.info(f"Logout: {request.user.username}")
        except Exception as e:
            logger.warning(f"Logout token error: {e}")
        return Response({"message": "تم تسجيل الخروج"}, status=status.HTTP_200_OK)


# ─────────────────────────────────────────────
# Me (Profile)
# ─────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data,
            partial=True, context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "تم تغيير كلمة المرور بنجاح"})


# ─────────────────────────────────────────────
# Agency ViewSet
# ─────────────────────────────────────────────

class AgencyViewSet(ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Agency.objects.all().prefetch_related("employees")
        if user.agency:
            return Agency.objects.filter(pk=user.agency_id)
        return Agency.objects.none()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AgencyDetailSerializer
        return AgencySerializer

    def get_permissions(self):
        if self.action in ("list", "create", "destroy", "approve", "reject", "all_agencies"):
            return [IsAdminUser()]
        if self.action in ("update", "partial_update"):
            return [IsAgencyOrAdmin()]
        return [IsAuthenticated()]

    # ── GET /agencies/ — المعتمدة فقط ────────────────────────────
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset().filter(status='active')
        return Response(AgencySerializer(qs, many=True, context={"request": request}).data)

    # ── GET /agencies/all/ — الكل للـ Admin ───────────────────────
    @action(detail=False, methods=["get"], url_path="all")
    def all_agencies(self, request):
        qs = Agency.objects.all().prefetch_related("employees").order_by("-created_at")
        return Response(AgencySerializer(qs, many=True, context={"request": request}).data)

    # ── GET /agencies/me/ ─────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        if not request.user.agency:
            return Response({"detail": "لا توجد وكالة مرتبطة بهذا الحساب."}, status=404)
        serializer = AgencyDetailSerializer(request.user.agency, context={"request": request})
        return Response(serializer.data)

    # ── POST /agencies/{id}/approve/ ──────────────────────────────
    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        agency = self.get_object()

        if agency.status == 'active':
            return Response({"detail": "الوكالة معتمدة مسبقاً."}, status=400)

        with transaction.atomic():
            agency.status      = 'active'
            agency.is_active   = True
            agency.approved_at = timezone.now()
            agency.approved_by = request.user
            agency.save(update_fields=["status", "is_active", "approved_at", "approved_by"])

            # تفعيل جميع مستخدمي الوكالة
            User.objects.filter(agency=agency).update(is_active=True)

        logger.info(f"Agency approved: {agency.name} by {request.user.username}")

        return Response(
            AgencySerializer(agency, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    # ── POST /agencies/{id}/reject/ ───────────────────────────────
    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        agency = self.get_object()

        if agency.status == 'active':
            return Response(
                {"detail": "لا يمكن رفض وكالة معتمدة. استخدم التعطيل."},
                status=400,
            )

        reason = request.data.get("reason", "")

        with transaction.atomic():
            # Soft Delete — نحتفظ بالسجل لأغراض التدقيق
            agency.status = "rejected"
            agency.is_active = False
            agency.rejection_reason = reason
            agency.save(update_fields=["status", "is_active", "rejection_reason"])
            User.objects.filter(agency=agency).update(is_active=False)


        logger.info(f"Agency rejected: {agency.name} by {request.user.username} — reason: {reason}")
        return Response(
            {"detail": "تم رفض الطلب وتعطيل الحساب.", "reason": reason},
            status=status.HTTP_200_OK,
        )

    # ── DELETE /agencies/{id}/ — Soft delete ──────────────────────
    def destroy(self, request, *args, **kwargs):
        agency = self.get_object()
        agency.is_active = False
        agency.status    = 'rejected'
        agency.save(update_fields=["is_active", "status"])
        return Response({"detail": f'تم تعطيل "{agency.name}".'}, status=200)
    




# ─────────────────────────────────────────────
# Users ViewSet (Admin only)
# ─────────────────────────────────────────────

class UserViewSet(ModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = User.objects.select_related('agency').order_by('-date_joined')

        role   = self.request.query_params.get('role')
        agency = self.request.query_params.get('agency')

        if role:
            qs = qs.filter(role=role)
        if agency:
            qs = qs.filter(agency_id=agency)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = AdminUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(AdminUserSerializer(user).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "لا يمكنك حذف حسابك الخاص."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)