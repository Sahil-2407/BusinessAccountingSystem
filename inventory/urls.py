from django.urls import path
from . import views

urlpatterns = [

    # ===========================
    # Inventory Dashboard
    # ===========================

    path(
        "",
        views.inventory_dashboard,
        name="inventory_dashboard"
    ),

    # ===========================
    # Category Management
    # ===========================

    path(
        "categories/",
        views.category_list,
        name="category_list"
    ),

    path(
        "categories/add/",
        views.add_category,
        name="add_category"
    ),

    path(
        "categories/edit/<int:pk>/",
        views.edit_category,
        name="edit_category"
    ),

    path(
        "categories/delete/<int:pk>/",
        views.delete_category,
        name="delete_category"
    ),

    # ===========================
    # Product Management
    # ===========================

    path(
        "products/",
        views.product_list,
        name="product_list"
    ),

    path(
        "products/add/",
        views.add_product,
        name="add_product"
    ),

    path(
        "products/edit/<int:pk>/",
        views.edit_product,
        name="edit_product"
    ),

    path(
        "products/delete/<int:pk>/",
        views.delete_product,
        name="delete_product"
    ),

]