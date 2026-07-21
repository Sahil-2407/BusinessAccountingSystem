from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import UserUpdateForm, ProfileUpdateForm
from customers.models import Customer
from suppliers.models import Supplier
from inventory.models import Product
from purchases.models import Purchase
from sales.models import Sale
from expenses.models import Expense
from .models import Profile


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]
        password = request.POST["password"]

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect("register")

        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        messages.success(request, "Registration successful. Please login.")
        return redirect("login")

    return render(request, "register.html")


def user_login(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user:
            login(request, user)
            return redirect("dashboard")

        messages.error(request, "Invalid username or password")

    return render(request, "login.html")


@login_required
def profile(request):
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == "POST":

        user_form = UserUpdateForm(
            request.POST,
            instance=request.user
        )

        profile_form = ProfileUpdateForm(
            request.POST,
            request.FILES,
            instance=profile
        )

        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()

            messages.success(request, "Profile updated successfully.")
            return redirect("profile")

    else:

        user_form = UserUpdateForm(instance=request.user)
        profile_form = ProfileUpdateForm(instance=profile)

    context = {
        "user_form": user_form,
        "profile_form": profile_form,
        "profile": profile,

        "customers": Customer.objects.filter(owner=request.user).count(),
        "suppliers": Supplier.objects.filter(owner=request.user).count(),
        "products": Product.objects.filter(owner=request.user).count(),
        "purchases": Purchase.objects.filter(owner=request.user).count(),
        "sales": Sale.objects.filter(owner=request.user).count(),
        "expenses": Expense.objects.filter(owner=request.user).count(),
    }

    return render(request, "accounts/profile.html", context)


def user_logout(request):
    logout(request)
    return redirect("login")