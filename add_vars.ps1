$filePath = "frontend/src/components/admin/products-admin-client.tsx"
$content = Get-Content $filePath -Raw

# Add new variables after outOfStockProducts with correct escaping
$oldLine = "const outOfStockProducts = products.filter((item) => item.stock <= 0).length;"
$newLines = @"
const outOfStockProducts = products.filter((item) => item.stock <= 0).length;
  const differentTypesCount = new Set(products.map((item) => item.categoryId)).size;
  const inStockProducts = products.filter((item) => item.stock > 0).length;
"@

$content = $content.Replace($oldLine, $newLines)

Set-Content $filePath -Value $content
Write-Host "Variables agregadas correctamente"
