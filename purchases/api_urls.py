from rest_framework.routers import DefaultRouter

from .api_views import PurchaseViewSet


router = DefaultRouter()

router.register(
    "purchases",
    PurchaseViewSet,
    basename="purchase"
)

urlpatterns = router.urls