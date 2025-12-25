# Frontend Pagination Migration Guide

## Quick Start

This guide shows you exactly how to update your frontend code to work with the new paginated APIs.

---

## What Changed?

Three APIs now return paginated responses:
- ✅ `GET /api/products`
- ✅ `GET /api/orders`
- ✅ `GET /api/bookings`

All other APIs remain unchanged (including dashboard APIs).

---

## Response Format

### Before (Old API)
```typescript
GET /api/products

Response: [
  { id: "1", title: "Product 1", code: "P001", ... },
  { id: "2", title: "Product 2", code: "P002", ... },
  ...
]
```

### After (New API)
```typescript
GET /api/products?page=1&limit=20

Response: {
  data: [
    { id: "1", title: "Product 1", code: "P001", ... },
    { id: "2", title: "Product 2", code: "P002", ... },
    ...
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNext: true,
    hasPrev: false
  }
}
```

---

## Step-by-Step Migration

### Step 1: Update API Client (One Time Setup)

Create a reusable API client utility:

```typescript
// utils/apiClient.ts

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

class API {
  private baseUrl = '/api';

  async getProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.includeDeleted) queryParams.set('includeDeleted', 'true');

    const response = await fetch(`${this.baseUrl}/products?${queryParams}`);
    return response.json();
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Order>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const response = await fetch(`${this.baseUrl}/orders?${queryParams}`);
    return response.json();
  }

  async getBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    productId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Booking>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.status) queryParams.set('status', params.status);
    if (params?.productId) queryParams.set('productId', params.productId);
    if (params?.search) queryParams.set('search', params.search);
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);

    const response = await fetch(`${this.baseUrl}/bookings?${queryParams}`);
    return response.json();
  }
}

export const api = new API();
```

---

### Step 2: Update React Components

#### Example 1: Simple Product List

**Before:**
```typescript
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**After:**
```typescript
import { api } from './utils/apiClient';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getProducts({ page: currentPage, limit: 20 })
      .then(response => {
        setProducts(response.data);
        setPagination(response.pagination);
        setLoading(false);
      });
  }, [currentPage]);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="product-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
