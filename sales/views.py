from django.shortcuts import render, redirect
from customers.models import Customer
from inventory.models import Product
from .models import Sale, SaleItem
from .forms import SaleForm, SaleItemFormSet
from decimal import Decimal
from accounting.models import Ledger
from accounting.models import Journal
from accounting.models import CashBook
from django.shortcuts import get_object_or_404
from .models import Sale, SaleItem
from django.http import HttpResponse

from reportlab.pdfgen import canvas

from reportlab.lib.units import inch

from reportlab.lib.colors import black

def sale_list(request):

    sales = Sale.objects.all().order_by("-sale_date")

    return render(
        request,
        "sales/sale_list.html",
        {
            "sales": sales
        }
    )

def sale_invoice(request, pk):

    sale = get_object_or_404(
        Sale,
        pk=pk
    )

    items = SaleItem.objects.filter(
        sale=sale
    )

    return render(
        request,
        "sales/sale_invoice.html",
        {
            "sale": sale,
            "items": items,
        }
    )

def sale_invoice_pdf(request, pk):

    sale = get_object_or_404(
        Sale,
        pk=pk
    )

    items = SaleItem.objects.filter(
        sale=sale
    )

    response = HttpResponse(
        content_type="application/pdf"
    )

    response["Content-Disposition"] = (
        f'attachment; filename="Invoice_{sale.invoice_number}.pdf"'
    )

    pdf = canvas.Canvas(response)

    y = 800

    pdf.setFont("Helvetica-Bold", 18)

    pdf.drawString(
        180,
        y,
        "Business Accounting ERP"
    )

    y -= 40

    pdf.setFont("Helvetica", 12)

    pdf.drawString(
        50,
        y,
        f"Invoice : {sale.invoice_number}"
    )

    y -= 20

    pdf.drawString(
        50,
        y,
        f"Customer : {sale.customer.name}"
    )

    y -= 20

    pdf.drawString(
        50,
        y,
        f"Date : {sale.sale_date}"
    )

    y -= 40

    pdf.setFont("Helvetica-Bold", 12)

    pdf.drawString(50, y, "Product")

    pdf.drawString(250, y, "Qty")

    pdf.drawString(330, y, "Price")

    pdf.drawString(430, y, "Subtotal")

    y -= 20

    pdf.line(50, y, 550, y)

    y -= 20

    pdf.setFont("Helvetica", 11)

    for item in items:

        pdf.drawString(
            50,
            y,
            item.product.name
        )

        pdf.drawString(
            250,
            y,
            str(item.quantity)
        )

        pdf.drawString(
            330,
            y,
            f"{item.selling_price}"
        )

        pdf.drawString(
            430,
            y,
            f"{item.subtotal}"
        )

        y -= 20

    y -= 20

    pdf.line(50, y, 550, y)

    y -= 30

    pdf.setFont("Helvetica-Bold", 14)

    pdf.drawString(
        320,
        y,
        f"Grand Total : ₹ {sale.total_amount}"
    )

    y -= 50

    pdf.setFont("Helvetica", 12)

    pdf.drawString(
        50,
        y,
        "Authorized Signature"
    )

    pdf.showPage()

    pdf.save()

    return response

def view_sale(request, pk):

    sale = get_object_or_404(
        Sale,
        pk=pk
    )

    items = SaleItem.objects.filter(
        sale=sale
    )

    return render(
        request,
        "sales/view_sale.html",
        {
            "sale": sale,
            "items": items,
        }
    )

def delete_sale(request, pk):

    sale = get_object_or_404(
        Sale,
        pk=pk
    )

    items = SaleItem.objects.filter(
        sale=sale
    )

    # Restore Stock
    for item in items:

        product = item.product

        product.stock_quantity += item.quantity

        product.save()

    # Delete Accounting Entries

    Ledger.objects.filter(
        particulars=f"Sale Invoice {sale.invoice_number}"
    ).delete()

    Journal.objects.filter(
        description=f"Sale Invoice {sale.invoice_number}"
    ).delete()

    CashBook.objects.filter(
        remarks=f"Sale Invoice {sale.invoice_number}"
    ).delete()

    # Delete Sale

    sale.delete()

    return redirect("sale_list")

