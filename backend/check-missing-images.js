const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const images = await prisma.productImage.findMany({
    select: { id: true, url: true, productId: true },
  });

  const missing = [];
  for (const image of images) {
    const url = image.url || '';
    const match = url.match(/\/uploads\/products\/([^?#]+)/i);
    if (!match) continue;
    const fileName = decodeURIComponent(match[1]);
    const filePath = path.join(process.cwd(), 'uploads', 'products', fileName);
    if (!fs.existsSync(filePath)) {
      missing.push({
        id: image.id,
        productId: image.productId,
        fileName,
        url: image.url,
      });
    }
  }

  console.log('TOTAL_IMAGES', images.length);
  console.log('MISSING_FILES', missing.length);
  if (missing.length) {
    console.log(JSON.stringify(missing.slice(0, 20), null, 2));
  }

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
