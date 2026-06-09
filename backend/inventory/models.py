from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from medications.models import Medication
from django.conf import settings


class StockMovement(models.Model):
    class Type(models.TextChoices):
        ENTRY = 'ENTRY', _('Entrée')
        EXIT = 'EXIT', _('Sortie')
        ADJUSTMENT = 'ADJUSTMENT', _('Ajustement')
        RETURN = 'RETURN', _('Retour')

    medication = models.ForeignKey(
        Medication, on_delete=models.CASCADE,
        related_name='movements', verbose_name=_("Médicament")
    )
    type = models.CharField(max_length=20, choices=Type.choices, verbose_name=_("Type de mouvement"))
    quantity = models.PositiveIntegerField(verbose_name=_("Quantité"))
    reason = models.TextField(blank=True, null=True, verbose_name=_("Raison/Note"))
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, verbose_name=_("Utilisateur")
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Mouvement de stock")
        verbose_name_plural = _("Mouvements de stock")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()} - {self.medication.name} ({self.quantity})"

    def clean(self):
        if self.quantity <= 0:
            raise ValidationError({'quantity': 'La quantité doit être positive.'})

    def save(self, *args, **kwargs):
        if not self.pk:
            medication = Medication.objects.select_for_update().get(pk=self.medication_id)
            if self.type in (self.Type.EXIT,):
                if medication.stock_quantity < self.quantity:
                    raise ValidationError(
                        f"Stock insuffisant ({medication.stock_quantity} disponible)."
                    )
                medication.stock_quantity -= self.quantity
            elif self.type in (self.Type.ENTRY, self.Type.RETURN):
                medication.stock_quantity += self.quantity
            elif self.type == self.Type.ADJUSTMENT:
                # Ajustement = définir le stock cible via quantity comme delta signé via reason prefix
                # Convention: quantity = valeur absolue, reason commence par + ou -
                delta = self.quantity
                if self.reason and self.reason.strip().startswith('-'):
                    delta = -self.quantity
                new_qty = medication.stock_quantity + delta
                if new_qty < 0:
                    raise ValidationError("L'ajustement rendrait le stock négatif.")
                medication.stock_quantity = new_qty
            medication.save()
            self.medication = medication

            from notifications.services import notify_low_stock
            if medication.is_low_stock:
                notify_low_stock(medication)

        super().save(*args, **kwargs)
