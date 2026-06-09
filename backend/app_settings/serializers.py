from rest_framework import serializers
from .models import PharmacySettings

class PharmacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacySettings
        fields = '__all__'
