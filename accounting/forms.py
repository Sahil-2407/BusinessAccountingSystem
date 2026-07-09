from django import forms
from .models import Ledger, Journal, CashBook


class LedgerForm(forms.ModelForm):

    class Meta:
        model = Ledger
        fields = "__all__"

        widgets = {
            "date": forms.DateInput(attrs={"type": "date"})
        }


class JournalForm(forms.ModelForm):

    class Meta:
        model = Journal
        fields = "__all__"

        widgets = {
            "date": forms.DateInput(attrs={"type": "date"})
        }


class CashBookForm(forms.ModelForm):

    class Meta:
        model = CashBook
        fields = "__all__"

        widgets = {
            "date": forms.DateInput(attrs={"type": "date"})
        }