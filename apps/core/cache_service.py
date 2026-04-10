from django.core.cache import cache, caches
from django.conf import settings
from functools import wraps
import hashlib
import json
import logging

logger = logging.getLogger('apps.core')

PRICES_CACHE = caches['prices']


def make_key(*args, **kwargs) -> str:
    """توليد cache key موحد من أي معاملات."""
    raw = json.dumps({'args': args, 'kwargs': kwargs}, sort_keys=True, default=str)
    return hashlib.md5(raw.encode()).hexdigest()


# ── Hotel Prices Cache ─────────────────────────────────────
def get_hotel_prices(hotel_id: int, check_in: str, check_out: str):
    """جلب أسعار فندق من الـ Cache."""
    key = f"hotel_prices:{hotel_id}:{check_in}:{check_out}"
    return PRICES_CACHE.get(key)


def set_hotel_prices(hotel_id: int, check_in: str, check_out: str, data: list):
    """حفظ أسعار فندق في الـ Cache."""
    key = f"hotel_prices:{hotel_id}:{check_in}:{check_out}"
    ttl = settings.CACHE_TTL.get('hotel_prices', 3600)
    PRICES_CACHE.set(key, data, timeout=ttl)
    logger.debug(f"Cached hotel prices: hotel={hotel_id} ttl={ttl}s")


def invalidate_hotel_prices(hotel_id: int):
    """مسح Cache أسعار فندق معين (عند تغيير السعر)."""
    try:
        client = PRICES_CACHE.client.get_client()
        pattern = f"ynt_prices:*hotel_prices:{hotel_id}:*"
        keys = client.keys(pattern)
        if keys:
            client.delete(*keys)
            logger.info(f"Invalidated {len(keys)} hotel price keys: hotel={hotel_id}")
        else:
            logger.debug(f"No cache keys found for hotel={hotel_id}")
    except Exception as e:
        logger.warning(f"فشل مسح cache الأسعار: {e}")


# ── Search Results Cache ───────────────────────────────────
def get_search_results(query: str, city_id: int = None, content_type: str = None):
    """جلب نتائج بحث من الـ Cache."""
    key = f"search:{make_key(query=query, city_id=city_id, content_type=content_type)}"
    return cache.get(key)


def set_search_results(query: str, data: list, city_id: int = None, content_type: str = None):
    """حفظ نتائج بحث في الـ Cache."""
    key = f"search:{make_key(query=query, city_id=city_id, content_type=content_type)}"
    ttl = settings.CACHE_TTL.get('search_results', 900)
    cache.set(key, data, timeout=ttl)


def invalidate_search_cache():
    """مسح كل نتائج البحث (عند إضافة فندق أو خدمة جديدة)."""
    try:
        from django.core.cache import caches
        c = caches['default']
        client = c.client.get_client()
        keys = client.keys("ynt:*search:*")
        if keys:
            client.delete(*keys)
            logger.info(f"Search cache invalidated: {len(keys)} keys")
    except Exception as e:
        logger.warning(f"فشل مسح search cache: {e}")


# ── Package List Cache ─────────────────────────────────────
def get_packages_cache(agency_id: int = None):
    key = f"packages:{agency_id or 'all'}"
    return cache.get(key)


def set_packages_cache(data: list, agency_id: int = None):
    key = f"packages:{agency_id or 'all'}"
    ttl = settings.CACHE_TTL.get('package_list', 1800)
    cache.set(key, data, timeout=ttl)


def invalidate_packages_cache():
    try:
        from django.core.cache import caches
        c = caches['default']
        client = c.client.get_client()
        keys = client.keys("ynt:packages:*")
        if keys:
            client.delete(*keys)
    except Exception:
        pass


# ── Agency Stats Cache ─────────────────────────────────────
def get_agency_stats(agency_id: int):
    key = f"agency_stats:{agency_id}"
    return cache.get(key)


def set_agency_stats(agency_id: int, data: dict):
    key = f"agency_stats:{agency_id}"
    ttl = settings.CACHE_TTL.get('agency_stats', 300)
    cache.set(key, data, timeout=ttl)


def invalidate_agency_stats(agency_id: int):
    cache.delete(f"ynt:agency_stats:{agency_id}")


# ── Site Settings Cache ────────────────────────────────────
def get_site_settings():
    return cache.get("site_settings")


def set_site_settings(data: dict):
    ttl = settings.CACHE_TTL.get('site_settings', 86400)
    cache.set("site_settings", data, timeout=ttl)


def invalidate_site_settings():
    cache.delete("ynt:site_settings")


# ── Decorator ─────────────────────────────────────────────
def cached(ttl: int = 300, cache_alias: str = 'default', key_prefix: str = ''):
    """
    Decorator لكش أي function تلقائياً.
    
    مثال:
        @cached(ttl=600, key_prefix='hotel')
        def get_hotel_data(hotel_id):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = f"{key_prefix}:{func.__name__}:{make_key(*args, **kwargs)}"
            c = caches[cache_alias]
            result = c.get(key)
            if result is None:
                result = func(*args, **kwargs)
                if result is not None:
                    c.set(key, result, timeout=ttl)
            return result
        return wrapper
    return decorator
