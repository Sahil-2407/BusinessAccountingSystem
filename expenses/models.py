from django.db import models
from django.contrib.auth.models import User


class Expense(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    CATEGORY_CHOICES = [
        ("Rent", "Rent"),
        ("Electricity", "Electricity"),
        ("Internet", "Internet"),
        ("Salary", "Salary"),
        ("Transport", "Transport"),
        ("Office", "Office"),
        ("Other", "Other"),
    ]

    title = models.CharField(max_length=200)

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    expense_date = models.DateField()

    remarks = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title