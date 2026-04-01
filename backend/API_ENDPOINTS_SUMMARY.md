# API Endpoints Summary

Base path: `/api`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `PATCH /auth/change-password`
- `POST /auth/logout`

## Users

- `GET /users/me`
- `PATCH /users/me`
- `GET /users` (admin)
- `GET /users/:id` (admin)
- `PATCH /users/:id/status` (admin)

## Brands

- `GET /brands` (public)
- `GET /brands/admin/all` (admin)
- `POST /brands` (admin)
- `PATCH /brands/:id` (admin)
- `DELETE /brands/:id` (admin)

## Categories

- `GET /categories` (public)
- `GET /categories/admin/all` (admin)
- `POST /categories` (admin)
- `PATCH /categories/:id` (admin)
- `DELETE /categories/:id` (admin)

## Products

- `GET /products` (public)
- `GET /products/:slug` (public)
- `GET /products/admin/all` (admin)
- `GET /products/admin/by-slug/:slug` (admin)
- `POST /products` (admin)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)

## Cart

- `GET /cart/me`
- `POST /cart/me/items`
- `PATCH /cart/me/items/:itemId`
- `DELETE /cart/me/items/:itemId`
- `DELETE /cart/me`

## Wishlist

- `GET /wishlist/me`
- `POST /wishlist/me/toggle`
- `DELETE /wishlist/me/items/:itemId`
- `DELETE /wishlist/me`

## Addresses

- `GET /addresses/me`
- `POST /addresses/me`
- `PATCH /addresses/me/:id`
- `PATCH /addresses/me/:id/primary`
- `DELETE /addresses/me/:id`

## Shipping

- `GET /shipping/methods` (public)
- `GET /shipping/methods/admin/all` (admin)
- `POST /shipping/methods` (admin)
- `PATCH /shipping/methods/:id` (admin)
- `DELETE /shipping/methods/:id` (admin)

## Coupons

- `GET /coupons` (public)
- `GET /coupons/admin/all` (admin)
- `POST /coupons` (admin)
- `PATCH /coupons/:id` (admin)
- `DELETE /coupons/:id` (admin)

## Orders

- `POST /orders/me`
- `GET /orders/me`
- `GET /orders/me/:id`
- `GET /orders/admin/all` (admin)
- `PATCH /orders/admin/:id/status` (admin)

## Payments

- `POST /payments`
- `GET /payments/me`
- `GET /payments/admin/all` (admin)
- `PATCH /payments/:id/status` (admin)

## Reviews

- `GET /reviews/product/:productId` (public)
- `POST /reviews`
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`
- `GET /reviews/admin/all` (admin)
- `PATCH /reviews/admin/:id/status` (admin)

## Contacts

- `POST /contacts` (public)
- `GET /contacts/admin/all` (admin)
- `PATCH /contacts/admin/:id/status` (admin)
- `DELETE /contacts/admin/:id` (admin)
