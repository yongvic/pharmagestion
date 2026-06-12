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

    def validate(self, attrs):
        if self.instance is None and not attrs.get('category'):
            raise serializers.ValidationError({'category': 'La catégorie est obligatoire.'})
        if self.instance and 'category' in attrs and not attrs['category']:
            raise serializers.ValidationError({'category': 'La catégorie est obligatoire.'})
        return attrs