```

---

#### Example 2: Order List with Filters

**Before:**
```typescript
function OrderList() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    fetch(`/api/orders?${params}`)
      .then(res => res.json())
      .then(setOrders);
  }, [status, search]);

  return (
    <div>
      <Filters onStatusChange={setStatus} onSearchChange={setSearch} />
      {orders.map(order => <OrderCard key={order.id} order={order} />)}
    </div>
  );
}
```

**After:**
```typescript
import { api } from './utils/apiClient';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getOrders({
      page: currentPage,
      limit: 20,
      status: status || undefined,
      search: search || undefined,
    })
      .then(response => {
        setOrders(response.data);
        setPagination(response.pagination);
      });
  }, [currentPage, status, search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, search]);

  return (
    <div>
      <Filters onStatusChange={setStatus} onSearchChange={setSearch} />
      
      <div className="order-list">
        {orders.map(order => <OrderCard key={order.id} order={order} />)}
      </div>

      {pagination && (
        <div className="pagination-info">
          Showing {orders.length} of {pagination.total} orders
        </div>
      )}

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
```

---

#### Example 3: Booking List with Search

**Before:**
```typescript
function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    setLoading(true);
    
    const params = new URLSearchParams();
    if (value) params.set('search', value);

    fetch(`/api/bookings?${params}`)
      .then(res => res.json())
      .then(data => {
        setBookings(data);
        setLoading(false);
      });
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      {loading ? <Spinner /> : (
        <div>
          {bookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**After:**
```typescript
import { api } from './utils/apiClient';

function BookingList() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getBookings({
      page: currentPage,
      limit: 20,
      search: search || undefined,
    })
      .then(response => {
        setBookings(response.data);
        setPagination(response.pagination);
        setLoading(false);
      });
  }, [currentPage, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      
      {loading ? <Spinner /> : (
        <>
          <div className="booking-list">
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <EmptyState message="No bookings found" />
            )}
          </div>

          {pagination && pagination.total > 0 && (
            <div className="pagination-wrapper">
              <div className="pagination-info">
                Page {pagination.page} of {pagination.totalPages} 
                ({pagination.total} total results)
              </div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

---

### Step 3: Create Pagination Component

```typescript
// components/Pagination.tsx

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
}: PaginationProps) {
  const pages = [];
  const maxPagesToShow = 5;
  
  // Calculate page range to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust start if we're near the end
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(1)}
        disabled={!hasPrev}
        className="pagination-button"
      >
        First
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
        className="pagination-button"
      >
        Previous
      </button>

      {startPage > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="pagination-page">
            1
          </button>
          {startPage > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`pagination-page ${page === currentPage ? 'active' : ''}`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="pagination-page"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        className="pagination-button"
      >
        Next
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={!hasNext}
        className="pagination-button"
      >
        Last
      </button>
    </div>
  );
}
```

**CSS Example:**
```css
.pagination {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin: 2rem 0;
}

.pagination-button,
.pagination-page {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.pagination-button:hover:not(:disabled),
.pagination-page:hover {
  background: #f5f5f5;
  border-color: #999;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-page.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.pagination-ellipsis {
  padding: 0.5rem;
  color: #999;
}

.pagination-info {
  text-align: center;
  margin: 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.pagination-wrapper {
  margin-top: 2rem;
}
```

---

## Default Values

If you don't provide pagination parameters:
- Default `page`: 1
- Default `limit`: 20
- Maximum `limit`: 100 (server enforced)

```typescript
// These are equivalent:
api.getProducts()
api.getProducts({ page: 1, limit: 20 })
```

---

## TypeScript Types

```typescript
// types/api.ts

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface Product {
  id: string;
  title: string;
  code: string;
  defaultRent: number;
  category?: {
    id: string;
    name: string;
  };
  // ... other fields
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  status: string;
  totalAmount: number;
  // ... other fields
}

export interface Booking {
  id: string;
  status: string;
  fromDateTime: string;
  toDateTime: string;
  decidedRent: number;
  // ... other fields
}
```

---

## Common Patterns

### Pattern 1: Infinite Scroll

```typescript
function InfiniteProductList() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    const response = await api.getProducts({ page, limit: 20 });
    
    setProducts(prev => [...prev, ...response.data]);
    setHasMore(response.pagination.hasNext);
    setPage(prev => prev + 1);
    setLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Pattern 2: Custom Page Size Selector

```typescript
function ProductListWithPageSize() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    api.getProducts({ page, limit })
      .then(response => {
        setProducts(response.data);
        setPagination(response.pagination);
      });
  }, [page, limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page
  };

  return (
    <div>
      <div className="page-size-selector">
        Show:
        {[10, 20, 50, 100].map(size => (
          <button
            key={size}
            onClick={() => handleLimitChange(size)}
            className={limit === size ? 'active' : ''}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="product-list">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

### Pattern 3: URL-based Pagination (with React Router)

```typescript
import { useSearchParams } from 'react-router-dom';

function ProductListWithURL() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  useEffect(() => {
    api.getProducts({ page, limit: 20, search: search || undefined })
      .then(response => {
        setProducts(response.data);
        setPagination(response.pagination);
      });
  }, [page, search]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), ...(search && { search }) });
  };

  const handleSearch = (value: string) => {
    setSearchParams({ page: '1', search: value });
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} initialValue={search} />
      <div className="product-list">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Products list loads with pagination
- [ ] Orders list loads with pagination
- [ ] Bookings list loads with pagination
- [ ] Pagination navigation works (next/prev)
- [ ] Page numbers are clickable
- [ ] Search resets to page 1
- [ ] Filters reset to page 1
- [ ] Page size selector works (if implemented)
- [ ] Loading states display correctly
- [ ] Empty states display when no results
- [ ] Pagination info displays correctly (X of Y results)
- [ ] URL updates with page changes (if using URL-based pagination)
- [ ] Dashboard APIs still work without pagination

---

## Performance Tips

1. **Debounce search inputs** to avoid excessive API calls
```typescript
const debouncedSearch = useDebounce(searchValue, 500);
```

2. **Show loading skeleton** instead of spinner for better UX
```typescript
{loading ? <ProductSkeleton count={20} /> : <ProductList />}
```

3. **Cache previous pages** for faster navigation
```typescript
const cache = useRef(new Map());
```

4. **Prefetch next page** for smoother experience
```typescript
useEffect(() => {
  if (pagination?.hasNext) {
    api.getProducts({ page: currentPage + 1, limit: 20 });
  }
}, [currentPage, pagination]);
```

---

## Common Issues & Solutions

### Issue 1: Page doesn't reset on filter change
**Solution:** Reset page to 1 when filters change
```typescript
useEffect(() => {
  setCurrentPage(1);
}, [status, search]);
```

### Issue 2: Total count doesn't match displayed items
**Solution:** Use `pagination.total`, not `data.length`
```typescript
<p>Total: {pagination.total} items</p>
```

### Issue 3: Blank page after pagination
**Solution:** Check if page exists, redirect to last page if not
```typescript
if (page > pagination.totalPages && pagination.totalPages > 0) {
  setCurrentPage(pagination.totalPages);
}
```

---

## Migration Effort Estimate

- Simple list (no filters): **15 minutes**
- List with filters: **30 minutes**
- List with search: **30 minutes**
- Complex table with sorting: **1 hour**
- Creating pagination component: **1 hour** (one-time)

Total for typical app (3-5 lists): **3-4 hours**

---

## Need Help?

1. Check server logs for API errors
2. Verify API response format in Network tab
3. Test API with Postman/cURL first
4. Review this guide's examples
5. Check browser console for errors

---

**Happy coding!** 🚀
