from decimal import Decimal

from django.db import transaction
from django.http import HttpResponse

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from .models import Sale, SaleItem
from .serializers import SaleSerializer

from .services import (
    calculate_total,
    reduce_stock,
    restore_stock,
    create_sale_accounting_entries,
    update_sale_accounting_entries,
    delete_sale_accounting_entries,
)


class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Sale.objects
            .filter(owner=self.request.user)
            .select_related("customer")
            .prefetch_related(
                "saleitem_set__product"
            )
            .order_by("-sale_date", "-id")
        )

    # =========================================================
    # CREATE SALE
    # =========================================================

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        items = data.pop("items", [])

        if not items:
            return Response(
                {
                    "error": "At least one product is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer_id = data.get("customer")

        if not customer_id:
            return Response(
                {
                    "error": "Customer is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():

                # -------------------------------------------------
                # CREATE SALE
                # -------------------------------------------------

                sale = Sale.objects.create(
                    owner=request.user,
                    customer_id=customer_id,
                    invoice_number=data.get(
                        "invoice_number"
                    ),
                    sale_date=data.get(
                        "sale_date"
                    ),
                    payment_status=data.get(
                        "payment_status",
                        "Pending"
                    ),
                    total_amount=Decimal("0.00"),
                )

                total = Decimal("0.00")

                # -------------------------------------------------
                # CREATE SALE ITEMS
                # -------------------------------------------------

                for item in items:

                    product_id = item.get("product")
                    quantity = int(
                        item.get("quantity", 0)
                    )

                    if not product_id:
                        raise ValueError(
                            "Product is required."
                        )

                    if quantity <= 0:
                        raise ValueError(
                            "Quantity must be greater than zero."
                        )

                    from inventory.models import Product

                    product = Product.objects.get(
                        id=product_id,
                        owner=request.user,
                    )

                    selling_price = Decimal(
                        str(
                            item.get(
                                "selling_price",
                                product.selling_price,
                            )
                        )
                    )

                    if product.stock_quantity < quantity:
                        raise ValueError(
                            f"Insufficient stock for "
                            f"{product.name}. "
                            f"Available stock: "
                            f"{product.stock_quantity}"
                        )

                    subtotal = (
                        selling_price
                        * quantity
                    )

                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=quantity,
                        selling_price=selling_price,
                        subtotal=subtotal,
                    )

                    reduce_stock(
                        product,
                        quantity
                    )

                    total += subtotal

                # -------------------------------------------------
                # UPDATE TOTAL
                # -------------------------------------------------

                sale.total_amount = total
                sale.save(
                    update_fields=["total_amount"]
                )

                # -------------------------------------------------
                # ACCOUNTING
                # -------------------------------------------------

                create_sale_accounting_entries(
                    sale
                )

            serializer = self.get_serializer(
                sale
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        except ValueError as e:
            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # =========================================================
    # UPDATE SALE
    # =========================================================

    def update(self, request, *args, **kwargs):

        sale = self.get_object()

        data = request.data.copy()

        items = data.pop(
            "items",
            None
        )

        try:
            with transaction.atomic():

                # -------------------------------------------------
                # UPDATE BASIC SALE INFORMATION
                # -------------------------------------------------

                if "customer" in data:
                    sale.customer_id = data[
                        "customer"
                    ]

                if "invoice_number" in data:
                    sale.invoice_number = data[
                        "invoice_number"
                    ]

                if "sale_date" in data:
                    sale.sale_date = data[
                        "sale_date"
                    ]

                if "payment_status" in data:
                    sale.payment_status = data[
                        "payment_status"
                    ]

                # -------------------------------------------------
                # UPDATE ITEMS
                # -------------------------------------------------

                if items is not None:

                    # Restore old stock
                    old_items = list(
                        sale.saleitem_set.select_related(
                            "product"
                        ).all()
                    )

                    for old_item in old_items:
                        restore_stock(
                            old_item.product,
                            old_item.quantity
                        )

                    # Delete old items
                    sale.saleitem_set.all().delete()

                    total = Decimal("0.00")

                    from inventory.models import Product

                    for item in items:

                        product_id = item.get(
                            "product"
                        )

                        quantity = int(
                            item.get(
                                "quantity",
                                0
                            )
                        )

                        if not product_id:
                            raise ValueError(
                                "Product is required."
                            )

                        if quantity <= 0:
                            raise ValueError(
                                "Quantity must be greater than zero."
                            )

                        product = Product.objects.get(
                            id=product_id,
                            owner=request.user,
                        )

                        selling_price = Decimal(
                            str(
                                item.get(
                                    "selling_price",
                                    product.selling_price,
                                )
                            )
                        )

                        if (
                            product.stock_quantity
                            < quantity
                        ):
                            raise ValueError(
                                f"Insufficient stock "
                                f"for {product.name}."
                            )

                        subtotal = (
                            selling_price
                            * quantity
                        )

                        SaleItem.objects.create(
                            sale=sale,
                            product=product,
                            quantity=quantity,
                            selling_price=selling_price,
                            subtotal=subtotal,
                        )

                        reduce_stock(
                            product,
                            quantity
                        )

                        total += subtotal

                    sale.total_amount = total

                sale.save()

                # -------------------------------------------------
                # UPDATE ACCOUNTING
                # -------------------------------------------------

                update_sale_accounting_entries(
                    sale
                )

            serializer = self.get_serializer(
                sale
            )

            return Response(
                serializer.data
            )

        except ValueError as e:
            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as e:
            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # =========================================================
    # DELETE SALE
    # =========================================================

    def destroy(
        self,
        request,
        *args,
        **kwargs
    ):

        sale = self.get_object()

        try:
            with transaction.atomic():

                # Restore stock
                sale_items = list(
                    sale.saleitem_set.select_related(
                        "product"
                    ).all()
                )

                for item in sale_items:
                    restore_stock(
                        item.product,
                        item.quantity
                    )

                # Delete accounting entries
                delete_sale_accounting_entries(
                    sale
                )

                sale.delete()

            return Response(
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # =========================================================
    # PROFESSIONAL PDF INVOICE
    # =========================================================

    @action(
        detail=True,
        methods=["get"],
        url_path="pdf",
    )
    def pdf(self, request, pk=None):

        # ---------------------------------------------------------
        # GET SALE
        # ---------------------------------------------------------

        sale = (
            self.get_queryset()
            .filter(id=pk)
            .first()
        )

        if not sale:
            return Response(
                {
                    "error": "Sale not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ---------------------------------------------------------
        # PDF RESPONSE
        # ---------------------------------------------------------

        response = HttpResponse(
            content_type="application/pdf"
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; '
            f'filename="{sale.invoice_number}.pdf"'
        )

        # ---------------------------------------------------------
        # DOCUMENT
        # ---------------------------------------------------------

        doc = SimpleDocTemplate(
            response,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=12 * mm,
            bottomMargin=15 * mm,
        )

        styles = getSampleStyleSheet()

        # ---------------------------------------------------------
        # STYLES
        # ---------------------------------------------------------

        business_style = styles["Title"]

        business_style.fontSize = 20
        business_style.leading = 24

        invoice_style = styles["Heading2"]

        invoice_style.fontSize = 15
        invoice_style.leading = 18

        normal_style = styles["Normal"]

        normal_style.fontSize = 9
        normal_style.leading = 12

        small_style = styles["Normal"]

        small_style.fontSize = 8
        small_style.leading = 10

        elements = []

        # =========================================================
        # BUSINESS DETAILS
        # =========================================================

        # CHANGE THESE VALUES TO YOUR REAL BUSINESS DETAILS

        business_name = (
            "YOUR BUSINESS NAME"
        )

        business_address = (
            "Your Address, "
            "Dharmavaram, Andhra Pradesh"
        )

        business_phone = (
            "Phone: +91 XXXXXXXXXX"
        )

        business_email = (
            "Email: your@email.com"
        )

        business_gst = (
            "GSTIN: Not Applicable"
        )

        # =========================================================
        # HEADER
        # =========================================================

        header_left = [
            Paragraph(
                f"<b>{business_name}</b>",
                business_style,
            ),
            Paragraph(
                business_address,
                normal_style,
            ),
            Paragraph(
                business_phone,
                normal_style,
            ),
            Paragraph(
                business_email,
                normal_style,
            ),
            Paragraph(
                business_gst,
                normal_style,
            ),
        ]

        header_right = [
            Paragraph(
                "<b>SALES INVOICE</b>",
                invoice_style,
            ),
            Spacer(1, 5),
            Paragraph(
                f"<b>Invoice:</b> "
                f"{sale.invoice_number}",
                normal_style,
            ),
            Paragraph(
                f"<b>Date:</b> "
                f"{sale.sale_date}",
                normal_style,
            ),
            Paragraph(
                f"<b>Status:</b> "
                f"{sale.payment_status}",
                normal_style,
            ),
        ]

        header_table = Table(
            [
                [
                    header_left,
                    header_right,
                ]
            ],
            colWidths=[
                105 * mm,
                70 * mm,
            ],
        )

        header_table.setStyle(
            TableStyle(
                [
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "ALIGN",
                        (1, 0),
                        (1, 0),
                        "RIGHT",
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        10,
                    ),
                ]
            )
        )

        elements.append(
            header_table
        )

        # =========================================================
        # CUSTOMER DETAILS
        # =========================================================

        customer = sale.customer

        if customer:

            customer_name = (
                customer.name
                or "Customer"
            )

            customer_email = (
                customer.email
                if customer.email
                else "-"
            )

            customer_phone = (
                customer.phone
                if customer.phone
                else "-"
            )

            customer_address = (
                customer.address
                if customer.address
                else "-"
            )

        else:

            customer_name = (
                "Walk-in Customer"
            )

            customer_email = "-"
            customer_phone = "-"
            customer_address = "-"

        customer_data = [

            [
                Paragraph(
                    "<b>BILL TO</b>",
                    normal_style,
                ),
                "",
            ],

            [
                Paragraph(
                    f"<b>"
                    f"{customer_name}"
                    f"</b>",
                    normal_style,
                ),
                "",
            ],

            [
                Paragraph(
                    f"Phone: "
                    f"{customer_phone}",
                    small_style,
                ),
                Paragraph(
                    f"Invoice No: "
                    f"{sale.invoice_number}",
                    small_style,
                ),
            ],

            [
                Paragraph(
                    f"Email: "
                    f"{customer_email}",
                    small_style,
                ),
                Paragraph(
                    f"Invoice Date: "
                    f"{sale.sale_date}",
                    small_style,
                ),
            ],

            [
                Paragraph(
                    f"Address: "
                    f"{customer_address}",
                    small_style,
                ),
                Paragraph(
                    f"Payment: "
                    f"{sale.payment_status}",
                    small_style,
                ),
            ],
        ]

        customer_table = Table(
            customer_data,
            colWidths=[
                100 * mm,
                75 * mm,
            ],
        )

        customer_table.setStyle(
            TableStyle(
                [
                    (
                        "SPAN",
                        (0, 0),
                        (1, 0),
                    ),
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.whitesmoke,
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.6,
                        colors.grey,
                    ),
                    (
                        "INNERGRID",
                        (0, 1),
                        (-1, -1),
                        0.3,
                        colors.lightgrey,
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        elements.append(
            customer_table
        )

        elements.append(
            Spacer(1, 15)
        )

        # =========================================================
        # ITEMS
        # =========================================================

        item_data = [

            [
                Paragraph(
                    "<b>#</b>",
                    small_style,
                ),
                Paragraph(
                    "<b>Product</b>",
                    small_style,
                ),
                Paragraph(
                    "<b>Qty</b>",
                    small_style,
                ),
                Paragraph(
                    "<b>Price</b>",
                    small_style,
                ),
                Paragraph(
                    "<b>Subtotal</b>",
                    small_style,
                ),
            ]

        ]

        sale_items = (
            sale.saleitem_set
            .select_related("product")
            .all()
        )

        subtotal = Decimal("0.00")

        for index, item in enumerate(
            sale_items,
            start=1,
        ):

            subtotal += (
                item.subtotal
            )

            product_name = (
                item.product.name
            )

            item_data.append(
                [
                    str(index),

                    Paragraph(
                        product_name,
                        small_style,
                    ),

                    str(
                        item.quantity
                    ),

                    f"Rs. "
                    f"{item.selling_price:,.2f}",

                    f"Rs. "
                    f"{item.subtotal:,.2f}",
                ]
            )

        items_table = Table(
            item_data,
            colWidths=[
                12 * mm,
                78 * mm,
                18 * mm,
                32 * mm,
                35 * mm,
            ],
            repeatRows=1,
        )

        items_table.setStyle(
            TableStyle(
                [
                    (
                        "BACKGROUND",
                        (0, 0),
                        (-1, 0),
                        colors.HexColor(
                            "#eeeeee"
                        ),
                    ),
                    (
                        "BOX",
                        (0, 0),
                        (-1, -1),
                        0.7,
                        colors.grey,
                    ),
                    (
                        "INNERGRID",
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.lightgrey,
                    ),
                    (
                        "ALIGN",
                        (0, 0),
                        (0, -1),
                        "CENTER",
                    ),
                    (
                        "ALIGN",
                        (2, 1),
                        (-1, -1),
                        "RIGHT",
                    ),
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "MIDDLE",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "LEFTPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "RIGHTPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        elements.append(
            items_table
        )

        elements.append(
            Spacer(1, 12)
        )

        # =========================================================
        # TOTAL
        # =========================================================

        total_data = [

            [
                "",
                Paragraph(
                    "<b>Subtotal</b>",
                    normal_style,
                ),
                Paragraph(
                    f"Rs. "
                    f"{subtotal:,.2f}",
                    normal_style,
                ),
            ],

            [
                "",
                Paragraph(
                    "<b>Grand Total</b>",
                    normal_style,
                ),
                Paragraph(
                    f"<b>Rs. "
                    f"{sale.total_amount:,.2f}"
                    f"</b>",
                    normal_style,
                ),
            ],

        ]

        total_table = Table(
            total_data,
            colWidths=[
                100 * mm,
                40 * mm,
                35 * mm,
            ],
        )

        total_table.setStyle(
            TableStyle(
                [
                    (
                        "LINEABOVE",
                        (1, 0),
                        (-1, 0),
                        0.7,
                        colors.grey,
                    ),
                    (
                        "LINEABOVE",
                        (1, 1),
                        (-1, 1),
                        1,
                        colors.black,
                    ),
                    (
                        "ALIGN",
                        (1, 0),
                        (-1, -1),
                        "RIGHT",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        7,
                    ),
                ]
            )
        )

        elements.append(
            total_table
        )

        elements.append(
            Spacer(1, 25)
        )

        # =========================================================
        # PAYMENT + SIGNATURE
        # =========================================================

        notes_data = [

            [
                Paragraph(
                    "<b>Payment Information</b>",
                    normal_style,
                ),
                Paragraph(
                    "<b>Authorized Signature</b>",
                    normal_style,
                ),
            ],

            [
                Paragraph(
                    f"Payment Status: "
                    f"{sale.payment_status}",
                    small_style,
                ),
                Paragraph(
                    "____________________________",
                    small_style,
                ),
            ],

            [
                Paragraph(
                    "Thank you for your business!",
                    small_style,
                ),
                Paragraph(
                    "Authorized Signatory",
                    small_style,
                ),
            ],

        ]

        notes_table = Table(
            notes_data,
            colWidths=[
                100 * mm,
                75 * mm,
            ],
        )

        notes_table.setStyle(
            TableStyle(
                [
                    (
                        "VALIGN",
                        (0, 0),
                        (-1, -1),
                        "TOP",
                    ),
                    (
                        "TOPPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                    (
                        "BOTTOMPADDING",
                        (0, 0),
                        (-1, -1),
                        6,
                    ),
                ]
            )
        )

        elements.append(
            notes_table
        )

        elements.append(
            Spacer(1, 20)
        )

        # =========================================================
        # FOOTER
        # =========================================================

        elements.append(
            Paragraph(
                "This is a computer-generated invoice.",
                small_style,
            )
        )

        # =========================================================
        # BUILD PDF
        # =========================================================

        doc.build(
            elements
        )

        return response