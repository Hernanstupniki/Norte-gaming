const fs = require('fs');

async function run() {
  const base = 'http://localhost:4000/api';

  const loginRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nortegaming.com', password: 'Admin123*' }),
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  const loginJson = await loginRes.json();
  const token = loginJson?.tokens?.accessToken;
  if (!token) throw new Error('No accessToken returned');

  const brandsRes = await fetch(`${base}/brands/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
  const categoriesRes = await fetch(`${base}/categories/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
  const brands = await brandsRes.json();
  const categories = await categoriesRes.json();
  if (!brands?.length || !categories?.length) throw new Error('No brands or categories available');

  const imagePath = 'c:/Users/lauta/OneDrive/Desktop/Nueva carpeta/Nueva carpeta/norte-gaming/public/images/hero-teclado.jpg';
  const bytes = fs.readFileSync(imagePath);
  const blob = new Blob([bytes], { type: 'image/jpeg' });
  const fd = new FormData();
  fd.append('file', blob, 'hero-teclado.jpg');

  const uploadRes = await fetch(`${base}/uploads/product-image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  const uploadJson = await uploadRes.json();

  const uniq = Date.now();
  const payload = {
    name: `Producto Admin Test ${uniq}`,
    shortDescription: 'Producto de prueba admin con imagen',
    description: 'Producto de prueba creado para validar login admin y subida de imagen al backend correctamente.',
    currentPrice: 99999,
    previousPrice: 109999,
    sku: `ADMIN-TEST-${uniq}`,
    stock: 5,
    isFeatured: false,
    isOnOffer: false,
    isActive: true,
    brandId: brands[0].id,
    categoryId: categories[0].id,
    images: [{ url: uploadJson.url, alt: 'Hero teclado test' }],
    specs: [{ name: 'Test', value: 'OK' }],
  };

  const createRes = await fetch(`${base}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
  const createJson = await createRes.json();

  console.log('LOGIN_OK');
  console.log('UPLOAD_URL:', uploadJson.url);
  console.log('PRODUCT_CREATED:', createJson.id, createJson.slug);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
