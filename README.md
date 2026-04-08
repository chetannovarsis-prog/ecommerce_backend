# Ecommerce Backend API

The high-performance engine powering the storefront and admin dashboard. Built with Node.js, Express, and Prisma ORM.

## 🛠 Tech Stack
- **Framework**: Express.js (v5)
- **Database Logic**: Prisma ORM with PostgreSQL
- **Storage**: Supabase Storage (via `@supabase/supabase-js`)
- **Authentication**: JWT & Bcrypt
- **Mailing**: Nodemailer
- **File Handling**: Multer

## 📂 Project Structure
- `src/controllers/`: Business logic for each resource.
- `src/routes/`: API endpoint definitions.
- `src/config/`: Database and external service configurations (DB, Supabase).
- `src/middleware/`: Custom middlewares (Upload handling).
- `prisma/`: Database schema and migrations.

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/db"
   JWT_SECRET="your_secret_key"
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   # ... other configs
   ```

3. **Database Migration**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run Server**:
   ```bash
   npm run dev
   ```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/customer/login` - Storefront customer login

### Products & Management
- `GET /api/products` - List all products
- `GET /api/products/best-sellers` - Get best selling products
- `GET /api/products/new-arrivals` - Get most recent products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `PATCH /api/products/:id` - Partial update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories & Collections
- `GET /api/categories` - Fetch categories
- `GET /api/collections` - Fetch collections

### Reviews & Sales
- `POST /api/reviews` - Submit product review
- `GET /api/sales` - Fetch sales analytics (Admin)

### Uploads
- `POST /api/upload` - Handle image uploads to Supabase

### Shipping
- `POST /api/shipping/create` - Create a Shiprocket shipment for an existing order
- `GET /api/shipping/track?awb=<awb>` - Fetch live shipment tracking details
- `GET /api/shipping/track?orderId=<orderId>` - Fetch tracking details using a stored shipment
- `GET /api/shipping/order/:orderId` - Fetch stored shipment data for an order

## Shipping Setup

Add these environment variables before using the shipping APIs:

```env
SHIPROCKET_EMAIL="your-shiprocket-email"
SHIPROCKET_PASSWORD="your-shiprocket-password"
SHIPROCKET_BASE_URL="https://apiv2.shiprocket.in"
SHIPROCKET_PICKUP_LOCATION="Primary"
SHIPROCKET_PICKUP_POSTCODE="110001"
```

Optional:

```env
SHIPROCKET_TOKEN="existing-jwt-token"
```

Example request body for `POST /api/shipping/create`:

```json
{
  "orderId": "your-order-id",
  "weight": 0.8,
  "length": 12,
  "breadth": 10,
  "height": 6
}
```

The service loads the order, customer, items, and shipping address from the database, creates the Shiprocket order, assigns an AWB, stores the shipment in PostgreSQL, and returns clean JSON for your frontend.

---
## 💡 Features
- **Strict Data Validation**: Leveraging Prisma's type safety.
- **Efficient Image Handling**: Direct streaming to Supabase buckets.
- **RESTful Best Practices**: Clean URL structures and appropriate HTTP methods.
