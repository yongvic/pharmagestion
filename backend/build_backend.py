import os
import sys
import shutil
import subprocess

# Get the backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BACKEND_DIR, 'dist')

# Clean previous build
for d in ['build', 'dist']:
    p = os.path.join(BACKEND_DIR, d)
    if os.path.exists(p):
        shutil.rmtree(p)

# Hidden imports needed by Django and its apps
HIDDEN_IMPORTS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.admin.apps',
    'django.contrib.auth.apps',
    'django.contrib.contenttypes.apps',
    'django.contrib.sessions.apps',
    'django.contrib.messages.apps',
    'django.contrib.staticfiles.apps',
    'django.core.management.commands.runserver',
    'django.core.management.commands.migrate',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.serializers',
    'rest_framework_simplejwt.state',
    'rest_framework_simplejwt.authentication',
    'rest_framework_simplejwt.tokens',
    'rest_framework_simplejwt.views',
    'rest_framework_simplejwt.token_blacklist',
    'rest_framework_simplejwt.token_blacklist.apps',
    'rest_framework_simplejwt.token_blacklist.models',
    'rest_framework',
    'django_filters',
    'corsheaders',
    'openpyxl',
]

# Build command
cmd = [
    sys.executable, '-m', 'PyInstaller',
    '--name', 'backend',
    '--onefile',
    '--clean',
    '--noconfirm',
    '--distpath', OUTPUT_DIR,
    '--workpath', os.path.join(BACKEND_DIR, 'build'),
    '--specpath', BACKEND_DIR,
    # Collect EVERYTHING from critical packages
    '--collect-all', 'rest_framework_simplejwt',
    '--collect-all', 'rest_framework',
    '--collect-all', 'django_filters',
    '--collect-all', 'corsheaders',
    '--collect-all', 'openpyxl',
]

# Add data files
datas = [
    (os.path.join(BACKEND_DIR, 'config'), 'config'),
]

# Include migrations for all apps
for app in ['users', 'medications', 'inventory', 'sales', 'insurance', 'notifications', 'app_settings']:
    migrations_dir = os.path.join(BACKEND_DIR, app, 'migrations')
    if os.path.exists(migrations_dir):
        datas.append((migrations_dir, os.path.join(app, 'migrations')))

for src, dst in datas:
    cmd.extend(['--add-data', f'{src}{os.pathsep}{dst}'])

# Add hidden imports
for imp in set(HIDDEN_IMPORTS):
    cmd.extend(['--hidden-import', imp])

# Add the main script
cmd.append(os.path.join(BACKEND_DIR, 'run_backend.py'))

# Run
os.chdir(BACKEND_DIR)
print('Running PyInstaller with --collect-all flags...')
try:
    subprocess.run(cmd, check=True)
    print('Build successful!')
except subprocess.CalledProcessError as e:
    print(f'Build failed with error: {e}')
    sys.exit(1)
