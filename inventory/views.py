from django.shortcuts import render, redirect, get_object_or_404

from .models import Product, Category
from .forms import ProductForm, CategoryForm


# ===========================
# Inventory Dashboard
# ===========================

def inventory_dashboard(request):

    total_products = Product.objects.count()

    total_categories = Category.objects.count()

    products = Product.objects.all()

    inventory_value = 0

    for product in products:
        inventory_value += (
            product.purchase_price * product.stock_quantity
        )

    low_stock = products.filter(
        stock_quantity__lte=10
    ).count()

    context = {
        "total_products": total_products,
        "total_categories": total_categories,
        "inventory_value": inventory_value,
        "low_stock": low_stock,
        "products": products,
    }

    return render(
        request,
        "inventory_dashboard.html",
        context,
    )


# ===========================
# Category Management
# ===========================

def category_list(request):

    categories = Category.objects.all().order_by("name")

    return render(
    request,
    "inventory/category_list.html",
    {
        "categories": categories
    }
)

def add_category(request):

    if request.method == "POST":

        form = CategoryForm(request.POST)

        if form.is_valid():

            form.save()

            return redirect("category_list")

    else:

        form = CategoryForm()

    return render(
        request,
        "inventory/category_form.html",
        {
            "form": form,
            "title": "Add Category"
        }
    )


def edit_category(request, pk):

    category = get_object_or_404(
        Category,
        pk=pk
    )

    if request.method == "POST":

        form = CategoryForm(
            request.POST,
            instance=category
        )

        if form.is_valid():

            form.save()

            return redirect("category_list")

    else:

        form = CategoryForm(instance=category)

    return render(
        request,
        "inventory/category_form.html",
        {
            "form": form,
            "title": "Edit Category"
        }
    )


def delete_category(request, pk):

    category = get_object_or_404(
        Category,
        pk=pk
    )

    category.delete()

    return redirect("category_list")


# ===========================
# Product Management
# ===========================

def product_list(request):

    query = request.GET.get("q")

    products = Product.objects.all()

    if query:

        products = products.filter(
            name__icontains=query
        )

    return render(
        request,
        "product_list.html",
        {
            "products": products
        }
    )


def add_product(request):

    if request.method == "POST":

        form = ProductForm(
            request.POST,
            request.FILES
        )

        if form.is_valid():

            form.save()

            return redirect("product_list")

    else:

        form = ProductForm()

    return render(
        request,
        "add_product.html",
        {
            "form": form
        }
    )


def edit_product(request, pk):

    product = get_object_or_404(Product, pk=pk)

    if request.method == "POST":

        form = ProductForm(
            request.POST,
            request.FILES,
            instance=product
        )

        if form.is_valid():

            form.save()

            return redirect("product_list")

    else:

        form = ProductForm(instance=product)

    return render(
        request,
        "edit_product.html",
        {
            "form": form
        }
    )


def delete_product(request, pk):

    product = get_object_or_404(Product, pk=pk)

    product.delete()

    return redirect("product_list")