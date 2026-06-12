import csv
import io
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from django.db import transaction

from .models import Category, Medication

COLUMN_ALIASES = {
    'name': {
        'nom_commercial', 'nom', 'name', 'medicament', 'médicament', 'produit',
    },
    'generic_name': {'nom_generique', 'nom_générique', 'generic_name'},
    'category': {'categorie', 'catégorie', 'category'},
    'dosage': {'dosage'},
    'form': {'forme', 'forme_pharmaceutique', 'form'},
    'manufacturer': {'fabricant', 'manufacturer'},
    'purchase_price': {'prix_achat', 'purchase_price', 'pa'},
    'selling_price': {'prix_vente', 'selling_price', 'pv'},
    'stock_quantity': {'stock', 'quantite', 'quantité', 'stock_quantity'},
    'min_stock': {'stock_minimum', 'stock_min', 'min_stock'},
    'lot_number': {'numero_lot', 'numéro_lot', 'lot', 'lot_number'},
    'expiry_date': {'date_expiration', 'expiration', 'expiry_date', 'date_exp'},
    'barcode': {'code_barres', 'code-barres', 'barcode', 'ean'},
    'location': {'emplacement', 'location'},
    'description': {'description'},
}

REQUIRED_FIELDS = ('name', 'category', 'purchase_price', 'selling_price', 'expiry_date')

TEMPLATE_HEADERS = [
    'nom_commercial',
    'nom_generique',
    'categorie',
    'dosage',
    'forme',
    'fabricant',
    'prix_achat',
    'prix_vente',
    'stock',
    'stock_minimum',
    'numero_lot',
    'date_expiration',
    'code_barres',
    'emplacement',
    'description',
]

TEMPLATE_SAMPLE = [
    'Paracétamol 500mg',
    'Paracétamol',
    'Analgésiques',
    '500mg',
    'Comprimé',
    'Pharma Togo',
    '150',
    '250',
    '100',
    '10',
    'LOT-2026-01',
    '2027-12-31',
    '3760123456789',
    'Rayon A1',
    'Antalgique et antipyrétique',
]

TEMPLATE_SAMPLE_2 = [
    'Amoxicilline 500mg',
    'Amoxicilline',
    'Antibiotiques',
    '500mg',
    'Gélule',
    'Pharma Togo',
    '800',
    '1200',
    '50',
    '10',
    'LOT-2026-02',
    '2028-06-30',
    '3760987654321',
    'Rayon B2',
    'Antibiotique à large spectre',
]

DEFAULT_CATEGORY_EXAMPLES = [
    ('Analgésiques', 'Médicaments contre la douleur et la fièvre'),
    ('Antibiotiques', 'Traitement des infections bactériennes'),
    ('Vitamines', 'Compléments et vitamines'),
    ('Antipaludéens', 'Traitement et prévention du paludisme'),
    ('Dermatologie', 'Soins de la peau'),
]


def normalize_header(value):
    text = str(value or '').strip().lower()
    for old, new in (('é', 'e'), ('è', 'e'), ('ê', 'e'), ('à', 'a'), ('ù', 'u'), ('ô', 'o')):
        text = text.replace(old, new)
    return text.replace(' ', '_').replace('-', '_')


def build_header_map(headers):
    normalized = [normalize_header(h) for h in headers]
    mapping = {}
    for field, aliases in COLUMN_ALIASES.items():
        for index, header in enumerate(normalized):
            if header in aliases or header == field:
                mapping[field] = index
                break
    return mapping


def cell_value(row, mapping, field, default=''):
    index = mapping.get(field)
    if index is None or index >= len(row):
        return default
    value = row[index]
    if value is None:
        return default
    return str(value).strip() if not isinstance(value, (int, float, Decimal)) else value


def parse_decimal(value, field_label):
    if value in ('', None):
        raise ValueError(f'{field_label} est obligatoire.')
    text = str(value).strip().replace(' ', '').replace(',', '.')
    try:
        return Decimal(text)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f'{field_label} invalide : {value}') from exc


def parse_int(value, default=0):
    if value in ('', None):
        return default
    text = str(value).strip().replace(' ', '')
    try:
        return int(float(text))
    except (ValueError, TypeError) as exc:
        raise ValueError(f'Quantité invalide : {value}') from exc


def parse_date(value):
    if value in ('', None):
        raise ValueError("Date d'expiration obligatoire.")
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y', '%Y/%m/%d'):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Date invalide : {value}. Utilisez AAAA-MM-JJ ou JJ/MM/AAAA.")


def resolve_category(name, cache, stats):
    cleaned = str(name or '').strip()
    if not cleaned:
        raise ValueError('Catégorie obligatoire pour chaque produit.')

    cache_key = cleaned.lower()
    if cache_key in cache:
        return cache[cache_key]

    existing = Category.objects.filter(name__iexact=cleaned).first()
    if existing:
        cache[cache_key] = existing
        return existing

    category = Category.objects.create(name=cleaned)
    cache[cache_key] = category
    stats['categories_created'] += 1
    return category


def parse_csv_rows(file_obj):
    content = file_obj.read()
    if isinstance(content, bytes):
        for encoding in ('utf-8-sig', 'utf-8', 'latin-1', 'cp1252'):
            try:
                text = content.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        else:
            raise ValueError('Encodage du fichier CSV non reconnu.')
    else:
        text = content

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise ValueError('Le fichier est vide.')
    header_map = build_header_map(rows[0])
    return header_map, rows[1:]


