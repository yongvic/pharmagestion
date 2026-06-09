from django.db import models
from django.utils.translation import gettext_lazy as _

class Insurance(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Nom de l'assurance"))
    coverage_rate = models.DecimalField(max_digits=5, decimal_places=2, help_text=_("Taux de couverture en % (ex: 80.00)"), verbose_name=_("Taux de couverture"))
    description = models.TextField(blank=True, null=True, verbose_name=_("Description"))
    is_active = models.BooleanField(default=True, verbose_name=_("Active"))

    class Meta:
        verbose_name = _("Assurance")
        verbose_name_plural = _("Assurances")

    def __str__(self):
        return f"{self.name} ({self.coverage_rate}%)"
