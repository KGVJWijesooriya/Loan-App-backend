# Dashboard Controllers Structure

This folder contains modularized dashboard controllers, each handling specific dashboard functionalities.

## File Structure

```
controllers/dashboard/
├── index.js                    # Main export file for all dashboard controllers
├── overviewController.js       # Dashboard overview statistics
├── activitiesController.js     # Recent activities (loans, customers, repayments)
├── analyticsController.js      # Financial analytics and trends
├── customersController.js      # Top customers analysis
├── collectionController.js     # Collection summary and efficiency
├── overdueController.js        # Overdue loans management
├── serverTimeController.js     # Server time and timezone debugging
└── README.md                   # This documentation file
```

## Controllers Overview

### 1. **overviewController.js**

- **Route**: `GET /api/dashboard/overview`
- **Purpose**: Main dashboard statistics including customers, loans, and financial metrics
- **Features**:
  - Customer statistics (total, active, new)
  - Loan statistics (total, active, completed, overdue)
  - Financial statistics (loan amounts, repayments, collections)
  - Payment method and loan status distributions

### 2. **activitiesController.js**

- **Route**: `GET /api/dashboard/recent-activities`
- **Purpose**: Recent system activities
- **Features**:
  - Recent loan applications
  - Recent customer registrations
  - Recent repayments
  - Configurable limit via query parameter

### 3. **analyticsController.js**

- **Route**: `GET /api/dashboard/financial-analytics`
- **Purpose**: Financial analytics and trends
- **Features**:
  - Daily collections for specified periods
  - Daily loan disbursements
  - Monthly trends (last 12 months)
  - Risk analysis by loan status
  - Configurable period via query parameter

### 4. **customersController.js**

- **Route**: `GET /api/dashboard/top-customers`
- **Purpose**: Top customers analysis
- **Features**:
  - Sorting by total borrowed, total repaid, or loan count
  - Customer borrowing and repayment statistics
  - Repayment rate calculations
  - Configurable limit and sorting via query parameters

### 5. **collectionController.js**

- **Route**: `GET /api/dashboard/collection-summary`
- **Purpose**: Collection efficiency and summary
- **Features**:
  - Today's collections vs expected
  - Weekly and monthly collection summaries
  - Overdue collections analysis
  - Collection efficiency calculations
  - Sri Lanka timezone support
  - Debug query parameters for testing

### 6. **overdueController.js**

- **Route**: `GET /api/dashboard/overdue-loans`
- **Purpose**: Overdue loans management with pagination
- **Features**:
  - Paginated overdue loans list
  - Search functionality
  - Sorting options (due date, amount, customer name)
  - Summary statistics
  - Days overdue calculations

### 7. **serverTimeController.js**

- **Route**: `GET /api/dashboard/server-time`
- **Purpose**: Server time and timezone debugging
- **Features**:
  - Current server time in multiple formats
  - Sri Lanka timezone information
  - Timezone calculations for debugging
  - Useful for troubleshooting timezone-related issues

## Usage

### Main Dashboard Controller

The main `dashboardController.js` now imports all functions from the modular structure:

```javascript
const {
  getDashboardOverview,
  getRecentActivities,
  getFinancialAnalytics,
  getTopCustomers,
  getCollectionSummary,
  getOverdueLoans,
  getServerTime,
} = require("./dashboard");
```

### Individual Controller Usage

You can also import specific controllers directly:

```javascript
const { getDashboardOverview } = require("./dashboard/overviewController");
const { getCollectionSummary } = require("./dashboard/collectionController");
```

## Benefits of This Structure

1. **Modularity**: Each controller handles a specific dashboard feature
2. **Maintainability**: Easier to maintain and update individual features
3. **Reusability**: Controllers can be reused in different contexts
4. **Testing**: Individual controllers can be tested in isolation
5. **Collaboration**: Multiple developers can work on different dashboard features simultaneously
6. **Code Organization**: Related functionality is grouped together

## Common Dependencies

All controllers share these common dependencies:

- `asyncHandler` for error handling
- `Logger` for logging
- `getUserCurrency` for currency information
- Sri Lanka timezone utilities
- MongoDB models (Customer, Loan)

## Query Parameters

Most controllers support various query parameters for filtering and customization:

- `limit`: Number of results to return
- `page`: Page number for pagination
- `sortBy`: Sorting field
- `sortOrder`: Sort direction (asc/desc)
- `search`: Search term
- `period`: Time period for analytics
- `date`: Specific date for collections (debugging)

## Error Handling

All controllers use consistent error handling patterns:

- Try-catch blocks for all database operations
- Structured error responses
- Detailed logging for debugging
- Graceful fallbacks for optional data
