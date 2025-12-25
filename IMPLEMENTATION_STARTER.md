# Implementation Starter Guide - Phase 1

This guide provides step-by-step instructions with actual code to implement Phase 1 optimizations (no frontend changes required).

## Phase 1 Overview

✅ **No Frontend Changes Required**

We'll implement:
1. Configuration Management
2. Structured Logging (Winston)
3. Repository Pattern
4. Custom Error Classes
5. Dependency Injection basics

---

## Step 1: Install Dependencies

```bash
npm install winston
npm install --save-dev @types/winston
```

---

## Step 2: Create Config Module

Create `src/config/index.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

interface Config {
  app: {
    port: number;
    env: string;
    nodeEnv: string;
  };
  db: {
    uri: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  aws: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    s3Bucket?: string;
  };
}

function getConfig(): Config {
  const config: Config = {
    app: {
      port: parseInt(process.env.PORT || '4000', 10),
      env: process.env.NODE_ENV || 'development',
      nodeEnv: process.env.NODE_ENV || 'development',
    },
    db: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/4dcholi',
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || '',
      jwtExpiresIn: '8h',
    },
    aws: {
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      s3Bucket: process.env.AWS_S3_BUCKET,
    },
  };

  return config;
}

function validateConfig(config: Config): void {
  const errors: string[] = [];

  if (!config.auth.jwtSecret) {
    errors.push('JWT_SECRET is required');
  }

  if (!config.db.uri) {
    errors.push('MONGODB_URI is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

export const config = getConfig();
validateConfig(config);
```

---

## Step 3: Create Logger Module

Create `src/utils/logger.ts`:

```typescript
import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const logger = winston.createLogger({
  level: config.app.env === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
});

// Add file transports in production
if (config.app.env === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    })
  );
}

export { logger };
```

---

## Step 4: Create Custom Error Classes

Create `src/errors/AppError.ts`:

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any[];

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any[]
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

---

## Step 5: Create Repository Pattern

Create `src/repositories/BaseRepository.ts`:

```typescript
import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';
import { NotFoundError } from '../errors/AppError';

export abstract class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id);
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter);
  }

  async find(filter: FilterQuery<T> = {}): Promise<T[]> {
    return this.model.find(filter);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    
    if (!updated) {
      throw new NotFoundError(this.model.modelName);
    }
    
    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundError(this.model.modelName);
    }
  }

  async softDelete(id: string): Promise<T> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!updated) {
      throw new NotFoundError(this.model.modelName);
    }
    
    return updated;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
```

Create `src/repositories/ProductRepository.ts`:

```typescript
import { BaseRepository } from './BaseRepository';
import { Product, IProduct } from '../models/Product';
import { FilterQuery } from 'mongoose';

export interface ProductFilters {
  orgId: string;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
}

export class ProductRepository extends BaseRepository<IProduct> {
  constructor() {
    super(Product);
  }

  async findByOrgId(orgId: string, filters: Partial<ProductFilters> = {}): Promise<IProduct[]> {
    const query: FilterQuery<IProduct> = { orgId };

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    } else {
      query.isActive = { $ne: false };
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { code: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.categoryId) {
      query.categoryId = filters.categoryId;
    }

    return this.model
      .find(query)
      .populate('categoryId')
      .sort({ createdAt: -1 });
  }

  async findByCode(orgId: string, code: string): Promise<IProduct | null> {
    return this.model.findOne({
      orgId,
      code,
      isActive: { $ne: false },
    });
  }

  async findByIdAndOrg(id: string, orgId: string): Promise<IProduct | null> {
    return this.model
      .findOne({
        _id: id,
        orgId,
        isActive: { $ne: false },
      })
      .populate('categoryId');
  }
}
```

---

## Step 6: Update Product Model to Export Interface

Update `src/models/Product.ts`:

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  orgId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  code: string;
  categoryId?: mongoose.Types.ObjectId;
  defaultRent: number;
  color?: string;
  size?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    title: { type: String, required: true },
    description: String,
    code: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    defaultRent: { type: Number, required: true },
    color: String,
    size: String,
    imageUrl: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
