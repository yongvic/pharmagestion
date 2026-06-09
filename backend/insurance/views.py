from rest_framework import viewsets
from users.permissions import IsAdminOrReadOnly, IsStaffRole
from .models import Insurance
from .serializers import InsuranceSerializer


class InsuranceViewSet(viewsets.ModelViewSet):
    queryset = Insurance.objects.all()
    serializer_class = InsuranceSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrReadOnly()]
        return [IsStaffRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('active_only') == 'true':
            qs = qs.filter(is_active=True)
        return qs
