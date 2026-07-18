from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE
    )

    name = models.CharField(max_length=150)

    sku = models.CharField(
        max_length=50,
        unique=True
    )

    purchase_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    stock_quantity = models.IntegerField(default=0)

    minimum_stock = models.IntegerField(default=10)

    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True
    )

    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name