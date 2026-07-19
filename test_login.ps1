$body = '{"correo":"educador@gmail.eom","password":"123456"}'
try {
  $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -ErrorAction Stop
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