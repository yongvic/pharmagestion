from rest_framework import viewsets, response, status
from users.permissions import IsAdmin, IsStaffRole
from .models import PharmacySettings
from .serializers import PharmacySettingsSerializer


class PharmacySettingsViewSet(viewsets.ModelViewSet):
    queryset = PharmacySettings.objects.all()
    serializer_class = PharmacySettingsSerializer
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action in ('update', 'partial_update'):
            return [IsAdmin()]
        return [IsStaffRole()]

    def list(self, request, *args, **kwargs):
        settings, _ = PharmacySettings.objects.get_or_create(
            defaults={'name': 'Ma Pharmacie'}
        )
        serializer = self.get_serializer(settings)
        return response.Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return self.list(request)
