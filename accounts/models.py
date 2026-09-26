from django.db import models
from django.contrib.auth.models import User


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )
    phone = models.CharField(
        max_length=15,
        blank=True
    )
    address = models.TextField(
        blank=True
    )
    company = models.CharField(
        max_length=100,
        blank=True
    )
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )

    def __str__(self):
        return self.user.username


class BusinessSettings(models.Model):
    owner = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="business_settings"
    )

    business_name = models.CharField(
        max_length=200,
        default="My Business"
    )

    address = models.TextField(
        blank=True
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    gst_number = models.CharField(
        max_length=50,
        blank=True
    )

    logo = models.ImageField(
        upload_to="business_logos/",
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return self.business_name