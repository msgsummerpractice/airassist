@echo off
cd /d C:\airassist\AirAssistBackend
if not exist logs mkdir logs
echo ---- %DATE% %TIME% ---- >> logs\populate_airports.log
C:\airassist\.venv\Scripts\python.exe manage.py populate_airports >> logs\populate_airports.log 2>&1
