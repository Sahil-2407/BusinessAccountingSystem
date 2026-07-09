from django import forms
from django.forms import inlineformset_factory

from .models import Sale
from .models import SaleItem


class SaleForm(forms.ModelForm):

    class Meta:

        model = Sale

        fields = [
            "customer",
            "invoice_number",
            "sale_date",
            "payment_status",
        ]

        widgets = {

            "sale_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control"
                }
            ),

        }


SaleItemFormSet = inlineformset_factory(

    Sale,

    SaleItem,

    fields=[
        "product",
        "quantity",
        "selling_price",
    ],

    extra=1,

    can_delete=True
)