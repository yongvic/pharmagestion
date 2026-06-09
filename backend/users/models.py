from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrateur')
        PHARMACIST = 'PHARMACIST', _('Pharmacien')
        CASHIER = 'CASHIER', _('Caissier')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CASHIER,
        verbose_name=_("Rôle")
    )
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name=_("Téléphone"))
    is_active = models.BooleanField(default=True, verbose_name=_("Actif"))

    class Meta:
        verbose_name = _("Utilisateur")
        verbose_name_plural = _("Utilisateurs")

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
