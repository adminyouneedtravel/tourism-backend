from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # ─── API v1 ───────────────────────────────────────────
    path('api/v1/accounts/',      include('apps.accounts.urls')),
    path('api/v1/locations/',     include('apps.locations.urls')),
    path('api/v1/hotels/',        include('apps.hotels.urls')),
    path('api/v1/rooms/',         include('apps.rooms.urls')),
    path('api/v1/pricing/',       include('apps.pricing.urls')),
    path('api/v1/services/',      include('apps.services.urls')),
    path('api/v1/packages/',      include('apps.packages.urls')),
    path('api/v1/bookings/',      include('apps.bookings.urls')),
    path('api/v1/site-settings/', include('apps.settings_app.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/', include('apps.wallet.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