def parse_xlsx_rows(file_obj):
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise ValueError('Support Excel indisponible (openpyxl manquant).') from exc

    workbook = load_workbook(file_obj, read_only=True, data_only=True)
    sheet = workbook.active
    rows = [list(row) for row in sheet.iter_rows(values_only=True)]
    workbook.close()
    if not rows:
        raise ValueError('Le fichier Excel est vide.')
    header_map = build_header_map(rows[0])
    return header_map, rows[1:]


def parse_uploaded_file(file_obj, filename):
    ext = filename.rsplit('.', 1)[-1].lower() if filename and '.' in filename else ''
    if ext == 'csv':
        return parse_csv_rows(file_obj)
    if ext == 'xlsx':
        return parse_xlsx_rows(file_obj)
    raise ValueError('Format non supporté. Utilisez .csv ou .xlsx.')


def row_to_payload(row, mapping, category_cache, stats):
    name = str(cell_value(row, mapping, 'name')).strip()
    if not name:
        raise ValueError('Nom commercial manquant.')

    category_name = str(cell_value(row, mapping, 'category')).strip()
    barcode = str(cell_value(row, mapping, 'barcode')).strip() or None

    return {
        'name': name,
        'generic_name': str(cell_value(row, mapping, 'generic_name')).strip() or None,
        'category': resolve_category(category_name, category_cache, stats),
        'dosage': str(cell_value(row, mapping, 'dosage')).strip() or None,
        'form': str(cell_value(row, mapping, 'form')).strip() or None,
        'manufacturer': str(cell_value(row, mapping, 'manufacturer')).strip() or None,
        'purchase_price': parse_decimal(cell_value(row, mapping, 'purchase_price'), 'Prix achat'),
        'selling_price': parse_decimal(cell_value(row, mapping, 'selling_price'), 'Prix vente'),
        'stock_quantity': parse_int(cell_value(row, mapping, 'stock_quantity'), 0),
        'min_stock': parse_int(cell_value(row, mapping, 'min_stock'), 5),
        'lot_number': str(cell_value(row, mapping, 'lot_number')).strip() or None,
        'expiry_date': parse_date(cell_value(row, mapping, 'expiry_date')),
        'barcode': barcode,
        'location': str(cell_value(row, mapping, 'location')).strip() or None,
        'description': str(cell_value(row, mapping, 'description')).strip() or None,
    }


def import_medications_from_file(file_obj, filename, update_existing=True):
    header_map, data_rows = parse_uploaded_file(file_obj, filename)

    missing = [field for field in REQUIRED_FIELDS if field not in header_map]
    if missing:
        labels = {
            'name': 'nom_commercial',
            'category': 'categorie',
            'purchase_price': 'prix_achat',
            'selling_price': 'prix_vente',
            'expiry_date': 'date_expiration',
        }
        raise ValueError(
            'Colonnes obligatoires manquantes : '
            + ', '.join(labels.get(f, f) for f in missing)
        )

    results = {
        'created': 0,
        'updated': 0,
        'skipped': 0,
        'categories_created': 0,
        'errors': [],
        'total_rows': 0,
    }
    category_cache = {}

    for line_no, row in enumerate(data_rows, start=2):
        if not row or all(str(cell or '').strip() == '' for cell in row):
            continue

        results['total_rows'] += 1
        try:
            payload = row_to_payload(row, header_map, category_cache, results)
            category = payload.pop('category')

            with transaction.atomic():
                existing = None
                if payload['barcode']:
                    existing = Medication.objects.filter(barcode=payload['barcode']).first()

                if existing:
                    if not update_existing:
                        results['skipped'] += 1
                        continue
                    for key, value in payload.items():
                        setattr(existing, key, value)
                    existing.category = category
                    existing.save()
                    results['updated'] += 1
                else:
                    Medication.objects.create(category=category, **payload)
                    results['created'] += 1
        except Exception as exc:
            results['errors'].append({'line': line_no, 'message': str(exc)})

    return results


def build_template_csv():
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(TEMPLATE_HEADERS)
    writer.writerow(TEMPLATE_SAMPLE)
    writer.writerow(TEMPLATE_SAMPLE_2)
    return buffer.getvalue().encode('utf-8-sig')


def build_template_xlsx(categories=None):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = 'Medicaments'
    sheet.append(TEMPLATE_HEADERS)
    sheet.append(TEMPLATE_SAMPLE)
    sheet.append(TEMPLATE_SAMPLE_2)

    header_fill = PatternFill('solid', fgColor='EEF2FF')
    header_font = Font(bold=True)
    for cell in sheet[1]:
        cell.fill = header_fill
        cell.font = header_font
    for column in sheet.columns:
        sheet.column_dimensions[column[0].column_letter].width = 18

    cat_sheet = workbook.create_sheet('Categories')
    cat_sheet.append(['categorie', 'description'])
    for cell in cat_sheet[1]:
        cell.fill = header_fill
        cell.font = header_font
    rows = [(c.name, c.description or '') for c in categories] if categories else DEFAULT_CATEGORY_EXAMPLES
    for name, description in rows:
        cat_sheet.append([name, description])
    cat_sheet.column_dimensions['A'].width = 22
    cat_sheet.column_dimensions['B'].width = 40

    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()
