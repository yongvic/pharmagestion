from django.db.models import Count
from rest_framework import viewsets, filters
from rest_framework.exceptions import ValidationError
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsAdminOrReadOnly, IsStaffRole
from .models import Category, Medication
from .serializers import CategorySerializer, MedicationSerializer


class MedicationFilter(django_filters.FilterSet):
    stock_quantity__lte = django_filters.NumberFilter(field_name='stock_quantity', lookup_expr='lte')
    stock_quantity__gte = django_filters.NumberFilter(field_name='stock_quantity', lookup_expr='gte')
    low_stock = django_filters.BooleanFilter(method='filter_low_stock')

    class Meta:
        model = Medication
        fields = ['category', 'expiry_date', 'stock_quantity']

    def filter_low_stock(self, queryset, name, value):
        if value:
            from django.db.models import F
            return queryset.filter(stock_quantity__lte=F('min_stock'))
        return queryset


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(medication_count=Count('medications')).order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.medications.exists():
            count = instance.medications.count()
            raise ValidationError({
                'detail': (
                    f'Cette catégorie contient {count} médicament(s). '
                    'Réassignez-les avant suppression.'
                ),
            })
        return super().destroy(request, *args, **kwargs)


class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.select_related('category').all()
    serializer_class = MedicationSerializer
    permission_classes = [IsStaffRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MedicationFilter
    search_fields = ['name', 'generic_name', 'barcode']
    ordering_fields = ['name', 'selling_price', 'stock_quantity', 'expiry_date']

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAdminOrReadOnly()]
        return [IsStaffRole()]
