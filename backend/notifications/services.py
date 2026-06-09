from users.models import User
from .models import Notification


def create_notification(recipient, title, message, notification_type=Notification.Type.INFO, link='', related_sale=None):
    """Crée une notification pour un utilisateur précis."""
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
        related_sale=related_sale,
    )


def notify_users(users, title, message, notification_type=Notification.Type.INFO, link='', related_sale=None):
    """Crée une notification individuelle pour chaque utilisateur de la liste."""
    notifications = []
    for user in users:
        if user and user.is_active:
            notifications.append(
                create_notification(
                    recipient=user,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    link=link,
                    related_sale=related_sale,
                )
            )
    return notifications


def notify_by_roles(roles, title, message, notification_type=Notification.Type.INFO, link='', related_sale=None, exclude_user=None):
    """Notifie tous les utilisateurs actifs ayant l'un des rôles donnés."""
    qs = User.objects.filter(role__in=roles, is_active=True)
    if exclude_user:
        qs = qs.exclude(pk=exclude_user.pk)
    return notify_users(qs, title, message, notification_type, link, related_sale)


def notify_sale_pending(sale):
    """Pharmacien a envoyé une commande → notifier caissiers et admins."""
    pharmacist_name = sale.pharmacist.get_full_name() or sale.pharmacist.username
    return notify_by_roles(
        roles=[User.Role.CASHIER, User.Role.ADMIN],
        title="Nouvelle commande en attente",
        message=f"Commande {sale.invoice_number} préparée par {pharmacist_name} — {sale.client_amount} FCFA à encaisser.",
        notification_type=Notification.Type.SALE_PENDING,
        link="/cashier",
        related_sale=sale,
        exclude_user=sale.pharmacist,
    )


def notify_sale_completed(sale, cashier):
    """Caisse a validé la vente → notifier le pharmacien qui a préparé."""
    if not sale.pharmacist:
        return None
    cashier_name = cashier.get_full_name() or cashier.username
    return create_notification(
        recipient=sale.pharmacist,
        title="Vente encaissée",
        message=f"La commande {sale.invoice_number} a été encaissée par {cashier_name} ({sale.client_amount} FCFA).",
        notification_type=Notification.Type.SALE_COMPLETED,
        link="/pos",
        related_sale=sale,
    )


def notify_low_stock(medication):
    """Stock sous le seuil → notifier admins et pharmaciens."""
    return notify_by_roles(
        roles=[User.Role.ADMIN, User.Role.PHARMACIST],
        title="Alerte stock faible",
        message=f"{medication.name} : il reste {medication.stock_quantity} unité(s) (seuil : {medication.min_stock}).",
        notification_type=Notification.Type.LOW_STOCK,
        link="/inventory",
    )
