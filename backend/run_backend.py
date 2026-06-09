import os
import sys
import django
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger('pharmagestion')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

django.setup()

from django.core.management import call_command
from users.models import User


def ensure_admin_exists():
    """Crée l'admin initial uniquement s'il n'existe pas."""
    if User.objects.filter(username='admin').exists():
        return
    password = os.environ.get('PHARMAGESTION_ADMIN_PASSWORD', 'admin')
    User.objects.create_superuser(
        username='admin',
        email='admin@pharmagestion.local',
        password=password,
        role='ADMIN',
    )
    logger.info("Compte administrateur initial créé (admin / %s)", password)


if __name__ == '__main__':
    args = sys.argv[1:]

    if not args or args[0] == 'runserver':
        try:
            call_command('migrate', verbosity=0)
            ensure_admin_exists()
        except Exception as e:
            logger.error('Migration error: %s', e)

        addrport = args[1] if len(args) > 1 else '127.0.0.1:8765'
        try:
            call_command('runserver', addrport, '--noreload', verbosity=1)
        except Exception as e:
            logger.error('Server error: %s', e)
    else:
        from django.core.management import execute_from_command_line
        execute_from_command_line(['manage.py'] + args)