```

---

## Step 7: Create DTOs

Create `src/dtos/ProductDTO.ts`:

```typescript
import { IProduct } from '../models/Product';

export interface CategoryDTO {
  id: string;
  name: string;
}

export interface ProductDTO {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  code: string;
  categoryId?: string;
  category?: CategoryDTO;
  defaultRent: number;
  color?: string;
  size?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class ProductMapper {
  static toDTO(product: IProduct): ProductDTO {
    const productObj = product.toObject();
    
    const dto: ProductDTO = {
      id: product._id.toString(),
      orgId: product.orgId.toString(),
      title: product.title,
      description: product.description,
      code: product.code,
      defaultRent: product.defaultRent,
      color: product.color,
      size: product.size,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    // Handle populated category
    if (productObj.categoryId && typeof productObj.categoryId === 'object') {
      dto.category = {
        id: productObj.categoryId._id.toString(),
        name: productObj.categoryId.name,
      };
      dto.categoryId = productObj.categoryId._id.toString();
    } else if (product.categoryId) {
      dto.categoryId = product.categoryId.toString();
    }

    return dto;
  }

  static toDTOs(products: IProduct[]): ProductDTO[] {
    return products.map(product => this.toDTO(product));
  }
}
```

---

## Step 8: Update Product Service

Update `src/services/product.service.ts`:

```typescript
import { ProductRepository } from '../repositories/ProductRepository';
import { ProductMapper, ProductDTO } from '../dtos/ProductDTO';
import { ConflictError, NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export interface CreateProductData {
  orgId: string;
  title: string;
  description?: string;
  code: string;
  categoryId?: string;
  defaultRent: number;
  color?: string;
  size?: string;
  imageUrl?: string;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  code?: string;
  categoryId?: string | null;
  defaultRent?: number;
  color?: string;
  size?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export class ProductService {
  constructor(private productRepository: ProductRepository) {}

  async listProducts(
    orgId: string,
    search?: string,
    includeDeleted?: boolean
  ): Promise<ProductDTO[]> {
    logger.debug('Listing products', { orgId, search, includeDeleted });

    const products = await this.productRepository.findByOrgId(orgId, {
      search,
      isActive: includeDeleted ? undefined : true,
    });

    logger.info('Products listed', { orgId, count: products.length });

    return ProductMapper.toDTOs(products);
  }

  async getProductById(id: string, orgId: string): Promise<ProductDTO> {
    logger.debug('Getting product by ID', { id, orgId });

    const product = await this.productRepository.findByIdAndOrg(id, orgId);
    
    if (!product) {
      logger.warn('Product not found', { id, orgId });
      throw new NotFoundError('Product');
    }

    return ProductMapper.toDTO(product);
  }

  async createProduct(data: CreateProductData): Promise<ProductDTO> {
    logger.debug('Creating product', { orgId: data.orgId, code: data.code });

    // Check if product code already exists
    const existing = await this.productRepository.findByCode(
      data.orgId,
      data.code
    );

    if (existing) {
      logger.warn('Product code already exists', { code: data.code });
      throw new ConflictError('Product code already exists');
    }

    const product = await this.productRepository.create(data);

    logger.info('Product created', { id: product._id.toString(), code: data.code });

    // Populate and return
    const populated = await this.productRepository.findByIdAndOrg(
      product._id.toString(),
      data.orgId
    );

    return ProductMapper.toDTO(populated!);
  }

  async updateProduct(
    id: string,
    orgId: string,
    data: UpdateProductData
  ): Promise<ProductDTO> {
    logger.debug('Updating product', { id, orgId });

    const product = await this.productRepository.findByIdAndOrg(id, orgId);
    
    if (!product) {
      logger.warn('Product not found for update', { id, orgId });
      throw new NotFoundError('Product');
    }

    // Check code uniqueness if code is being updated
    if (data.code && data.code !== product.code) {
      const existing = await this.productRepository.findByCode(orgId, data.code);
      if (existing && existing._id.toString() !== id) {
        logger.warn('Product code already exists', { code: data.code });
        throw new ConflictError('Product code already exists');
      }
    }

    const updated = await this.productRepository.update(id, data);

    logger.info('Product updated', { id, orgId });

    // Populate and return
    const populated = await this.productRepository.findByIdAndOrg(id, orgId);
    return ProductMapper.toDTO(populated!);
  }

  async deleteProduct(id: string, orgId: string): Promise<{ message: string }> {
    logger.debug('Deleting product', { id, orgId });

    const product = await this.productRepository.findByIdAndOrg(id, orgId);
    
    if (!product) {
      logger.warn('Product not found for deletion', { id, orgId });
      throw new NotFoundError('Product');
    }

    await this.productRepository.softDelete(id);

    logger.info('Product deleted', { id, orgId });

    return { message: 'Product deactivated' };
  }

  async restoreProduct(id: string, orgId: string): Promise<{ message: string }> {
    logger.debug('Restoring product', { id, orgId });

    const updated = await this.productRepository.update(id, { isActive: true });

    logger.info('Product restored', { id, orgId });

    return { message: 'Product restored' };
  }
}
```

---

## Step 9: Create Simple DI Container

Create `src/container/index.ts`:

```typescript
import { ProductRepository } from '../repositories/ProductRepository';
import { ProductService } from '../services/product.service';
// Import other repositories and services as needed

class Container {
  private instances = new Map<string, any>();

  // Repositories
  getProductRepository(): ProductRepository {
    if (!this.instances.has('ProductRepository')) {
      this.instances.set('ProductRepository', new ProductRepository());
    }
    return this.instances.get('ProductRepository');
  }

  // Services
  getProductService(): ProductService {
    if (!this.instances.has('ProductService')) {
      const productRepo = this.getProductRepository();
      this.instances.set('ProductService', new ProductService(productRepo));
    }
    return this.instances.get('ProductService');
  }

  // Add other services here...
}

export const container = new Container();
```

---

## Step 10: Update Product Controller

Update `src/controllers/product.controller.ts`:

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProductService } from '../services/product.service';
import { S3Service } from '../services/s3.service';
import { logger } from '../utils/logger';

export class ProductController {
  constructor(private productService: ProductService) {}

  async listProducts(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const search = req.query.search as string | undefined;
      const includeDeleted = req.query.includeDeleted === 'true';

      const products = await this.productService.listProducts(
        orgId,
        search,
        includeDeleted
      );

      res.json(products);
    } catch (error) {
      logger.error('List products error', { error });
      // Error will be caught by global error handler
      throw error;
    }
  }

  async getProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const product = await this.productService.getProductById(id, orgId);
      res.json(product);
    } catch (error) {
      logger.error('Get product error', { error, id: req.params.id });
      throw error;
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { title, description, code, categoryId, defaultRent, color, size } =
        req.body;
      const file = req.file;

      let imageUrl: string | undefined;

      if (file) {
        imageUrl = await S3Service.uploadFile(file, orgId, 'products');
      }

      const product = await this.productService.createProduct({
        orgId,
        title,
        description,
        code,
        categoryId,
        defaultRent,
        color,
        size,
        imageUrl,
      });

      res.status(201).json(product);
    } catch (error) {
      logger.error('Create product error', { error });
      throw error;
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;
      const {
        title,
        description,
        code,
        categoryId,
        defaultRent,
        color,
        size,
        isActive,
      } = req.body;
      const file = req.file;

      const existingProduct = await this.productService.getProductById(id, orgId);
      let imageUrl: string | undefined = existingProduct.imageUrl;

      if (file) {
        if (existingProduct.imageUrl) {
          await S3Service.deleteFile(existingProduct.imageUrl);
        }
        imageUrl = await S3Service.uploadFile(file, orgId, 'products');
      }

      const product = await this.productService.updateProduct(id, orgId, {
        title,
        description,
        code,
        categoryId,
        defaultRent,
        color,
        size,
        imageUrl,
        isActive,
      });

      res.json(product);
    } catch (error) {
      logger.error('Update product error', { error, id: req.params.id });
      throw error;
    }
  }

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const result = await this.productService.deleteProduct(id, orgId);
      res.json(result);
    } catch (error) {
      logger.error('Delete product error', { error, id: req.params.id });
      throw error;
    }
  }

  async restoreProduct(req: AuthRequest, res: Response) {
    try {
      const orgId = req.user!.orgId;
      const { id } = req.params;

      const result = await this.productService.restoreProduct(id, orgId);
      res.json(result);
    } catch (error) {
      logger.error('Restore product error', { error, id: req.params.id });
      throw error;
    }
  }
}
```

---

## Step 11: Update Product Routes

Update `src/routes/products.ts`:

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/product.validator';
import { ProductController } from '../controllers/product.controller';
import { upload } from '../middleware/upload';
import { container } from '../container';

const router = Router();

// Get controller from DI container
const productService = container.getProductService();
const productController = new ProductController(productService);

router.get('/', authMiddleware, (req, res) =>
  productController.listProducts(req, res)
);

router.get('/:id', authMiddleware, (req, res) =>
  productController.getProduct(req, res)
);

router.post(
  '/',
  authMiddleware,
  upload.single('image'),
  validate(createProductSchema),
  (req, res) => productController.createProduct(req, res)
);

router.put(
  '/:id',
  authMiddleware,
  upload.single('image'),
  validate(updateProductSchema),
  (req, res) => productController.updateProduct(req, res)
);

router.delete('/:id', authMiddleware, (req, res) =>
  productController.deleteProduct(req, res)
);

router.post('/:id/restore', authMiddleware, (req, res) =>
  productController.restoreProduct(req, res)
);

export default router;
```

---

## Step 12: Update server.ts

Update `src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './utils/logger';

// Import models
import './models/Organization';
import './models/User';
import './models/Category';
import './models/Product';
import './models/Order';
import './models/Booking';

// Import routes
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import bookingRoutes from './routes/bookings';
import dashboardRoutes from './routes/dashboard';
import publicRoutes from './routes/public';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose
  .connect(config.db.uri)
  .then(() => {
    logger.info('Connected to MongoDB', { uri: config.db.uri });
  })
  .catch((err) => {
    logger.error('MongoDB connection error', { error: err.message });
    process.exit(1);
  });

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes);

// Start server
app.listen(config.app.port, () => {
  logger.info(`Backend server listening on port ${config.app.port}`, {
    env: config.app.env,
  });
});
```

---

## Step 13: Update Auth Middleware

Update `src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../errors/AppError';

interface JwtPayload {
  userId: string;
  orgId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(err);
    }
  }
};
```

---

## Step 14: Create logs Directory

```bash
mkdir logs
echo "logs/" >> .gitignore
```

---

## Step 15: Test Phase 1 Implementation

Build and run:

```bash
npm run build
npm start
```

Or in development:

```bash
npm run dev
```

Check logs - you should see structured Winston logs instead of console.log:

```
2025-12-25 10:00:00 [info]: Connected to MongoDB {"uri":"mongodb://localhost:27017/4dcholi"}
2025-12-25 10:00:00 [info]: Backend server listening on port 4000 {"env":"development"}
```

Test API endpoints - they should work exactly as before, but now with:
✅ Structured logging
✅ Better error messages
✅ Cleaner code organization
✅ Repository pattern
✅ DTOs

---

## Verification Checklist

- [ ] Server starts without errors
- [ ] MongoDB connects successfully
- [ ] Logs are structured and informative
- [ ] GET /api/products returns product list
- [ ] POST /api/products creates new product
- [ ] Error messages are clear and structured
- [ ] No frontend changes needed
- [ ] All existing functionality works

---

## Next Steps

After Phase 1 is stable:
1. Apply same pattern to other services (Auth, Order, Booking, etc.)
2. Add global error handler (Phase 2)
3. Standardize API responses (Phase 2)
4. Coordinate frontend updates (Phase 2-3)

---

## Common Issues and Solutions

### Issue: "Cannot find module winston"
**Solution**: Run `npm install winston`

### Issue: "JWT_SECRET is required"
**Solution**: Add JWT_SECRET to your .env file

### Issue: TypeScript errors about IProduct
**Solution**: Ensure all models export their interfaces

### Issue: Circular dependencies
**Solution**: Use lazy loading in container or restructure imports

### Issue: Tests failing
**Solution**: Update mocks to match new service signatures with DI

---

This completes Phase 1! Your backend is now significantly cleaner and more maintainable, with no frontend changes required.
