from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    medication_name = serializers.ReadOnlyField(source='medication.name')
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ('user',)

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        instance = StockMovement(**validated_data)
        try:
            instance.save()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else str(e))
        return instance
