@echo off
rem Apostle - demarre l'application en local, avec le micro autorise.
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python n'est pas installe. Installez-le depuis python.org, puis relancez ce fichier.
  pause
  exit /b 1
)
echo Apostle demarre sur http://localhost:8000
echo Laissez cette fenetre ouverte pendant l'utilisation.
start "" http://localhost:8000/index.html
python -m http.server 8000
