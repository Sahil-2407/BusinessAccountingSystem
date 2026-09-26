from rest_framework.routers import DefaultRouter

from .views import (
    LedgerViewSet,
    JournalViewSet,
    CashBookViewSet,
)


router = DefaultRouter()

router.register(
    "ledger",
    LedgerViewSet,
    basename="ledger"
)

router.register(
    "journal",
    JournalViewSet,
    basename="journal"
)

router.register(
    "cashbook",
    CashBookViewSet,
    basename="cashbook"
)

urlpatterns = router.urls