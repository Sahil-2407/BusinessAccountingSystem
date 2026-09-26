from django.shortcuts import render, redirect, get_object_or_404

from .models import Product, Category
from .forms import ProductForm, CategoryForm
from django.contrib.auth.decorators import login_required

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .serializers import CategorySerializer, ProductSerializer


# ===========================
# Inventory Dashboard
# ===========================
@login_required
def inventory_dashboard(request):

    total_products = Product.objects.filter(
        owner=request.user
    ).count()

    total_categories = Category.objects.filter(
        owner=request.user
    ).count()

    products = Product.objects.filter(
        owner=request.user
    )

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
        "inventory/inventory_dashboard.html",
        context,
    )

# ===========================
# Category Management
# ===========================
@login_required
def category_list(request):

    categories = Category.objects.filter(
        owner=request.user
    ).order_by("name")

    query = request.GET.get("q")

    if query:
        categories = categories.filter(name__icontains=query)

    return render(
        request,
        "inventory/category_list.html",
        {
            "categories": categories
        }
    )

@login_required
def add_category(request):

    if request.method == "POST":

        form = CategoryForm(request.POST)

        if form.is_valid():

            category = form.save(commit=False)

            category.owner = request.user

            category.save()

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

@login_required
def edit_category(request, pk):

    get_object_or_404(
        Category,
        pk=pk,
        owner=request.user
    )

    if request.method == "POST":

        form = CategoryForm(
            request.POST,
            instance=category
        )

        if form.is_valid():

            category = form.save(commit=False)

            category.owner = request.user

            category.save()

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

@login_required
def delete_category(request, pk):

    get_object_or_404(
        Category,
        pk=pk,
        owner=request.user
    )
    category.delete()

    return redirect("category_list")


# ===========================
# Product Management
# ===========================
@login_required
def product_list(request):

    query = request.GET.get("q")

    products = Product.objects.filter(owner=request.user)

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

@login_required
def add_product(request):

    if request.method == "POST":

        form = ProductForm(
            request.POST,
            request.FILES
        )

        if form.is_valid():

            product = form.save(commit=False)

            product.owner = request.user

            product.save()

            return redirect("product_list")

    else:

        form = ProductForm()

        form.fields["category"].queryset = Category.objects.filter(
            owner=request.user
        )

    return render(
        request,
        "add_product.html",
        {
            "form": form
        }
    )


@login_required
def edit_product(request, pk):

    product = get_object_or_404(
        Product,
        pk=pk,
        owner=request.user
    )

    if request.method == "POST":

        form = ProductForm(
            request.POST,
            request.FILES,
            instance=product
        )

        form.fields["category"].queryset = Category.objects.filter(
            owner=request.user
        )

        if form.is_valid():

            product = form.save(commit=False)
            product.owner = request.user
            product.save()

            return redirect("product_list")

    else:

        form = ProductForm(instance=product)

        form.fields["category"].queryset = Category.objects.filter(
            owner=request.user
        )

    return render(
        request,
        "edit_product.html",
        {
            "form": form
        }
    )

@login_required
def delete_product(request, pk):

    product = get_object_or_404(
        Product,
        pk=pk,
        owner=request.user
    )

    product.delete()

    return redirect("product_list")

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(
            owner=self.request.user
        ).select_related("category")

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)