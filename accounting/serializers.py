from rest_framework import serializers

from .models import Ledger, Journal, CashBook


class LedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ledger
        fields = "__all__"
        read_only_fields = [
            "id",
            "owner",
        ]


class JournalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Journal
        fields = "__all__"
        read_only_fields = [
            "id",
            "owner",
        ]


class CashBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashBook
        fields = "__all__"
        read_only_fields = [
            "id",
            "owner",
        ]