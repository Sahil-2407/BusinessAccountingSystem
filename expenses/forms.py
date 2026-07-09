from django import forms
from .models import Expense


class ExpenseForm(forms.ModelForm):

    class Meta:

        model = Expense

        fields = [
            "title",
            "category",
            "amount",
            "expense_date",
            "remarks",
        ]

        widgets = {

            "expense_date": forms.DateInput(
                attrs={
                    "type": "date",
                    "class": "form-control"
                }
            ),

            "title": forms.TextInput(
                attrs={
                    "class": "form-control"
                }
            ),

            "category": forms.Select(
                attrs={
                    "class": "form-select"
                }
            ),

            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control"
                }
            ),

            "remarks": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 3
                }
            ),

        }