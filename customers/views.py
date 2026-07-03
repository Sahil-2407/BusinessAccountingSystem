from django.shortcuts import render, redirect
from .models import Customer
from .forms import CustomerForm
from django.shortcuts import get_object_or_404


def customer_list(request):

    query = request.GET.get("q")

    customers = Customer.objects.all()

    if query:
        customers = customers.filter(name__icontains=query)

    return render(request,
                  "customer_list.html",
                  {"customers": customers})


def add_customer(request):

    if request.method == 'POST':

        form = CustomerForm(request.POST)

        if form.is_valid():
            form.save()
            return redirect('customer_list')

    else:

        form = CustomerForm()

    return render(
        request,
        'add_customer.html',
        {'form': form}
    )

def edit_customer(request, pk):

    customer = get_object_or_404(Customer, pk=pk)

    if request.method == "POST":
        form = CustomerForm(request.POST, instance=customer)

        if form.is_valid():
            form.save()
            return redirect("customer_list")

    else:
        form = CustomerForm(instance=customer)

    return render(request, "edit_customer.html", {
        "form": form
    })


def delete_customer(request, pk):

    customer = get_object_or_404(Customer, pk=pk)

    customer.delete()

    return redirect("customer_list")