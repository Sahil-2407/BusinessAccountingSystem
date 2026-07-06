from django.db import models


class Expense(models.Model):

    CATEGORY_CHOICES = (

        ("Rent", "Rent"),

        ("Electricity", "Electricity"),

        ("Internet", "Internet"),

        ("Salary", "Salary"),

        ("Transport", "Transport"),

        ("Marketing", "Marketing"),

        ("Maintenance", "Maintenance"),

        ("Other", "Other"),

    )

    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    expense_date = models.DateField()

    description = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.category} - ₹{self.amount}"