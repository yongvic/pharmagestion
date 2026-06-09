from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework import viewsets, filters, decorators, response
from django_filters.rest_framework import DjangoFilterBackend
from users.permissions import CanManageSales, IsAdmin
from .models import Sale
from .serializers import SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related(
        'pharmacist', 'cashier', 'insurance'
    ).prefetch_related('items__medication').all()
    serializer_class = SaleSerializer
    permission_classes = [CanManageSales]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'insurance', 'payment_method']
    search_fields = ['invoice_number']
    ordering_fields = ['created_at', 'total_amount']

    def get_permissions(self):
        if self.action == 'stats':
            return [IsAdmin()]
        return [CanManageSales()]

    @decorators.action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        two_weeks_ago = today - timedelta(days=14)

        completed = Sale.objects.filter(status=Sale.Status.COMPLETED)
        today_sales = completed.filter(created_at__date=today)
        week_sales = completed.filter(created_at__date__gte=week_ago)
        prev_week_sales = completed.filter(
            created_at__date__gte=two_weeks_ago,
            created_at__date__lt=week_ago,
        )

        today_revenue = today_sales.aggregate(t=Sum('total_amount'))['t'] or Decimal('0')
        week_revenue = week_sales.aggregate(t=Sum('total_amount'))['t'] or Decimal('0')
        prev_week_revenue = prev_week_sales.aggregate(t=Sum('total_amount'))['t'] or Decimal('0')

        revenue_change = 0
        if prev_week_revenue > 0:
            revenue_change = float(
                ((week_revenue - prev_week_revenue) / prev_week_revenue) * 100
            )

        sales_change = week_sales.count() - prev_week_sales.count()

        return response.Response({
            'today_revenue': today_revenue,
            'week_revenue': week_revenue,
            'today_sales_count': today_sales.count(),
            'week_sales_count': week_sales.count(),
            'revenue_change_percent': round(revenue_change, 1),
            'sales_change': sales_change,
            'pending_count': Sale.objects.filter(status=Sale.Status.PENDING).count(),
        })
