from django.shortcuts import (
    render,
    redirect,
    get_object_or_404
)

from .models import Supplier
from .forms import SupplierForm
from django.contrib.auth.decorators import login_required

@login_required
def supplier_list(request):

    query = request.GET.get("q")

    suppliers = Supplier.objects.filter(
        owner=request.user
    )

    if query:
        suppliers = suppliers.filter(
            company_name__icontains=query
        )

    return render(
        request,
        "supplier_list.html",
        {
            "suppliers": suppliers
        }
    )

@login_required
def add_supplier(request):

    if request.method == "POST":

        form = SupplierForm(request.POST)

        if form.is_valid():
            supplier = form.save(commit=False)

            supplier.owner = request.user

            supplier.save()
            return redirect("supplier_list")

    else:

        form = SupplierForm()

    return render(
        request,
        "add_supplier.html",
        {
            "form": form
        }
    )

@login_required
def edit_supplier(request, pk):

    supplier = get_object_or_404(
        Supplier,
        pk=pk,
        owner=request.user
    )

    if request.method == "POST":

        form = SupplierForm(
            request.POST,
            instance=supplier
        )

        if form.is_valid():
            form.save()
            return redirect("supplier_list")

    else:

        form = SupplierForm(
            instance=supplier
        )

    return render(
        request,
        "edit_supplier.html",
        {
            "form": form
        }
    )

@login_required
def delete_supplier(request, pk):

    supplier = get_object_or_404(
        Supplier,
        pk=pk,
        owner=request.user
    )

    supplier.delete()

    return redirect("supplier_list")