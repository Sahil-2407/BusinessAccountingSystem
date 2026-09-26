from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from accounts.views import MeAPIView, RegisterAPIView


urlpatterns = [
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    path(
        "me/",
        MeAPIView.as_view(),
        name="me",
    ),

    path(
        "register/",
        RegisterAPIView.as_view(),
        name="register",
    ),
]