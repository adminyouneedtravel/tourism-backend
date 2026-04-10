from django.apps import AppConfig

class ProvidersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.providers'
    verbose_name = 'مزودو البيانات'

    def ready(self):
        import apps.providers.signals  # noqa
