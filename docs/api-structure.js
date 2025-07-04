// Enhanced API structure with Reports endpoints
const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "POST /api/auth/login",
    register: "POST /api/auth/register",
    logout: "POST /api/auth/logout",
  },

  // Customers
  customers: {
    getAll: "GET /api/customers",
    getById: "GET /api/customers/:id",
    getByCustomerId: "GET /api/customers/by-customer-id/:customerId",
    getStats: "GET /api/customers/stats",
    create: "POST /api/customers",
    update: "PUT /api/customers/:id",
    delete: "DELETE /api/customers/:id",
  },

  // Loans
  loans: {
    getAll: "GET /api/loans",
    getById: "GET /api/loans/:id",
    getByCustomer: "GET /api/loans/customer/:customerId",
    create: "POST /api/loans",
    update: "PUT /api/loans/:id",
    delete: "DELETE /api/loans/:id",
    addPayment: "POST /api/loans/:id/payments",
    getPayments: "GET /api/loans/:id/payments",
  },

  // Users
  users: {
    getAll: "GET /api/users",
    getById: "GET /api/users/:id",
    getPreferences: "GET /api/users/preferences/options", // Get available languages and currencies
    updatePreferences: "PATCH /api/users/:id/preferences", // Update user language and currency
    create: "POST /api/users",
    update: "PUT /api/users/:id",
    delete: "DELETE /api/users/:id",
  },

  // Dashboard
  dashboard: {
    overview: "GET /api/dashboard/overview",
    analytics: "GET /api/dashboard/analytics",
    recentActivity: "GET /api/dashboard/recent-activity",
  },

  // 🆕 Reports (NEW FEATURE)
  reports: {
    // Comprehensive business report with all key metrics
    businessReport: {
      json: "GET /api/reports/business-report",
      pdf: "GET /api/reports/business-report?format=pdf",
      withDateRange:
        "GET /api/reports/business-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD",
    },

    // Customer-focused analytics and growth reports
    customerReport: {
      json: "GET /api/reports/customer-report",
      pdf: "GET /api/reports/customer-report?format=pdf",
      withDateRange:
        "GET /api/reports/customer-report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD",
    },

    // Loan performance and repayment analysis
    loanPerformance: {
      json: "GET /api/reports/loan-performance",
      pdf: "GET /api/reports/loan-performance?format=pdf",
      withDateRange:
        "GET /api/reports/loan-performance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD",
    },

    // Financial summaries, cash flow, and profitability
    financialSummary: {
      json: "GET /api/reports/financial-summary",
      pdf: "GET /api/reports/financial-summary?format=pdf",
      withDateRange:
        "GET /api/reports/financial-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD",
    },
  },

  // Health and System
  system: {
    health: "GET /health",
    info: "GET /",
  },
};

// Report Features Overview
const REPORT_FEATURES = {
  businessReport: {
    description: "Comprehensive business overview",
    includes: [
      "Customer statistics (total, active, new, inactive)",
      "Loan statistics (total, active, completed, overdue)",
      "Financial metrics (amounts, repayments, outstanding)",
      "Payment method distribution",
      "Loan status distribution",
      "Monthly trends analysis",
      "Overdue loan analysis",
      "Top 10 customers by loan amount",
    ],
    formats: ["JSON", "PDF"],
    authentication: "Required (JWT)",
    dateRange: "Configurable (defaults to last 30 days)",
  },

  customerReport: {
    description: "Customer-focused analytics",
    includes: [
      "Customer growth patterns",
      "Customer status distribution",
      "Monthly customer acquisition trends",
      "Customer retention metrics",
    ],
    formats: ["JSON", "PDF"],
    authentication: "Required (JWT)",
    dateRange: "Configurable (defaults to last 30 days)",
  },

  loanPerformanceReport: {
    description: "Loan portfolio analysis",
    includes: [
      "Loan performance metrics",
      "Average loan amounts",
      "Repayment rate analysis",
      "Monthly repayment trends",
      "Loan completion rates",
    ],
    formats: ["JSON", "PDF"],
    authentication: "Required (JWT)",
    dateRange: "Configurable (defaults to last 30 days)",
  },

  financialSummaryReport: {
    description: "Financial overview and profitability",
    includes: [
      "Cash flow analysis (inflow vs outflow)",
      "Interest revenue calculations",
      "Additional charges summary",
      "Profitability metrics",
      "Outstanding amounts analysis",
    ],
    formats: ["JSON", "PDF"],
    authentication: "Required (JWT)",
    dateRange: "Configurable (defaults to last 30 days)",
  },
};

// Usage Examples
const USAGE_EXAMPLES = {
  javascript: {
    // Get business report with JWT
    getBusinessReport: `
const response = await fetch('/api/reports/business-report', {
  headers: {
    'Authorization': 'Bearer ' + jwtToken,
    'Content-Type': 'application/json'
  }
});
const reportData = await response.json();
    `,

    // Download PDF report
    downloadPDF: `
const response = await fetch('/api/reports/business-report?format=pdf', {
  headers: {
    'Authorization': 'Bearer ' + jwtToken
  }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'business-report.pdf';
a.click();
    `,

    // Get report with date range
    getReportWithDateRange: `
const startDate = '2024-01-01';
const endDate = '2024-12-31';
const response = await fetch(
  \`/api/reports/customer-report?startDate=\${startDate}&endDate=\${endDate}\`,
  {
    headers: {
      'Authorization': 'Bearer ' + jwtToken,
      'Content-Type': 'application/json'
    }
  }
);
const reportData = await response.json();
    `,
  },

  curl: {
    // Get business report
    getBusinessReport: `
curl -X GET "http://localhost:5000/api/reports/business-report" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
    `,

    // Download PDF
    downloadPDF: `
curl -X GET "http://localhost:5000/api/reports/business-report?format=pdf" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  --output business-report.pdf
    `,

    // Get report with date range
    getReportWithDateRange: `
curl -X GET "http://localhost:5000/api/reports/financial-summary?startDate=2024-01-01&endDate=2024-12-31" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
    `,
  },
};

// Error Handling
const ERROR_RESPONSES = {
  authentication: {
    status: 401,
    response: {
      success: false,
      error: "Access denied. No token provided.",
    },
  },
  invalidToken: {
    status: 401,
    response: {
      success: false,
      error: "Invalid token.",
    },
  },
  serverError: {
    status: 500,
    response: {
      success: false,
      error: "Failed to generate report",
    },
  },
};

// Response Structure
const RESPONSE_STRUCTURE = {
  jsonReport: {
    success: true,
    data: {
      reportData: {
        // Report-specific data structure
      },
      dateRange: {
        start: "2024-01-01T00:00:00.000Z",
        end: "2024-01-31T23:59:59.999Z",
      },
      generatedAt: "2024-01-15T10:30:00.000Z",
    },
  },
  pdfReport: {
    contentType: "application/pdf",
    contentDisposition: 'attachment; filename="report-name-YYYY-MM-DD.pdf"',
    body: "PDF binary data",
  },
};

module.exports = {
  API_ENDPOINTS,
  REPORT_FEATURES,
  USAGE_EXAMPLES,
  ERROR_RESPONSES,
  RESPONSE_STRUCTURE,
};
