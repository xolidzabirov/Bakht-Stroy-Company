# Stops the local portable PostgreSQL 17
$pg = "$env:LOCALAPPDATA\PostgreSQL17"
& "$pg\pgsql\bin\pg_ctl.exe" -D "$pg\data" stop
