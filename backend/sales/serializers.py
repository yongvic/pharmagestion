import uuid
from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Sale, SaleItem
from .services import deduct_stock_for_sale, restore_stock_for_sale, validate_stock_available
from notifications.services import notify_sale_pending, notify_sale_completed


class SaleItemSerializer(serializers.ModelSerializer):
    medication_name = serializers.ReadOnlyField(source='medication.name')

    class Meta:
        model = SaleItem
        fields = ('id', 'medication', 'medication_name', 'quantity', 'unit_price', 'total_price')
        read_only_fields = ('unit_price', 'total_price')


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    pharmacist_name = serializers.ReadOnlyField(source='pharmacist.username')
    cashier_name = serializers.ReadOnlyField(source='cashier.username')
    insurance_name = serializers.ReadOnlyField(source='insurance.name')

    class Meta:
        model = Sale
        fields = (
            'id', 'invoice_number', 'pharmacist', 'pharmacist_name',
            'cashier', 'cashier_name', 'insurance', 'insurance_name',
            'insurance_coverage_amount', 'client_amount', 'total_amount',
            'status', 'payment_method', 'items', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'invoice_number', 'pharmacist', 'cashier',
            'total_amount', 'insurance_coverage_amount', 'client_amount',
        )

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('Au moins un article est requis.')
        for item in items:
            med = item['medication']
            qty = item['quantity']
            if qty <= 0:
                raise serializers.ValidationError(f'Quantité invalide pour {med.name}.')
        return items

    def _compute_totals(self, sale, items_data):
        total = Decimal('0')
        for item_data in items_data:
            medication = item_data['medication']
            quantity = item_data['quantity']
            unit_price = medication.selling_price
            total += unit_price * quantity
        sale.total_amount = total
        if sale.insurance:
            sale.insurance_coverage_amount = (total * sale.insurance.coverage_rate) / 100
            sale.client_amount = total - sale.insurance_coverage_amount
        else:
            sale.insurance_coverage_amount = Decimal('0')
            sale.client_amount = total

    def _create_items(self, sale, items_data):
        for item_data in items_data:
            medication = item_data['medication']
            quantity = item_data['quantity']
            unit_price = medication.selling_price
            SaleItem.objects.create(
                sale=sale,
                medication=medication,
                quantity=quantity,
                unit_price=unit_price,
                total_price=unit_price * quantity,
            )

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context['request']
        status = validated_data.get('status', Sale.Status.PENDING)

        if status == Sale.Status.COMPLETED:
            for item_data in items_data:
                validate_stock_available(item_data['medication'], item_data['quantity'])

        validated_data['invoice_number'] = uuid.uuid4().hex[:10].upper()
        validated_data['pharmacist'] = request.user

        if status == Sale.Status.COMPLETED:
            validated_data['cashier'] = request.user

        sale = Sale.objects.create(**validated_data)
        self._create_items(sale, items_data)
        self._compute_totals(sale, items_data)
        sale.save()

        if status == Sale.Status.COMPLETED:
            deduct_stock_for_sale(sale, request.user)
            notify_sale_completed(sale, request.user)
        elif status == Sale.Status.PENDING:
            notify_sale_pending(sale)

        return sale

    @transaction.atomic
    def update(self, instance, validated_data):
        new_status = validated_data.get('status', instance.status)
        request = self.context['request']
        old_status = instance.status

        if new_status == Sale.Status.COMPLETED and old_status != Sale.Status.COMPLETED:
            for item in instance.items.select_related('medication').all():
                validate_stock_available(item.medication, item.quantity)
            validated_data['cashier'] = request.user
            instance = super().update(instance, validated_data)
            deduct_stock_for_sale(instance, request.user)
            notify_sale_completed(instance, request.user)
            return instance

        if new_status == Sale.Status.CANCELLED and old_status == Sale.Status.COMPLETED:
            restore_stock_for_sale(instance, request.user)

        return super().update(instance, validated_data)
