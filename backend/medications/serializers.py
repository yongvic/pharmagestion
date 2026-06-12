from rest_framework import serializers
from .models import Category, Medication

class CategorySerializer(serializers.ModelSerializer):
    medication_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'medication_count']

class MedicationSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Medication
        fields = '__all__'
