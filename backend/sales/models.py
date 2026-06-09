from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from medications.models import Medication
from insurance.models import Insurance

class Sale(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('En attente (Pharmacie)')
        COMPLETED = 'COMPLETED', _('Terminée (Caisse)')
        CANCELLED = 'CANCELLED', _('Annulée')

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', _('Espèces')
        MOBILE_MONEY = 'MOBILE_MONEY', _('Mobile Money')
        CARD = 'CARD', _('Carte')

    invoice_number = models.CharField(max_length=50, unique=True, verbose_name=_("Numéro de facture"))
    pharmacist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='prepared_sales', verbose_name=_("Pharmacien"))
    cashier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='processed_sales', verbose_name=_("Caissier"))
    
    insurance = models.ForeignKey(Insurance, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("Assurance"))
    insurance_coverage_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_("Part assurance"))
    client_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_("Part client"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name=_("Montant total"))
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name=_("Statut"))
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH, verbose_name=_("Mode de paiement"))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Vente")
        verbose_name_plural = _("Ventes")
        ordering = ['-created_at']

    def __str__(self):
        return f"Facture {self.invoice_number} - {self.get_status_display()}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items', verbose_name=_("Vente"))
    medication = models.ForeignKey(Medication, on_delete=models.PROTECT, verbose_name=_("Médicament"))
    quantity = models.IntegerField(default=1, verbose_name=_("Quantité"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Prix unitaire"))
    total_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Prix total"))

    class Meta:
        verbose_name = _("Article de vente")
        verbose_name_plural = _("Articles de vente")

    def __str__(self):
        return f"{self.medication.name} x {self.quantity}"
