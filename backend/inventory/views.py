from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsStaffRole, IsAdmin
from .models import StockMovement
from .serializers import StockMovementSerializer


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('medication', 'user').all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaffRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['medication', 'type']
    search_fields = ['medication__name', 'reason']
    ordering_fields = ['created_at']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdmin()]
        return [IsStaffRole()]
