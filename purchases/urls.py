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

]