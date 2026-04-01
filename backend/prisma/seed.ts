import { PrismaClient, DiscountType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin123*', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nortegaming.com' },
    update: {
      firstName: 'Admin',
      lastName: 'Norte',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      deletedAt: null,
    },
    create: {
      firstName: 'Admin',
      lastName: 'Norte',
      email: 'admin@nortegaming.com',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },  
  });

  const [razer, logitech, asusRog, msi, acerPredator, reddragon, glorious, corsair, steelseries] = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'razer' },
      update: {},
      create: { name: 'Razer', slug: 'razer', description: 'Perifericos gamer premium' },
    }),
    prisma.brand.upsert({
      where: { slug: 'logitech-g' },
      update: {},
      create: {
        name: 'Logitech G',
        slug: 'logitech-g',
        description: 'Mouse y teclados de alto rendimiento',
      },
    }),
    prisma.brand.upsert({
      where: { slug: 'asus-rog' },
      update: {},
      create: { name: 'ASUS ROG', slug: 'asus-rog', description: 'Perifericos y componentes gaming ASUS' },
    }),
    prisma.brand.upsert({
      where: { slug: 'msi' },
      update: {},
      create: { name: 'MSI', slug: 'msi', description: 'Equipamiento gaming MSI' },
    }),
    prisma.brand.upsert({
      where: { slug: 'acer-predator' },
      update: {},
      create: { name: 'ACER Predator', slug: 'acer-predator', description: 'Perifericos Predator para gamers' },
    }),
    prisma.brand.upsert({
      where: { slug: 'reddragon' },
      update: {},
      create: { name: 'Reddragon', slug: 'reddragon', description: 'Perifericos gaming de buena relacion precio' },
    }),
    prisma.brand.upsert({
      where: { slug: 'glorious' },
      update: {},
      create: { name: 'Glorious', slug: 'glorious', description: 'Equipamiento gaming de calidad profesional' },
    }),
    prisma.brand.upsert({
      where: { slug: 'corsair' },
      update: {},
      create: { name: 'Corsair', slug: 'corsair', description: 'Perifericos y accesorios Corsair' },
    }),
    prisma.brand.upsert({
      where: { slug: 'steelseries' },
      update: {},
      create: { name: 'SteelSeries', slug: 'steelseries', description: 'Equipamiento competitivo SteelSeries' },
    }),
  ]);

  const [mouses, teclados, mouse, teclado, mousepad, auricular, monitores, accesorios] = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mouses-gamer' },
      update: {},
      create: {
        name: 'Mouses Gamer',
        slug: 'mouses-gamer',
        description: 'Mouses para esports y gaming competitivo',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'teclados-gamer' },
      update: {},
      create: {
        name: 'Teclados Gamer',
        slug: 'teclados-gamer',
        description: 'Teclados mecanicos para setup pro',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'mouse' },
      update: {},
      create: {
        name: 'Mouse',
        slug: 'mouse',
        description: 'Mouses para gaming',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'teclado' },
      update: {},
      create: {
        name: 'Teclado',
        slug: 'teclado',
        description: 'Teclados para gaming',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'mousepad' },
      update: {},
      create: {
        name: 'Mousepad',
        slug: 'mousepad',
        description: 'Pads de mouse profesionales',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'auricular' },
      update: {},
      create: {
        name: 'Auricular',
        slug: 'auricular',
        description: 'Auriculares y headsets gaming',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'monitores' },
      update: {},
      create: {
        name: 'Monitores',
        slug: 'monitores',
        description: 'Monitores para gaming',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'accesorios' },
      update: {},
      create: {
        name: 'Accesorios',
        slug: 'accesorios',
        description: 'Accesorios y complementos gaming',
      },
    }),
  ]);

  await prisma.product.upsert({
    where: { slug: 'razer-viper-v2-pro' },
    update: {},
    create: {
      name: 'Razer Viper V2 Pro',
      slug: 'razer-viper-v2-pro',
      shortDescription: 'Mouse ultraliviano inalambrico para esports',
      description:
        'Sensor Focus Pro 30K, switches opticos de 3ra gen y autonomia extendida para sesiones competitivas.',
      currentPrice: 149999,
      previousPrice: 179999,
      sku: 'RZR-VIPER-V2-PRO',
      stock: 20,
      isFeatured: true,
      isOnOffer: true,
      brandId: razer.id,
      categoryId: mouses.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=1200&q=80',
            alt: 'Razer Viper V2 Pro',
            position: 0,
          },
        ],
      },
      specs: {
        create: [
          { name: 'Sensor', value: 'Focus Pro 30K', position: 0 },
          { name: 'Peso', value: '58g', position: 1 },
          { name: 'Conexion', value: 'HyperSpeed Wireless', position: 2 },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'logitech-g-pro-x-tkl' },
    update: {},
    create: {
      name: 'Logitech G Pro X TKL',
      slug: 'logitech-g-pro-x-tkl',
      shortDescription: 'Teclado mecanico tenkeyless para jugadores pro',
      description:
        'Diseno TKL compacto, switches intercambiables y modo game para maximo rendimiento en torneos.',
      currentPrice: 189999,
      previousPrice: 219999,
      sku: 'LOG-PRO-X-TKL',
      stock: 15,
      isFeatured: true,
      isOnOffer: true,
      brandId: logitech.id,
      categoryId: teclados.id,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=1200&q=80',
            alt: 'Logitech G Pro X TKL',
            position: 0,
          },
        ],
      },
      specs: {
        create: [
          { name: 'Formato', value: 'TKL', position: 0 },
          { name: 'Switches', value: 'GX Mechanical', position: 1 },
          { name: 'Iluminacion', value: 'LIGHTSYNC RGB', position: 2 },
        ],
      },
    },
  });

  await prisma.shippingMethod.upsert({
    where: { name: 'Envio Estandar' },
    update: {},
    create: {
      name: 'Envio Estandar',
      description: 'Entrega estimada de 3 a 5 dias habiles',
      cost: 4500,
      isActive: true,
    },
  });

  await prisma.shippingMethod.upsert({
    where: { name: 'Envio Express' },
    update: {},
    create: {
      name: 'Envio Express',
      description: 'Entrega en 24 a 48hs',
      cost: 8900,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'NORTE10' },
    update: {},
    create: {
      code: 'NORTE10',
      name: 'Descuento Bienvenida',
      description: '10% off en tu primera compra',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 50000,
      maxDiscount: 30000,
      maxUsesPerUser: 1,
      isActive: true,
    },
  });

  console.log('Seed completado.');
  console.log('Admin:', admin.email, 'password: Admin123*');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
