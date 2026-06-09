import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User

def create_admin():
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin', role='ADMIN')
        print("Superuser 'admin' created successfully with password 'admin'")
    else:
        print("Superuser 'admin' already exists")

if __name__ == '__main__':
    create_admin()
