# Starts the local portable PostgreSQL 17 (port 5433) used by backend/.env
$pg = "$env:LOCALAPPDATA\PostgreSQL17"
& "$pg\pgsql\bin\pg_isready.exe" -h localhost -p 5433 | Out-Null
if ($LASTEXITCODE -eq 0) { Write-Host "PostgreSQL already running on :5433"; exit 0 }
Start-Process -FilePath "$pg\pgsql\bin\pg_ctl.exe" -ArgumentList "-D `"$pg\data`" -l `"$pg\postgres.log`" start" -WindowStyle Hidden
Start-Sleep 3
& "$pg\pgsql\bin\pg_isready.exe" -h localhost -p 5433
