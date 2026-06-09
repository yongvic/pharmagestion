from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'ADMIN'


class IsStaffRole(BasePermission):
    """Admin, pharmacien ou caissier."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('ADMIN', 'PHARMACIST', 'CASHIER')
        )


class IsPharmacistOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('ADMIN', 'PHARMACIST')
        )


class IsCashierOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('ADMIN', 'CASHIER')
        )


class CanManageSales(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('ADMIN', 'PHARMACIST', 'CASHIER')
        )
