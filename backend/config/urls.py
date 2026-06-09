from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import UserViewSet
from medications.views import CategoryViewSet, MedicationViewSet
from inventory.views import StockMovementViewSet
from insurance.views import InsuranceViewSet
from sales.views import SaleViewSet
from app_settings.views import PharmacySettingsViewSet
from notifications.views import NotificationViewSet
from .health import health

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'medications', MedicationViewSet)
router.register(r'inventory', StockMovementViewSet)
router.register(r'insurance', InsuranceViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'settings', PharmacySettingsViewSet, basename='settings')
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health, name='health'),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
