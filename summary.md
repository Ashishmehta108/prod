# Factory Inventory Desktop Application

## Project Overview

A desktop inventory management application built with Electron, designed for factory inventory tracking and management. The application provides a modern, responsive interface for managing products, stock movements, and monitoring inventory levels.

## Technology Stack

### Frontend
- **Electron** - Desktop application framework
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Iconsax React** - Icon library
- **Lucide React** - Additional icons
- **Axios** - HTTP client

### Backend
- **Express.js** - REST API server
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Prisma** - Database toolkit (schema defined)
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development Tools
- **TypeScript** - Type checking
- **ESBuild** - Fast bundler for Electron main process
- **ts-node-dev** - Development server with hot reload
- **Concurrently** - Run multiple scripts simultaneously

## Project Structure

```
electron-next-auth/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Window management
│   │   └── preload.ts     # Preload script
│   ├── renderer/          # React frontend
│   │   ├── api/           # API client configuration
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript type definitions
│   │   └── App.tsx        # Main app component
│   └── server/            # Express backend
│       ├── middleware/    # Auth & RBAC middleware
│       ├── models/        # Mongoose models
│       ├── routes/        # API route handlers
│       └── index.ts       # Server entry point
├── prisma/
│   └── schema.prisma      # Database schema
└── dist/                  # Build output
```

## Core Features

### 1. Authentication & Authorization
- User registration and login
- JWT-based authentication (7-day token expiration)
- Role-based access control (Admin/User roles)
- Protected API routes with authentication middleware
- Admin-only route protection

### 2. Product Management
- Create and manage products
- Product attributes: name, category, unit, minimum stock level
- Real-time stock calculation (Stock In - Stock Out)
- Product search functionality
- Product listing with current stock levels

### 3. Stock Management
- **Stock In**: Record incoming inventory
  - Track supplier information
  - Invoice number tracking
  - Location tracking
  - Date/time stamps
- **Stock Out**: Record outgoing inventory
  - Department tracking
  - Issued by tracking
  - Purpose tracking
  - Date/time stamps

### 4. Dashboard
- Overview of total products
- Low stock alerts (products below minimum stock level)
- Product summaries with current stock levels
- Visual indicators for stock status

### 5. Additional Features
- **Weight/Label Workflow**: Specialized workflow screen for weight-based operations
- **Search Context**: Global search functionality across the application
- **Shimmer Loading**: Skeleton loading states for better UX
- **Paginated Stock Display**: Efficient handling of large stock lists

## Database Schema

### Models (Prisma/MongoDB)

1. **Product**
   - `id`: ObjectId (auto-generated)
   - `name`: String (required)
   - `category`: String (optional)
   - `unit`: String (required)
   - `minStock`: Integer (default: 0)

2. **StockIn**
   - `id`: ObjectId (auto-generated)
   - `productId`: ObjectId (reference to Product)
   - `quantity`: Integer
   - `supplier`: String (optional)
   - `invoiceNo`: String (optional)
   - `location`: String (optional)
   - `date`: DateTime (default: now)

3. **StockOut**
   - `id`: ObjectId (auto-generated)
   - `productId`: ObjectId (reference to Product)
   - `quantity`: Integer
   - `department`: String (optional)
   - `issuedBy`: String (optional)
   - `purpose`: String (optional)
   - `date`: DateTime (default: now)

4. **User** (Mongoose model)
   - `username`: String (unique, required)
   - `email`: String (unique, required)
   - `password`: String (hashed with bcrypt)
   - `role`: Enum ["admin", "user"] (default: "user")
   - `timestamps`: Created/Updated dates

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Products (`/api/products`)
- `GET /api/products` - Get all products with current stock
- `POST /api/products` - Create new product
- `GET /api/products/search?q=term` - Search products

### Stock In (`/api/stock-in`)
- Routes for managing incoming stock

### Stock Out (`/api/stock-out`)
- Routes for managing outgoing stock

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` - Get dashboard statistics and summaries

### Health Check
- `GET /api/health` - Server health status

## Application Pages

1. **Login** - User authentication
2. **Dashboard** - Overview and statistics
3. **Products** - Product management
4. **Stock In** - Record incoming inventory
5. **Stock Out** - Record outgoing inventory
6. **Weight** - Label workflow screen

## Development Workflow

### Development Mode
```bash
npm run dev
```
Runs all processes concurrently:
- Electron main process (with watch mode)
- Vite dev server for renderer (port 5173)
- Express API server (port 4000)
- Electron app launcher

### Build Process
```bash
npm run build
```
Builds both renderer and main processes for production.

## Environment Variables

Required environment variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - API server port (default: 4000)

## Key Design Patterns

- **Context API**: Authentication and Search contexts for global state
- **Component Composition**: Reusable components (Card, Layout, Sidebar, Topbar)
- **Middleware Pattern**: Authentication and authorization middleware
- **RESTful API**: Standard REST endpoints for CRUD operations
- **Aggregation Queries**: MongoDB aggregation for stock calculations

## UI/UX Features

- Modern dark theme (slate background: #020617)
- Responsive design with Tailwind CSS
- Loading states with shimmer effects
- Ripple effects on interactive elements
- Smooth animations with Framer Motion
- Icon-based navigation
- Pagination for large datasets

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Protected API routes
- Role-based access control (RBAC)
- CORS configuration for API security

## Current Status

The application is a functional inventory management system with:
- ✅ User authentication and authorization
- ✅ Product CRUD operations
- ✅ Stock tracking (in/out)
- ✅ Dashboard with statistics
- ✅ Search functionality
- ✅ Modern UI with loading states
- 🔄 RBAC middleware file exists but may need implementation
- 🔄 Some routes may have authentication disabled (commented code present)

## Future Enhancements

Potential areas for improvement:
- Complete RBAC implementation across all routes
- Product update and delete endpoints
- Advanced reporting and analytics
- Export functionality (CSV, PDF)
- Barcode scanning integration
- Multi-location inventory tracking
- Audit logs for stock movements
- Email notifications for low stock alerts

