from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from medications.import_service import import_medications_from_file


class Command(BaseCommand):
    help = 'Importe des médicaments depuis un fichier Excel (.xlsx) ou CSV.'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Chemin vers le fichier Excel ou CSV')
        parser.add_argument(
            '--sheet',
            type=str,
            default=None,
            help='Nom de la feuille Excel (inventaire MEG/CHP)',
        )
        parser.add_argument(
            '--no-update',
            action='store_true',
            help='Ne pas mettre à jour les produits existants',
        )

    def handle(self, *args, **options):
        path = Path(options['file'])
        if not path.exists():
            raise CommandError(f'Fichier introuvable : {path}')

        with path.open('rb') as handle:
            results = import_medications_from_file(
                handle,
                path.name,
                update_existing=not options['no_update'],
                sheet_name=options['sheet'],
            )

        self.stdout.write(self.style.SUCCESS(
            f"Import terminé — créés: {results['created']}, "
            f"mis à jour: {results['updated']}, "
            f"ignorés: {results['skipped']}, "
            f"catégories créées: {results['categories_created']}, "
            f"erreurs: {len(results['errors'])}"
        ))
        if results.get('format') == 'meg_chp_inventaire':
            self.stdout.write(f"Format MEG/CHP — feuille: {results.get('sheet')}")
        for err in results['errors'][:20]:
            self.stdout.write(self.style.WARNING(f"Ligne {err['line']}: {err['message']}"))
