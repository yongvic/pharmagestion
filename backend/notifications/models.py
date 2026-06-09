from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):
    class Type(models.TextChoices):
        SALE_PENDING = 'SALE_PENDING', _('Commande en attente')
        SALE_COMPLETED = 'SALE_COMPLETED', _('Vente terminée')
        LOW_STOCK = 'LOW_STOCK', _('Stock faible')
        INFO = 'INFO', _('Information')

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_("Destinataire"),
    )
    title = models.CharField(max_length=200, verbose_name=_("Titre"))
    message = models.TextField(verbose_name=_("Message"))
    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
        default=Type.INFO,
        verbose_name=_("Type"),
    )
    is_read = models.BooleanField(default=False, verbose_name=_("Lu"))
    link = models.CharField(max_length=200, blank=True, default='', verbose_name=_("Lien"))
    related_sale = models.ForeignKey(
        'sales.Sale',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name=_("Vente liée"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Notification")
        verbose_name_plural = _("Notifications")
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.recipient.username}"
