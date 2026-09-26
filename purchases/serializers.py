from rest_framework import serializers

from .models import Purchase, PurchaseItem
from suppliers.models import Supplier
from inventory.models import Product


class PurchaseItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItem
        fields = [
            "id",
            "product",
            "quantity",
            "purchase_price",
            "subtotal",
        ]
        read_only_fields = ["id", "subtotal"]


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(
        many=True,
        write_only=True
    )

    purchase_items = PurchaseItemSerializer(
        source="purchaseitem_set",
        many=True,
        read_only=True
    )

    class Meta:
        model = Purchase
        fields = [
            "id",
            "supplier",
            "invoice_number",
            "purchase_date",
            "total_amount",
            "created_at",
            "items",
            "purchase_items",
        ]
        read_only_fields = [
            "id",
            "total_amount",
            "created_at",
            "purchase_items",
        ]

    def validate_supplier(self, supplier):
        request = self.context.get("request")

        if request and supplier.owner != request.user:
            raise serializers.ValidationError(
                "You cannot use a supplier belonging to another user."
            )

        return supplier

    def validate(self, data):
        request = self.context.get("request")
        items = data.get("items", [])

        if not items:
            raise serializers.ValidationError(
                {"items": "At least one product is required."}
            )

        if request:
            for item in items:
                product = item["product"]

                if product.owner != request.user:
                    raise serializers.ValidationError(
                        {
                            "items": (
                                f"You cannot use product "
                                f"'{product.name}' belonging to another user."
                            )
                        }
                    )

        return data

    def validate_supplier(self, supplier):
        request = self.context.get("request")

        if request and supplier.owner != request.user:
            raise serializers.ValidationError(
                "You cannot use a supplier belonging to another user."
            )

        return supplier

    def validate(self, data):
        request = self.context.get("request")
        items = data.get("items", [])

        if not items:
            raise serializers.ValidationError(
                {"items": "At least one product is required."}
            )

        if request:
            for item in items:
                product = item["product"]

                if product.owner != request.user:
                    raise serializers.ValidationError(
                        {
                            "items": (
                                f"You cannot use product "
                                f"'{product.name}' belonging to another user."
                            )
                        }
                    )

        return data