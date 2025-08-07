# Script PowerShell corrigido para testar o webhook
$uri = "https://wvojbjkdlnvlqgjwtdaf.supabase.co/functions/v1/ggcheckout-webhook"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer marcoslima"
}

$body = @{
    event = "pix.paid"
    customer = @{
        name = "Marcos Fut"
        email = "marcosfut9713@gmail.com"
    }
    payment = @{
        id = "test_payment_123"
        method = "pix.paid"
        status = "paid"
        amount = 2
    }
    product = @{
        id = "test_product"
        name = "Test Product"
    }
    transaction_id = "test_transaction_123"
} | ConvertTo-Json -Depth 10

Write-Host "🔄 Testando webhook..." -ForegroundColor Yellow
Write-Host "URL: $uri" -ForegroundColor Cyan
Write-Host "Body: $body" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✅ Sucesso!" -ForegroundColor Green
    Write-Host "Resposta: $($response | ConvertTo-Json -Depth 10)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro: $responseBody" -ForegroundColor Red
    }
} 