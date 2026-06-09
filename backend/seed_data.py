import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from medications.models import Medication, Category
from insurance.models import Insurance

def seed_data():
    # Categories
    cat_analgesics, _ = Category.objects.get_or_create(name="Analgésiques", description="Médicaments contre la douleur")
    cat_antibiotics, _ = Category.objects.get_or_create(name="Antibiotiques", description="Contre les infections bactériennes")
    cat_vitamins, _ = Category.objects.get_or_create(name="Vitamines", description="Compléments alimentaires")
    
    # Medications
    Medication.objects.get_or_create(
        barcode="123456789",
        defaults=dict(
        name="Paracétamol 500mg",
        generic_name="Paracétamol",
        category=cat_analgesics,
        dosage="500mg",
        form="Comprimé",
        purchase_price=Decimal("500"),
        selling_price=Decimal("800"),
        stock_quantity=50,
        min_stock=10,
        expiry_date=date.today() + timedelta(days=365),
        ))
    
    Medication.objects.get_or_create(
        barcode="987654321",
        defaults=dict(
        name="Amoxicilline 1g",
        generic_name="Amoxicilline",
        category=cat_antibiotics,
        dosage="1g",
        form="Gélule",
        purchase_price=Decimal("1500"),
        selling_price=Decimal("2500"),
        stock_quantity=5,
        min_stock=10,
        expiry_date=date.today() + timedelta(days=180),
        ))
    
    Medication.objects.get_or_create(
        barcode="111222333",
        defaults=dict(
        name="Vitamine C 1000mg",
        generic_name="Acide Ascorbique",
        category=cat_vitamins,
        dosage="1000mg",
        form="Effervescent",
        purchase_price=Decimal("1200"),
        selling_price=Decimal("2000"),
        stock_quantity=20,
        min_stock=5,
        expiry_date=date.today() + timedelta(days=730),
        ))

    # Insurances
    Insurance.objects.get_or_create(name="INAM", coverage_rate=Decimal("80.00"), description="Assurance Maladie Togo")
    Insurance.objects.get_or_create(name="SUNU", coverage_rate=Decimal("70.00"), description="Assurance Privée")
    Insurance.objects.get_or_create(name="NSIA", coverage_rate=Decimal("50.00"), description="Assurance Privée")

    print("Data seeded successfully!")

if __name__ == '__main__':
    seed_data()
