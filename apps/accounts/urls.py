# apps/accounts/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    RegisterAgencyView,
    RegisterTouristView,
    AgencyViewSet,
    UserViewSet,
)

router = DefaultRouter()
router.register(r'agencies', AgencyViewSet, basename='agency')
router.register(r'users',    UserViewSet,   basename='user')

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────
    path('auth/login/',             LoginView.as_view(),           name='auth-login'),
    path('auth/logout/',            LogoutView.as_view(),          name='auth-logout'),
    path('auth/token/refresh/',     TokenRefreshView.as_view(),    name='token-refresh'),
    path('auth/register/tourist/',  RegisterTouristView.as_view(), name='register-tourist'),
    path('auth/register/agency/',   RegisterAgencyView.as_view(),  name='register-agency'),
    path('auth/me/',                MeView.as_view(),              name='auth-me'),
    path('auth/change-password/',   ChangePasswordView.as_view(),  name='change-password'),

    # ── ViewSets ──────────────────────────────────────────
    path('', include(router.urls)),
]