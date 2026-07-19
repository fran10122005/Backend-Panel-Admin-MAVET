$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlVTVS0wMDAxNCIsImlhdCI6MTc4NDQyOTEwOSwiZXhwIjoxNzg0NDMyNzA5fQ.nOkHMClh8joyvsDfFW_m8vE8b1my3tIBQIBig8YzU1I"
$body = '[{"dia_semana":1,"hora_entrada":"09:00","hora_salida":"17:00","es_dia_laborable":true,"observaciones":"Test"}]'

try {
  $response = Invoke-WebRequest -Uri "http://localhost:4000/api/rrhh/trabajadores/TRB-00007/horarios/bulk" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body $body -UseBasicParsing -ErrorAction Stop
  Write-Host "STATUS: $($response.StatusCode)"
  $response.Content
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "BODY: $($reader.ReadToEnd())"
  }
}