$filePath = "frontend/src/components/admin/products-admin-client.tsx"
$content = Get-Content $filePath -Raw

# Add new variables after outOfStockProducts
$pattern = "const outOfStockProducts = products.filter\(\(item\) => item.stock <= 0\).length;"
$replacement = "const outOfStockProducts = products.filter((item) => item.stock <= 0).length;" + [Environment]::NewLine + "  const differentTypesCount = new Set(products.map((item) => item.categoryId)).size;" + [Environment]::NewLine + "  const inStockProducts = products.filter((item) => item.stock > 0).length;"
$content = $content -replace [regex]::Escape($pattern), $replacement

# Replace the stats array
$oldArray = @"
          { label: "Total", value: totalProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "Activos", value: activeProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "Destacados", value: featuredProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "Stock bajo", value: lowStockProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "Sin stock", value: outOfStockProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
"@

$newArray = @"
          { label: "Total", value: totalProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "Diferentes tipos", value: differentTypesCount, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "En stock", value: inStockProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
          { label: "Sin stock", value: outOfStockProducts, tone: "border-zinc-200 bg-white text-zinc-950" },
"@

$content = $content -replace [regex]::Escape($oldArray), $newArray

# Change grid columns from 5 to 4
$content = $content -replace "xl:grid-cols-5", "xl:grid-cols-4"

Set-Content $filePath -Value $content
Write-Host "Archivo actualizado correctamente"
