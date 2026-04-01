import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressesModule } from './addresses/addresses.module';
import { ShippingModule } from './shipping/shipping.module';
import { CouponsModule } from './coupons/coupons.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactsModule } from './contacts/contacts.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    AddressesModule,
    ShippingModule,
    CouponsModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    ContactsModule,
    UploadsModule,
  ],
})
export class AppModule {}
