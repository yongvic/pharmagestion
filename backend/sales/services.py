from django.db import transaction
from rest_framework.exceptions import ValidationError
from medications.models import Medication
from inventory.models import StockMovement
from notifications.services import notify_low_stock


def validate_stock_available(medication, quantity):
    if quantity <= 0:
        raise ValidationError({'quantity': 'La quantité doit être supérieure à 0.'})
    if medication.stock_quantity < quantity:
        raise ValidationError({
            'stock': (
                f"Stock insuffisant pour {medication.name} "
                f"(disponible: {medication.stock_quantity}, demandé: {quantity})."
            )
        })


@transaction.atomic
def deduct_stock_for_sale(sale, user):
    """Déduit le stock pour chaque article d'une vente terminée."""
    for item in sale.items.select_related('medication').all():
        medication = Medication.objects.select_for_update().get(pk=item.medication_id)
        validate_stock_available(medication, item.quantity)
        StockMovement.objects.create(
            medication=medication,
            type=StockMovement.Type.EXIT,
            quantity=item.quantity,
            reason=f"Vente {sale.invoice_number}",
            user=user,
        )
        medication.refresh_from_db()
        if medication.is_low_stock:
            notify_low_stock(medication)


@transaction.atomic
def restore_stock_for_sale(sale, user):
    """Restitue le stock lors de l'annulation d'une vente déjà encaissée."""
    for item in sale.items.select_related('medication').all():
        StockMovement.objects.create(
            medication=item.medication,
            type=StockMovement.Type.RETURN,
            quantity=item.quantity,
            reason=f"Annulation vente {sale.invoice_number}",
            user=user,
        )
