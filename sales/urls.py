from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.sale_list,
        name="sale_list"
    ),

    path(
        "add/",
        views.add_sale,
        name="add_sale"
    ),

    path(
        "view/<int:pk>/",
        views.view_sale,
        name="view_sale"
    ),

    path(
        "invoice/<int:pk>/",
        views.sale_invoice,
        name="sale_invoice"
    ),

    path(
        "delete/<int:pk>/",
        views.delete_sale,
        name="delete_sale"
    ),

    path(
        "edit/<int:pk>/",
        views.edit_sale,
        name="edit_sale"
    ),

    path(
        "invoice/<int:pk>/pdf/",
        views.sale_invoice_pdf,
        name="sale_invoice_pdf"
    ),

]