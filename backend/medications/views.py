from django.db.models import Count
from django.http import HttpResponse
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import IsAdminOrReadOnly, IsStaffRole
from .models import Category, Medication
from .serializers import CategorySerializer, MedicationSerializer
from .import_service import (
    import_medications_from_file,
    preview_medications_import,
    build_template_csv,
    build_template_xlsx,
)


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
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'import_medications', 'preview_import', 'import_template'):
            return [IsAdminOrReadOnly()]
        return [IsStaffRole()]

    @action(
        detail=False,
        methods=['post'],
        url_path='bulk-import',
        parser_classes=[MultiPartParser, FormParser],
    )
    def import_medications(self, request):
        upload = request.FILES.get('file')
        if not upload:
            raise ValidationError({'file': 'Aucun fichier fourni.'})

        update_existing = str(request.data.get('update_existing', 'true')).lower() in ('1', 'true', 'yes', 'on')
        sheet_name = request.data.get('sheet') or None

        try:
            results = import_medications_from_file(
                upload,
                upload.name,
                update_existing=update_existing,
                sheet_name=sheet_name,
            )
        except ValueError as exc:
            raise ValidationError({'detail': str(exc)}) from exc

        return Response(results, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=['post'],
        url_path='preview-import',
        parser_classes=[MultiPartParser, FormParser],
    )
    def preview_import(self, request):
        upload = request.FILES.get('file')
        if not upload:
            raise ValidationError({'file': 'Aucun fichier fourni.'})

        sheet_name = request.data.get('sheet') or None

        try:
            preview = preview_medications_import(upload, upload.name, sheet_name=sheet_name)
        except ValueError as exc:
            raise ValidationError({'detail': str(exc)}) from exc

        return Response(preview, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='download-template')
    def import_template(self, request):
        file_format = request.query_params.get('format', 'xlsx').lower()
        categories = Category.objects.order_by('name')
        if file_format == 'csv':
            content = build_template_csv()
            response = HttpResponse(content, content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="modele_medicaments.csv"'
            return response

        if file_format == 'xlsx':
            content = build_template_xlsx(categories)
            response = HttpResponse(
                content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            )
            response['Content-Disposition'] = 'attachment; filename="modele_medicaments.xlsx"'
            return response

        raise ValidationError({'format': 'Format invalide. Utilisez csv ou xlsx.'})
