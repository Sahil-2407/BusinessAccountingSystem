from django import forms
from django.forms import inlineformset_factory

from .models import Purchase
from .models import PurchaseItem


class PurchaseForm(forms.ModelForm):

    class Meta:

        model = Purchase

        fields = [
            "supplier",
            "invoice_number",
            "purchase_date",
        ]

        widgets = {

            "purchase_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control"
                }
            ),
        }


PurchaseItemFormSet = inlineformset_factory(

    Purchase,

    PurchaseItem,

    fields=[
        "product",
        "quantity",
        "purchase_price",
    ],

    extra=1,

    can_delete=True
)