import { Test } from '@nestjs/testing';
import { ProductAvailability } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  const baseDto = {
    name: 'MacBook Air M4',
    shortDescription: 'Notebook Apple a pedido, chip M4.',
    description: 'MacBook Air con chip M4, disponible a pedido para Argentina.',
    sku: 'MBA-M4-2026',
    stock: 0,
    brandId: 'brand-1',
    categoryId: 'category-importados',
    images: [{ url: 'https://example.com/macbook.png' }],
  };

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data })),
        // `findFirst` backs two different lookups in ProductsService: the
        // update() existence check (queries by `id`) and generateUniqueSlug's
        // collision check (queries by `slug`). Route by which key is present
        // so the existence check finds the product but the slug check always
        // reports "no collision" — otherwise generateUniqueSlug loops up to
        // 1000 times against a mock that never says a slug is free.
        findFirst: jest.fn().mockImplementation(({ where }: { where: Record<string, unknown> }) =>
          Promise.resolve('id' in where ? { id: where.id } : null),
        ),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'p1', ...data })),
      },
      $transaction: jest.fn().mockImplementation((cb: (tx: unknown) => unknown) => cb(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ProductsService);
  });

  it('creates a product without currentPrice as null, defaulting availability to IN_STOCK', async () => {
    const result = await service.create(baseDto as never);

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          currentPrice: null,
          availability: ProductAvailability.IN_STOCK,
        }),
      }),
    );
    expect(result).toBeDefined();
  });

  it('creates a product with an explicit ORDER_ONLY availability', async () => {
    await service.create({
      ...baseDto,
      currentPrice: 2500000,
      availability: ProductAvailability.ORDER_ONLY,
    } as never);

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          availability: ProductAvailability.ORDER_ONLY,
        }),
      }),
    );
  });

  it('update: omitting currentPrice leaves the existing price untouched', async () => {
    await service.update('p1', { name: 'MacBook Air M4 (renamed)' } as never);

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentPrice: undefined }),
      }),
    );
  });

  it('update: explicit null clears the price ("Consultar precio")', async () => {
    await service.update('p1', { currentPrice: null } as never);

    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentPrice: null }),
      }),
    );
  });
});
