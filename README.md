# Daily Loan Management System - Backend API

A robust, scalable, and secure backend API for managing daily loans and customers using Node.js, Express, MongoDB, and Socket.IO.

## 🛠 Tech Stack

- **Node.js** + **Express.js** - REST API framework
- **MongoDB** + **Mongoose** - Database and ODM
- **Socket.IO** - Real-time WebSocket communication
- **dotenv** - Environment variable management
- **CORS, Helmet, Compression, Morgan** - Security and performance middleware
- **Joi** - Data validation
- **node-cron** - Scheduled tasks

## 🏗 Project Structure

```
server/
├── config/              # MongoDB connection, env setup
│   ├── database.js      # Database connection
│   └── config.js        # Environment configuration
├── controllers/         # Request handlers
│   ├── customerController.js
│   └── loanController.js
├── models/              # Mongoose schemas
│   ├── Customer.js      # Customer model
│   └── Loan.js          # Loan model
├── routes/              # Route definitions
│   ├── customers.js     # Customer routes
│   └── loans.js         # Loan routes
├── sockets/             # Socket.IO setup
│   └── socketHandler.js # WebSocket event handling
├── middleware/          # Custom middleware
│   ├── errorHandler.js  # Global error handler
│   ├── asyncHandler.js  # Async error wrapper
│   └── validation.js    # Input validation schemas
├── utils/               # Helper functions
│   ├── dateUtils.js     # Date manipulation utilities
│   ├── logger.js        # Logging utility
│   └── queryHelpers.js  # Database query helpers
├── app.js               # Express app setup
├── server.js            # HTTP + WebSocket entry point
└── package.json         # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/daily-loan-management
CORS_ORIGIN=http://localhost:3000
SOCKET_CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-here
LOG_LEVEL=info
```

4. Start the server:

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Customers

| Method | Endpoint               | Description                                         |
| ------ | ---------------------- | --------------------------------------------------- |
| GET    | `/api/customers`       | Get all customers (with pagination, search, filter) |
| GET    | `/api/customers/:id`   | Get single customer with loans                      |
| POST   | `/api/customers`       | Create new customer                                 |
| PUT    | `/api/customers/:id`   | Update customer                                     |
| DELETE | `/api/customers/:id`   | Delete customer                                     |
| GET    | `/api/customers/stats` | Get customer statistics                             |

### Loans

| Method | Endpoint                  | Description                                     |
| ------ | ------------------------- | ----------------------------------------------- |
| GET    | `/api/loans`              | Get all loans (with pagination, search, filter) |
| GET    | `/api/loans/:id`          | Get single loan details                         |
| POST   | `/api/loans`              | Create new loan                                 |
| PUT    | `/api/loans/:id`          | Update loan                                     |
| DELETE | `/api/loans/:id`          | Delete loan                                     |
| POST   | `/api/loans/:id/payments` | Add payment to loan                             |
| GET    | `/api/loans/stats`        | Get loan statistics                             |
| GET    | `/api/loans/overdue`      | Get overdue loans                               |

### Query Parameters

**Pagination:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Search & Filter:**

- `search` - Text search in relevant fields
- `status` - Filter by status
- `startDate` - Filter by creation date (start)
- `endDate` - Filter by creation date (end)
- `customer` - Filter loans by customer ID

**Sorting:**

- `sortBy` - Field to sort by
- `sortOrder` - asc or desc

## 🔌 WebSocket Events

### Server → Client Events

- `customer-created` - New customer created
- `customer-updated` - Customer updated
- `customer-deleted` - Customer deleted
- `loan-created` - New loan created
- `loan-updated` - Loan updated
- `loan-deleted` - Loan deleted
- `payment-added` - Payment added to loan
- `overdue-loans-updated` - Scheduled overdue loan status update

### Client → Server Events

- `join-room` - Join a specific room
- `leave-room` - Leave a specific room
- `request-stats` - Request real-time statistics
- `loan-status-change` - Notify loan status change
- `payment-notification` - Notify payment received

## 📊 Data Models

### Customer Schema

```javascript
{
  fullName: String (required, max: 100),
  nic: String (required, unique, pattern: /^\d{9}[VX]$|^\d{12}$/),
  phone: String (required, pattern: /^\+?[\d\s-()]{10,15}$/),
  address: String (optional, max: 500),
  email: String (optional, email format),
  status: Enum ['active', 'inactive'] (default: 'active'),
  createdAt: Date,
  updatedAt: Date
}
```

### Loan Schema

```javascript
{
  customer: ObjectId (ref: Customer, required),
  amount: Number (required, min: 1, max: 10,000,000),
  dailyPayment: Number (required, min: 1),
  issueDate: Date (default: now),
  dueDate: Date (required),
  status: Enum ['active', 'completed', 'overdue', 'defaulted'] (default: 'active'),
  interestRate: Number (min: 0, max: 100, default: 0),
  totalAmount: Number (calculated),
  paidAmount: Number (default: 0),
  remainingAmount: Number (calculated),
  notes: String (max: 1000),
  paymentHistory: [{
    date: Date,
    amount: Number,
    method: Enum ['cash', 'bank_transfer', 'check', 'online'],
    notes: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🛡 Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input Validation** - Joi schema validation
- **Error Handling** - Global error middleware
- **Rate Limiting** - Can be added for production
- **Authentication** - Ready for JWT implementation

## ⚡ Performance Features

- **Compression** - Response compression
- **Database Indexing** - Optimized queries
- **Pagination** - Large dataset handling
- **Aggregation** - Efficient statistics calculation
- **Connection Pooling** - MongoDB connection optimization

## 🔄 Scheduled Tasks

- **Daily Overdue Check** - Runs at midnight to update overdue loans
- **Payment Reminders** - Can be extended for notifications

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 API Documentation

Access the API documentation:

- Health check: `GET /health`
- API overview: `GET /`

## 🐳 Docker Support (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Environment Variables

| Variable             | Description               | Default                                         |
| -------------------- | ------------------------- | ----------------------------------------------- |
| `NODE_ENV`           | Environment mode          | development                                     |
| `PORT`               | Server port               | 5000                                            |
| `MONGO_URI`          | MongoDB connection string | mongodb://localhost:27017/daily-loan-management |
| `CORS_ORIGIN`        | CORS allowed origin       | http://localhost:3000                           |
| `SOCKET_CORS_ORIGIN` | Socket.IO CORS origin     | http://localhost:3000                           |
| `JWT_SECRET`         | JWT secret key            | -                                               |
| `LOG_LEVEL`          | Logging level             | info                                            |

## 📈 Monitoring & Logging

- **Morgan** - HTTP request logging
- **Custom Logger** - Application-level logging
- **Error Tracking** - Comprehensive error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
