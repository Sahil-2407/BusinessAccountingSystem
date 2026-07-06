from django.contrib import admin

from .models import Ledger
from .models import Journal
from .models import CashBook

admin.site.register(Ledger)
admin.site.register(Journal)
admin.site.register(CashBook)