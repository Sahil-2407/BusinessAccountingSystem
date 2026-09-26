from rest_framework import serializers
from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        read_only_fields = ["owner", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ["owner", "created_at"]

    def validate_category(self, category):
        request = self.context.get("request")

        if request and category.owner != request.user:
            raise serializers.ValidationError(
                "You cannot use a category belonging to another user."
            )

        return category