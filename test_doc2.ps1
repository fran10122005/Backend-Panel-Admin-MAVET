$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IlVTVS0wMDAwNiIsImlhdCI6MTc4NDQzMTUwOCwiZXhwIjoxNzg0NDM1MTA4fQ.97yZUXZnhfnvmi7etfCmKoLsCy8Ao54LMg9ekhv-CKM"

$tempFile = [System.IO.Path]::GetTempFileName() + ".jpg"
Set-Content -Path $tempFile -Value "fake image content" -Encoding Byte

try {
  $response = Invoke-WebRequest -Uri "http://localhost:4000/api/rrhh/trabajadores/TRB-00010/documentos" -Method POST -Headers @{Authorization="Bearer $token"} -Form @{
    tipo_documento = "foto"
    notas = "Foto de prueba"
    archivo = Get-Item -Path $tempFile
  } -UseBasicParsing -ErrorAction Stop
  Write-Host "STATUS: $($response.StatusCode)"
  $response.Content
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    Write-Host "BODY: $($reader.ReadToEnd())"
  }
} finally {
  Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
}