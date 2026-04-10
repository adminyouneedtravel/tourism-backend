from django.apps import AppConfig

class PricingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pricing'
    verbose_name = "الأسعار والمواسم"

    def ready(self):
        import apps.pricing.signals  # noqa
