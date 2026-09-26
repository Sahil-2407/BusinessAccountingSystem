from rest_framework.routers import DefaultRouter
from .views import BusinessSettingsViewSet


router = DefaultRouter()

router.register(
    "business-settings",
    BusinessSettingsViewSet,
    basename="business-settings"
)

urlpatterns = router.urls