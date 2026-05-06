# Start Backend
Write-Host "Starting Backend..."
$env:PYTHONPATH = "C:\Users\asus\Downloads\Road portfolio\infrastructure-damage-detection;C:\Users\asus\Downloads\Road portfolio\infrastructure-damage-detection\backend"
Start-Process -FilePath "uvicorn" -ArgumentList "main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory "C:\Users\asus\Downloads\Road portfolio\infrastructure-damage-detection\backend" -NoNewWindow

# Start Frontend
Write-Host "Starting Frontend..."
cd "C:\Users\asus\Downloads\Road portfolio\infrastructure-damage-detection\frontend"
$env:HOST = "127.0.0.1"
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "C:\Users\asus\Downloads\Road portfolio\infrastructure-damage-detection\frontend" -NoNewWindow