def edit_sale(request, pk):

    print("Method:", request.method)

    sale = get_object_or_404(Sale, pk=pk)

    if request.method == "POST":

        form = SaleForm(request.POST, instance=sale)

        formset = SaleItemFormSet(
            request.POST,
            instance=sale
        )

        if form.is_valid() and formset.is_valid():

            print("SUCCESS")


            # Restore old stock
            old_items = SaleItem.objects.filter(sale=sale)

            for item in old_items:

                product = item.product
                product.stock_quantity += item.quantity
                product.save()

            total = Decimal("0.00")

            sale = form.save(commit=False)
            sale.total_amount = 0
            sale.save()

            items = formset.save(commit=False)

            # Delete removed items
            for obj in formset.deleted_objects:
                obj.delete()

            # Remove old SaleItems
            SaleItem.objects.filter(sale=sale).delete()

            for item in items:

                item.sale = sale

                item.subtotal = (
                    item.quantity *
                    item.selling_price
                )

                total += item.subtotal

                product = item.product

                if product.stock_quantity < item.quantity:

                    form.add_error(
                        None,
                        f"Not enough stock for {product.name}"
                    )

                    return render(
                        request,
                        "sales/edit_sale.html",
                        {
                            "form": form,
                            "formset": formset,
                        }
                    )

                product.stock_quantity -= item.quantity
                product.save()

                item.save()

            sale.total_amount = total
            sale.save()

            # Update Accounting

            Ledger.objects.filter(
                particulars=f"Sale Invoice {sale.invoice_number}"
            ).update(
                debit=total,
                balance=total
            )

            Journal.objects.filter(
                description=f"Sale Invoice {sale.invoice_number}"
            ).update(
                amount=total
            )

            CashBook.objects.filter(
                remarks=f"Sale Invoice {sale.invoice_number}"
            ).update(
                receipt=total,
                balance=total
            )

            return redirect("sale_list")
        else:

            print("FORM ERRORS:", form.errors)
            print("FORMSET ERRORS:", formset.errors)
            print("NON FORM ERRORS:", formset.non_form_errors())
    
    else:

        form = SaleForm(instance=sale)

        formset = SaleItemFormSet(instance=sale)

    return render(
        request,
        "sales/edit_sale.html",
        {
            "form": form,
            "formset": formset,
        }
    )
from decimal import Decimal

def add_sale(request):

    if request.method == "POST":

        form = SaleForm(request.POST)

        formset = SaleItemFormSet(request.POST)

        if form.is_valid() and formset.is_valid():

            sale = form.save(commit=False)
            sale.total_amount = Decimal("0.00")
            sale.save()

            formset.instance = sale

            total = Decimal("0.00")

            items = formset.save(commit=False)

            for item in items:

                item.sale = sale

                item.subtotal = (
                    item.quantity *
                    item.selling_price
                )

                total += item.subtotal

                # Reduce Stock
                product = item.product

                if product.stock_quantity < item.quantity:

                    form.add_error(
                        None,
                        f"Not enough stock for {product.name}"
                    )

                    sale.delete()

                    return render(
                        request,
                        "sales/sale_form.html",
                        {
                            "form": form,
                            "formset": formset,
                        }
                    )

                product.stock_quantity -= item.quantity
                product.save()

                item.save()

            sale.total_amount = total
            sale.save()

            # Ledger Entry
            Ledger.objects.create(
                date=sale.sale_date,
                particulars=f"Sale Invoice {sale.invoice_number}",
                debit=total,
                credit=0,
                balance=total,
                reference=sale.invoice_number
            )

            # Journal Entry
            Journal.objects.create(
                date=sale.sale_date,
                description=f"Sale Invoice {sale.invoice_number}",
                debit_account="Cash",
                credit_account="Sales",
                amount=total,
                reference=sale.invoice_number
            )

            # Cash Book Entry
            CashBook.objects.create(
                date=sale.sale_date,
                receipt=total,
                payment=0,
                balance=total,
                remarks=f"Sale Invoice {sale.invoice_number}",
                reference=sale.invoice_number
            )

            return redirect("sale_list")

    else:

        form = SaleForm()
        formset = SaleItemFormSet()

    return render(
        request,
        "sales/sale_form.html",
        {
            "form": form,
            "formset": formset,
        }
    )