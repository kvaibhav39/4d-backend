# Frontend Migration Guide

This guide shows exactly what needs to change in your frontend code when we implement backend optimizations.

## Table of Contents
1. [Response Format Changes](#response-format-changes)
2. [Error Handling Updates](#error-handling-updates)
3. [Pagination Implementation](#pagination-implementation)
4. [Date Handling](#date-handling)
5. [API Client Updates](#api-client-updates)

---

## 1. Response Format Changes

### Before Optimization
```typescript
// Current API response (direct data)
{
  "id": "123",
  "title": "Product A",
  "code": "P001"
}
```

### After Optimization
```typescript
// New standardized response
{
  "success": true,
  "data": {
    "id": "123",
    "title": "Product A",
    "code": "P001"
  },
  "message": "Product retrieved successfully",
  "timestamp": "2025-12-25T10:00:00Z"
}
```

### Frontend Code Changes

#### BEFORE:
```typescript
// Fetching products
async function fetchProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const products = await response.json();
  return products;
}

// Fetching single product
async function fetchProduct(id: string) {
  const response = await fetch(`/api/products/${id}`);
  const product = await response.json();
  return product;
}

// Creating product
async function createProduct(data: ProductInput) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const newProduct = await response.json();
  return newProduct;
}
```

#### AFTER:
```typescript
// Fetching products
async function fetchProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const { data: products } = await response.json();
  return products;
}

// Fetching single product
async function fetchProduct(id: string) {
  const response = await fetch(`/api/products/${id}`);
  const { data: product } = await response.json();
  return product;
}

// Creating product
async function createProduct(data: ProductInput) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const { data: newProduct } = await response.json();
  return newProduct;
}
```

### Recommended: Create API Client Utility

```typescript
// utils/apiClient.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  message?: string;
  timestamp: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(
        result.error?.message || 'An error occurred',
        response.status,
        result.error?.code,
        result.error?.details
      );
    }

    return result.data!;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

// Usage:
const products = await apiClient.get<Product[]>('/products');
const product = await apiClient.post<Product>('/products', { title: 'New Product' });
```

---

## 2. Error Handling Updates

### Before Optimization
```typescript
// Current error response
{
  "message": "Product not found"
}
```

### After Optimization
```typescript
// New standardized error response
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": []
  },
  "timestamp": "2025-12-25T10:00:00Z"
}
```

### Frontend Code Changes

#### Create Error Class:
```typescript
// utils/ApiError.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

#### BEFORE:
```typescript
try {
  await createProduct(data);
  showNotification('Product created successfully', 'success');
} catch (error) {
  showNotification(error.message || 'Failed to create product', 'error');
}
```

#### AFTER:
```typescript
// utils/errorHandler.ts
export function handleApiError(error: ApiError) {
  // Handle specific error codes
  switch (error.code) {
    case 'PRODUCT_NOT_FOUND':
      showNotification('Product not found', 'warning');
      break;
    case 'PRODUCT_CODE_EXISTS':
      showNotification('A product with this code already exists', 'error');
      break;
    case 'VALIDATION_ERROR':
      if (error.details && error.details.length > 0) {
        // Show validation errors in form
        showValidationErrors(error.details);
      } else {
        showNotification(error.message, 'error');
      }
      break;
    case 'UNAUTHORIZED':
      showNotification('Please log in again', 'warning');
      redirectToLogin();
      break;
    case 'FORBIDDEN':
      showNotification('You do not have permission to perform this action', 'error');
      break;
    case 'RATE_LIMIT_EXCEEDED':
      showNotification('Too many requests. Please try again later.', 'warning');
      break;
    default:
      showNotification(error.message || 'An error occurred', 'error');
  }
}

// Usage:
try {
  await createProduct(data);
  showNotification('Product created successfully', 'success');
} catch (error) {
  if (error instanceof ApiError) {
    handleApiError(error);
  } else {
    showNotification('An unexpected error occurred', 'error');
  }
}
```

#### Validation Error Display:
```typescript
// utils/validationHelper.ts
interface ValidationError {
  field: string;
  message: string;
}

export function showValidationErrors(errors: ValidationError[]) {
  const errorMap = new Map<string, string>();
  errors.forEach(err => {
    errorMap.set(err.field, err.message);
  });
  
  // Update form field errors
  return errorMap;
}

// In React component:
function ProductForm() {
  const [fieldErrors, setFieldErrors] = useState<Map<string, string>>(new Map());

  const handleSubmit = async (data: ProductInput) => {
    try {
      setFieldErrors(new Map()); // Clear previous errors
      await createProduct(data);
      showNotification('Product created', 'success');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const errors = showValidationErrors(error.details || []);
        setFieldErrors(errors);
      } else {
        handleApiError(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" />
      {fieldErrors.has('title') && (
        <span className="error">{fieldErrors.get('title')}</span>
      )}
      {/* ... */}
    </form>
  );
}
```

---

## 3. Pagination Implementation

### Before Optimization
```typescript
// No pagination - returns all products
GET /api/products
Response: [ { id: 1 }, { id: 2 }, ... ]
```

### After Optimization
```typescript
// Paginated endpoint
GET /api/products?page=1&limit=20
Response: {
  "success": true,
  "data": [ { id: 1 }, { id: 2 }, ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Frontend Code Changes

#### BEFORE:
```typescript
function ProductList() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### AFTER:
```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API function
async function fetchProducts(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<PaginatedResponse<Product>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });
  
  const response = await fetch(`/api/products?${params}`);
  const { data, pagination } = await response.json();
  return { data, pagination };
}

// Component
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);

  const loadProducts = async (page: number) => {
    setLoading(true);
    try {
      const result = await fetchProducts(page, 20);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    loadProducts(newPage);
  };

  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <div>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

// Pagination component
function Pagination({ currentPage, totalPages, hasNext, hasPrev, onPageChange }) {
  return (
    <div className="pagination">
      <button
        disabled={!hasPrev}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      
      <span>
        Page {currentPage} of {totalPages}
      </span>
      
      <button
        disabled={!hasNext}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

---

## 4. Date Handling

### Change
Dates will be consistently returned as ISO 8601 strings.

### Frontend Code Changes

#### BEFORE (might receive various formats):
```typescript
const product = await fetchProduct(id);
const date = new Date(product.createdAt); // May fail with inconsistent formats
```

#### AFTER (consistent ISO strings):
```typescript
// utils/dateHelpers.ts
export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString();
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString();
}

export function getRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// Usage in component:
function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.title}</h3>
      <p>Created: {formatDate(product.createdAt)}</p>
      <p>Updated: {getRelativeTime(product.updatedAt)}</p>
    </div>
  );
}
```

---

## 5. API Client Updates

### Complete API Client with Auth

```typescript
// utils/apiClient.ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ApiClient {
  private baseURL: string;
  private authToken: string | null = null;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    // Load token from localStorage on init
    this.authToken = localStorage.getItem('authToken');
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('authToken', token);
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<{ data: T; pagination?: any }> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      // Handle unauthorized - clear token and redirect
      if (response.status === 401) {
        this.clearAuthToken();
        window.location.href = '/login';
      }

      throw new ApiError(
        result.error?.message || 'An error occurred',
        response.status,
        result.error?.code,
        result.error?.details
      );
    }

    return {
      data: result.data!,
      pagination: result.pagination,
    };
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<{ data: T; pagination?: any }> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(endpoint + queryString);
  }

  async post<T>(endpoint: string, data: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      throw new ApiError(
        result.error?.message || 'Upload failed',
        response.status,
        result.error?.code,
        result.error?.details
      );
    }

    return { data: result.data! };
  }
}

export const apiClient = new ApiClient();
export { ApiError };

// API service functions
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: User }>('/auth/login', { email, password }),
  
  getCurrentUser: () =>
    apiClient.get<User>('/auth/me'),
};

export const productApi = {
  list: (page?: number, limit?: number, search?: string) =>
    apiClient.get<Product[]>('/products', {
      ...(page && { page: page.toString() }),
      ...(limit && { limit: limit.toString() }),
      ...(search && { search }),
    }),
  
  get: (id: string) =>
    apiClient.get<Product>(`/products/${id}`),
  
  create: (data: ProductInput) =>
    apiClient.post<Product>('/products', data),
  
  update: (id: string, data: Partial<ProductInput>) =>
    apiClient.put<Product>(`/products/${id}`, data),
  
  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/products/${id}`),
    
  uploadImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.upload<Product>(`/products/${id}/image`, formData);
  },
};
```

---

## Migration Checklist

### Phase 1: Preparation
- [ ] Review OPTIMIZATION_PLAN.md
- [ ] Identify which endpoints will change
- [ ] Create feature branch for frontend updates
- [ ] Install any new dependencies (if needed)

### Phase 2: Core Updates
- [ ] Create ApiClient utility
- [ ] Create ApiError class
- [ ] Create error handler utility
- [ ] Update all API calls to use new ApiClient
- [ ] Test authentication flow

### Phase 3: Response Handling
- [ ] Update all API calls to unwrap `data` property
- [ ] Implement error handling with error codes
- [ ] Add pagination support to list views
- [ ] Update date formatting utilities

### Phase 4: Testing
- [ ] Test all CRUD operations
- [ ] Test error scenarios
- [ ] Test pagination
- [ ] Test authentication/authorization
- [ ] Test file uploads

### Phase 5: Polish
- [ ] Add loading states
- [ ] Add retry logic for failed requests
- [ ] Add optimistic UI updates
- [ ] Add request caching (if needed)

---

## Backward Compatibility Strategy

If you need to maintain compatibility with old API while migrating:

```typescript
// Feature flag for new API format
const USE_NEW_API = process.env.REACT_APP_USE_NEW_API === 'true';

async function fetchProducts() {
  const response = await fetch('/api/products');
  const json = await response.json();
  
  // Handle both old and new formats
  if (USE_NEW_API) {
    return json.data; // New format
  } else {
    return json; // Old format
  }
}
```

---

## Questions or Issues?

If you encounter issues during migration:

1. Check the backend API documentation
2. Use browser DevTools Network tab to inspect actual responses
3. Check error codes and messages
4. Verify authentication tokens
5. Test with Postman/cURL first to isolate frontend issues
