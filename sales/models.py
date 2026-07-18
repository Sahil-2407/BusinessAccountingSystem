from django.db import models
from customers.models import Customer
from inventory.models import Product
from django.contrib.auth.models import User

class Sale(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE
    )

    invoice_number = models.CharField(
        max_length=100,
        unique=True
    )

    sale_date = models.DateField()

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    PAYMENT_CHOICES = (
        ("Paid", "Paid"),
        ("Pending", "Pending"),
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default="Pending"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.invoice_number


class SaleItem(models.Model):

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )

    quantity = models.PositiveIntegerField()

    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    def __str__(self):
        return self.product.name