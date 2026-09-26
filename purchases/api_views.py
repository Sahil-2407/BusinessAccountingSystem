from django.db import transaction

from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Purchase, PurchaseItem
from .serializers import PurchaseSerializer
from .services import (
    calculate_total,
    increase_stock,
    restore_stock,
    create_accounting_entries,
    update_accounting_entries,
    delete_accounting_entries,
)


class PurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Purchase.objects
            .filter(owner=self.request.user)
            .select_related("supplier")
            .prefetch_related("purchaseitem_set__product")
            .order_by("-purchase_date", "-id")
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        items_data = validated_data.pop("items")

        # Create purchase
        purchase = Purchase.objects.create(
            owner=request.user,
            **validated_data
        )

        # Create purchase items
        purchase_items = []

        for item_data in items_data:

            item = PurchaseItem(
                purchase=purchase,
                product=item_data["product"],
                quantity=item_data["quantity"],
                purchase_price=item_data["purchase_price"],
                subtotal=0,
            )

            purchase_items.append(item)

        # Calculate subtotals and total
        total = calculate_total(purchase_items)

        # Save items
        PurchaseItem.objects.bulk_create(purchase_items)

        # Save total
        purchase.total_amount = total
        purchase.save(update_fields=["total_amount"])

        # Increase product stock
        increase_stock(purchase_items)

        # Create accounting entries
        create_accounting_entries(purchase)

        output_serializer = self.get_serializer(purchase)

        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED
        )

    @transaction.atomic
    def update(self, request, *args, **kwargs):

        purchase = self.get_object()

        serializer = self.get_serializer(
            purchase,
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data

        items_data = validated_data.pop("items")

        # Remove old stock
        restore_stock(purchase)

        # Remove old accounting entries
        delete_accounting_entries(purchase)

        # Remove old items
        PurchaseItem.objects.filter(
            purchase=purchase
        ).delete()

        # Update purchase fields
        for field, value in validated_data.items():
            setattr(purchase, field, value)

        purchase.save()

        # Create new items
        purchase_items = []

        for item_data in items_data:

            item = PurchaseItem(
                purchase=purchase,
                product=item_data["product"],
                quantity=item_data["quantity"],
                purchase_price=item_data["purchase_price"],
                subtotal=0,
            )

            purchase_items.append(item)

        # Calculate new total
        total = calculate_total(purchase_items)

        # Save new items
        PurchaseItem.objects.bulk_create(purchase_items)

        # Update total
        purchase.total_amount = total
        purchase.save(update_fields=["total_amount"])

        # Increase stock using new items
        increase_stock(purchase_items)

        # Create new accounting entries
        create_accounting_entries(purchase)

        output_serializer = self.get_serializer(purchase)

        return Response(output_serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):

        purchase = self.get_object()

        # Restore stock
        restore_stock(purchase)

        # Delete accounting entries
        delete_accounting_entries(purchase)

        # Delete purchase
        purchase.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )