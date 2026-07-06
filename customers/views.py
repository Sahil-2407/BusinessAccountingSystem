from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator

from .models import Customer
from .forms import CustomerForm


@login_required
@login_required
def customer_list(request):

    query = request.GET.get("q", "")

    customers = Customer.objects.all().order_by("id")

    if query:
        customers = customers.filter(name__icontains=query)

    paginator = Paginator(customers, 10)   # 10 customers per page

    page_number = request.GET.get("page")

    page_obj = paginator.get_page(page_number)

    return render(
        request,
        "customer_list.html",
        {
            "customers": page_obj,
            "query": query,
            "page_obj": page_obj,
        }
    )

@login_required
def view_customer(request, pk):

    customer = get_object_or_404(Customer, pk=pk)

    return render(
        request,
        "view_customer.html",
        {
            "customer": customer
        }
    )
@login_required
def add_customer(request):

    if request.method == "POST":

        form = CustomerForm(request.POST)

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Customer added successfully."
            )

            return redirect("customer_list")

    else:

        form = CustomerForm()

    return render(
        request,
        "add_customer.html",
        {
            "form": form
        }
    )


@login_required
def edit_customer(request, pk):

    customer = get_object_or_404(
        Customer,
        pk=pk
    )

    if request.method == "POST":

        form = CustomerForm(
            request.POST,
            instance=customer
        )

        if form.is_valid():

            form.save()

            messages.success(
                request,
                "Customer updated successfully."
            )

            return redirect("customer_list")

    else:

        form = CustomerForm(
            instance=customer
        )

    return render(
        request,
        "edit_customer.html",
        {
            "form": form,
            "customer": customer,
        }
    )


@login_required
def delete_customer(request, pk):

    customer = get_object_or_404(
        Customer,
        pk=pk
    )

    customer.delete()

    messages.success(
        request,
        "Customer deleted successfully."
    )

    return redirect("customer_list")