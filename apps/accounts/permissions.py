# apps/accounts/permissions.py

from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """مدير عام فقط"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'super_admin' or request.user.is_superuser)
        )


class IsAdminUser(BasePermission):
    """مدير عام أو مشرف"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin
        )


class IsAgencyUser(BasePermission):
    """مستخدم وكالة شريكة"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_agency_user and
            request.user.agency is not None and
            request.user.agency.is_active
        )


class IsAgencyOrAdmin(BasePermission):
    """وكالة أو مشرف"""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_agency_user)
        )


class IsOwnerOrAdmin(BasePermission):
    """صاحب الكائن أو مشرف"""
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        # للمستخدم: هو نفسه
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user