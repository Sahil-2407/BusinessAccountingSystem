from django.db import models

class Supplier(models.Model):

    company_name = models.CharField(max_length=150)

    contact_person = models.CharField(max_length=100)

    gst_number = models.CharField(
        max_length=20,
        unique=True
    )

    email = models.EmailField()

    phone = models.CharField(max_length=15)

    address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.company_name