# Consumer Behavior Simulation Platform - Frontend

A modern React-based frontend for simulating and analyzing consumer behavior. Built with React, TypeScript, Tailwind CSS, and Recharts for rich data visualization.

## Features

- 🔐 **JWT Authentication** - Secure company user authentication
- 📊 **Interactive Dashboard** - Real-time metrics with charts and visualizations
- 📦 **Product Management** - Full CRUD operations with card-based UI
- 🧪 **Sandbox Preview** - AI-powered predictions before committing changes
- 📈 **Data Visualization** - Beautiful charts showing before/after comparisons
- 🎨 **Modern UI** - Professional design with Tailwind CSS and shadcn/ui components

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn)
│   ├── Navbar.tsx       # Main navigation
│   └── ProtectedRoute.tsx # Auth guard
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── pages/
│   ├── Login.tsx        # Authentication page
│   ├── Dashboard.tsx    # Main dashboard with metrics
│   ├── Products.tsx     # Product CRUD management
│   └── Sandbox.tsx      # Preview and simulation page
└── lib/
    └── utils.ts         # Utility functions
```

## API Documentation

All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Authentication

#### POST /api/auth/login
Login with company credentials.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string"
}
```

**Error Response:**
```json
{
  "error": "string",
  "message": "string"
}
```

---

### Dashboard

#### GET /api/dashboard
Fetch live dashboard metrics from committed simulations.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "sales": "number",
  "avgSatisfaction": "number",
  "avgLoyalty": "number",
  "comparisons": {
    "before": {
      "sales": "number",
      "satisfaction": "number",
      "loyalty": "number"
    },
    "after": {
      "sales": "number",
      "satisfaction": "number",
      "loyalty": "number"
    }
  }
}
```

**Data Types:**
- `sales`: number - Total sales count
- `avgSatisfaction`: number - Average satisfaction rating (0-5)
- `avgLoyalty`: number - Average loyalty score (0-5)

---

### Products

#### POST /api/products/add
Add a new product to the catalog.

**Request:**
```json
{
  "product_id": "string",
  "brand": "string",
  "price": "number",
  "quality": "number",
  "category": "string"
}
```

**Data Types:**
- `product_id`: string - Unique product identifier
- `brand`: string - Product brand name
- `price`: number - Product price in USD
- `quality`: number - Quality rating (0-10)
- `category`: string - Product category (e.g., "Electronics", "Clothing")

**Response:**
```json
{
  "success": "boolean"
}
```

**Note:** After successful addition, automatically redirects to Sandbox page.

---

#### PUT /api/products/update
Update an existing product.

**Request:**
```json
{
  "product_id": "string",
  "updates": {
    "brand": "string",
    "price": "number",
    "quality": "number",
    "category": "string"
  }
}
```

**Response:**
```json
{
  "success": "boolean"
}
```

**Note:** After successful update, automatically redirects to Sandbox page.

---

#### DELETE /api/products/remove
Remove a product from the catalog.

**Request:**
```json
{
  "product_id": "string"
}
```

**Response:**
```json
{
  "success": "boolean"
}
```

**Note:** After successful deletion, automatically redirects to Sandbox page.

---

### Sandbox

#### POST /api/sandbox/stage
Stage a change for simulation.

**Request:**
```json
{
  "change_type": "string",
  "details": {
    "product_id": "string",
    "field": "string",
    "oldValue": "any",
    "newValue": "any"
  }
}
```

**Data Types:**
- `change_type`: string - Type of change ("add", "update", "delete")
- `details`: object - Change details specific to the operation

**Response:**
```json
{
  "success": "boolean",
  "change_id": "string"
}
```

---

#### POST /api/sandbox/preview
Generate AI predictions for staged changes using Llama-3.

**Request:**
```json
{
  "change_id": "string"
}
```

**Response:**
```json
{
  "metrics": {
    "salesChange": "number",
    "loyaltyDiff": "number",
    "satisfactionDiff": "number",
    "beforeSales": "number",
    "afterSales": "number",
    "categoryComparisons": [
      {
        "category": "string",
        "beforeSales": "number",
        "afterSales": "number"
      }
    ]
  },
  "diffs": {
    "salesChange": "number",
    "loyaltyDiff": "number",
    "satisfactionDiff": "number"
  }
}
```

**Data Types:**
- `salesChange`: number - Change in total sales (can be negative)
- `loyaltyDiff`: number - Change in loyalty score (-5 to +5)
- `satisfactionDiff`: number - Change in satisfaction (-5 to +5)
- `beforeSales`: number - Sales before change
- `afterSales`: number - Predicted sales after change
- `categoryComparisons`: array - Sales comparison grouped by category

**Note:** Backend groups agents into batches for efficient processing.

---

#### POST /api/sandbox/commit
Commit staged changes to the live database.

**Request:**
```json
{
  "change_id": "string"
}
```

**Response:**
```json
{
  "success": "boolean"
}
```

**Note:** Updates live dashboard metrics. Redirects to Dashboard page on success.

---

#### POST /api/sandbox/discard
Discard staged changes without committing.

**Request:**
```json
{
  "change_id": "string"
}
```

**Response:**
```json
{
  "success": "boolean"
}
```

**Note:** Clears simulation data. Redirects to Dashboard page on success.

---

## Error Handling

All API errors are caught and logged to the console with the format:
```javascript
console.error('API error: ', error.response.data)
```

User-facing errors are displayed via toast notifications using the Sonner library.

## Authentication Flow

1. User enters credentials on `/login` page
2. JWT token received and stored in localStorage
3. Token included in Authorization header for all authenticated requests
4. Protected routes check for valid token before rendering
5. Logout clears token and redirects to login

## UI Features

### Dashboard
- Key metrics cards with trend indicators
- Line chart for sales trends
- Bar chart for satisfaction/loyalty by category
- Responsive grid layout

### Products Page
- Card-based product display
- Modal forms for add/edit operations
- Inline delete with confirmation
- Auto-redirect to Sandbox after CRUD operations

### Sandbox Page
- Before/after metric comparison cards
- Delta arrows showing positive/negative changes
- Category-wise sales impact chart
- Detailed analysis table
- Commit/Discard workflow buttons

## Design System

The application uses a professional color scheme defined in Tailwind config:

- **Primary (Blue)**: Main actions and branding
- **Accent (Teal)**: Positive metrics and highlights
- **Success (Green)**: Positive changes
- **Destructive (Red)**: Negative changes and deletions
- **Muted**: Secondary information

All colors use HSL format for consistency and are defined as CSS variables.

## Development Notes

- Mock data is used for development when API endpoints are not available
- All API calls include proper error handling and logging
- The UI is fully responsive and works on mobile devices
- Dark mode support is built into the design system
- Charts use the Recharts library for rich visualizations

## Future Enhancements

- Real-time updates using WebSockets
- Advanced filtering and search
- Export data to CSV/PDF
- Multi-language support
- A/B testing capabilities

---

Built with ❤️ using React, TypeScript, and Tailwind CSS
