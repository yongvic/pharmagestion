from django.db import models
from django.utils.translation import gettext_lazy as _


class PharmacySettings(models.Model):
    name = models.CharField(max_length=200, default="Ma Pharmacie", verbose_name=_("Nom de la pharmacie"))
    logo = models.ImageField(upload_to='settings/', blank=True, null=True, verbose_name=_("Logo"))
    address = models.TextField(blank=True, null=True, verbose_name=_("Adresse"))
    phone = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Téléphone"))
    email = models.EmailField(blank=True, null=True, verbose_name=_("Email"))
    currency = models.CharField(max_length=10, default="FCFA", verbose_name=_("Devise"))
    tva_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name=_("Taux TVA (%)"))
    receipt_header = models.TextField(blank=True, null=True, verbose_name=_("En-tête des tickets"))
    receipt_footer = models.TextField(blank=True, null=True, verbose_name=_("Pied de page des tickets"))

    class Meta:
        verbose_name = _("Paramètres de la pharmacie")
        verbose_name_plural = _("Paramètres de la pharmacie")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.pk = self.pk or PharmacySettings.objects.first().pk if PharmacySettings.objects.exists() else self.pk
        super().save(*args, **kwargs)
