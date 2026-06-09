# Recrée l'environnement Python si le venv est corrompu
$BackendDir = Join-Path $PSScriptRoot "..\backend"
Set-Location $BackendDir

if (Test-Path "venv") {
    Write-Host "Suppression de l'ancien venv..."
    Remove-Item -Recurse -Force venv
}

Write-Host "Création du venv Python 3.12..."
py -3.12 -m venv venv

Write-Host "Installation des dépendances..."
.\venv\Scripts\pip install -r requirements.txt

Write-Host "Migrations..."
.\venv\Scripts\python manage.py migrate

Write-Host "Données de démo..."
.\venv\Scripts\python seed_data.py

Write-Host "Terminé ! Lancez: npm run dev"
