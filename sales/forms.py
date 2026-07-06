from django import forms
from .models import Sale


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
                    "type": "date"
                }
            )
        }