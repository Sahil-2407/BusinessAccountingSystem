from django.db import models
from django.contrib.auth.models import User


class Ledger(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    particulars = models.CharField(
        max_length=200
    )

    debit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    credit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    def __str__(self):
        return self.particulars


class Journal(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    description = models.CharField(
        max_length=200
    )

    debit_account = models.CharField(
        max_length=100
    )

    credit_account = models.CharField(
        max_length=100
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    def __str__(self):
        return self.description


class CashBook(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    receipt = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    payment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    remarks = models.CharField(
        max_length=200,
        blank=True
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    def __str__(self):
        return str(self.date)