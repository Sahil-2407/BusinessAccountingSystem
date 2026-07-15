from django.urls import path
from . import views

urlpatterns = [

    path(
        "",
        views.purchase_list,
        name="purchase_list"
    ),

    path(
        "add/",
        views.add_purchase,
        name="add_purchase"
    ),

    path(
        "edit/<int:pk>/",
        views.edit_purchase,
        name="edit_purchase"
    ),

    # We'll add these later

    path(
        "delete/<int:pk>/",
        views.delete_purchase,
        name="delete_purchase"
    ),

    path(
        "invoice/<int:pk>/",
        views.purchase_invoice,
        name="purchase_invoice"
    ),

    path(
        "invoice/<int:pk>/pdf/",
        views.purchase_invoice_pdf,
        name="purchase_invoice_pdf"
    ),

]