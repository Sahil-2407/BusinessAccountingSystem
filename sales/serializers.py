from rest_framework import serializers
from .models import Sale, SaleItem


class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "quantity",
            "selling_price",
            "subtotal",
        ]

        read_only_fields = [
            "id",
            "subtotal",
            "product_name",
        ]


class SaleSerializer(serializers.ModelSerializer):
    # Used when creating/updating a sale
    items = SaleItemSerializer(
        many=True,
        write_only=True
    )

    # Used when displaying an existing sale
    sale_items = SaleItemSerializer(
        source="saleitem_set",
        many=True,
        read_only=True
    )

    class Meta:
        model = Sale

        fields = [
            "id",
            "customer",
            "invoice_number",
            "sale_date",
            "total_amount",
            "payment_status",
            "created_at",
            "items",
            "sale_items",
        ]

        read_only_fields = [
            "id",
            "total_amount",
            "created_at",
            "sale_items",
        ]