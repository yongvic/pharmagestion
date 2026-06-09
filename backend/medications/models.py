from django.db import models
from django.utils.translation import gettext_lazy as _

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Nom"))
    description = models.TextField(blank=True, null=True, verbose_name=_("Description"))

    class Meta:
        verbose_name = _("Catégorie")
        verbose_name_plural = _("Catégories")

    def __str__(self):
        return self.name

class Medication(models.Model):
    name = models.CharField(max_length=200, verbose_name=_("Nom commercial"))
    generic_name = models.CharField(max_length=200, blank=True, null=True, verbose_name=_("Nom générique"))
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='medications', verbose_name=_("Catégorie"))
    dosage = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Dosage"))
    form = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Forme pharmaceutique"))
    manufacturer = models.CharField(max_length=200, blank=True, null=True, verbose_name=_("Fabricant"))
    
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Prix d'achat"))
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_("Prix de vente"))
    
    stock_quantity = models.IntegerField(default=0, verbose_name=_("Quantité en stock"))
    min_stock = models.IntegerField(default=5, verbose_name=_("Stock minimum"))
    
    lot_number = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Numéro de lot"))
    expiry_date = models.DateField(verbose_name=_("Date d'expiration"))
    
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True, verbose_name=_("Code-barres"))
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Emplacement"))
    
    description = models.TextField(blank=True, null=True, verbose_name=_("Description"))
    image = models.ImageField(upload_to='medications/', blank=True, null=True, verbose_name=_("Image produit"))
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Médicament")
        verbose_name_plural = _("Médicaments")
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.dosage})"

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.min_stock
