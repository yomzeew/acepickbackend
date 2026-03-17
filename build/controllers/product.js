"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductTransactionById = exports.deleteProduct = exports.updateProduct = exports.addProduct = exports.selectProduct = exports.restockProduct = exports.soldProducts = exports.boughtProducts = exports.getMyProducts = exports.getProduct = exports.getProducts = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const library_1 = require("@prisma/client/runtime/library");
const modules_1 = require("../utils/modules");
const query_1 = require("../validation/query");
const body_1 = require("../validation/body");
const userProfileSelect = {
    id: true,
    email: true,
    phone: true,
    status: true,
    role: true,
    agreed: true,
    createdAt: true,
    updatedAt: true,
    profile: {
        select: { id: true, avatar: true, firstName: true, lastName: true }
    }
};
const parseImages = (product) => {
    if (!product)
        return product;
    // Handle images field safely
    let images = [];
    if (product.images) {
        if (Array.isArray(product.images)) {
            images = product.images;
        }
        else if (typeof product.images === 'string') {
            // Try to parse as JSON, if fails, treat as single URL
            try {
                const parsed = JSON.parse(product.images);
                images = Array.isArray(parsed) ? parsed : [parsed];
            }
            catch (_a) {
                // It's not JSON, treat as single URL string
                images = [product.images];
            }
        }
    }
    return Object.assign(Object.assign({}, product), { images });
};
const getProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = query_1.getProductSchema.safeParse(req.query);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }
    const { categoryId, category, search, state, lga, locationId, page, limit, orderBy, orderDir, minPrice, maxPrice } = result.data;
    try {
        const products = yield prisma_1.default.product.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ approved: true }, (categoryId && { categoryId: Number(categoryId) })), (search && { name: { contains: search, mode: 'insensitive' } })), (locationId && { locationId: Number(locationId) })), (category && {
                category: { name: { contains: category, mode: 'insensitive' } }
            })), ((minPrice !== undefined || maxPrice !== undefined) && {
                price: Object.assign(Object.assign({}, (minPrice !== undefined && { gte: minPrice })), (maxPrice !== undefined && { lte: maxPrice }))
            })), (state || lga ? {
                pickupLocation: Object.assign(Object.assign({}, (state && { state: { contains: state, mode: 'insensitive' } })), (lga && { lga: { contains: lga, mode: 'insensitive' } }))
            } : undefined)),
            take: limit,
            skip: (page - 1) * limit,
            include: {
                category: { select: { id: true, name: true, description: true } },
                pickupLocation: true,
            },
            orderBy: { [orderBy || 'createdAt']: (orderDir || 'desc').toLowerCase() },
        });
        return (0, modules_1.successResponse)(res, 'success', products.map(parseImages));
    }
    catch (error) {
        console.error('Error in getProducts:', error);
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve products');
    }
});
exports.getProducts = getProducts;
const getProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const product = yield prisma_1.default.product.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                pickupLocation: true,
                user: {
                    select: userProfileSelect
                }
            }
        });
        if (!product) {
            return (0, modules_1.errorResponse)(res, 'error', 'Product not found');
        }
        return (0, modules_1.successResponse)(res, 'success', parseImages(product));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve product');
    }
});
exports.getProduct = getProduct;
const getMyProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    console.log("id", id);
    try {
        const products = yield prisma_1.default.product.findMany({
            where: { userId: id },
            include: {
                category: { select: { id: true, name: true, description: true } },
                pickupLocation: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', products.map(parseImages));
    }
    catch (error) {
        console.error('Error in getProducts:', error);
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve products');
    }
});
exports.getMyProducts = getMyProducts;
const boughtProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    try {
        const result = query_1.boughtProductSchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }
        const { status } = result.data;
        const productsTrans = yield prisma_1.default.productTransaction.findMany({
            where: Object.assign({ buyerId: id }, ((status && status !== 'all') ? { status: status } : {})),
            include: {
                product: true,
                order: {
                    include: {
                        rider: {
                            select: userProfileSelect
                        },
                    }
                },
                seller: {
                    select: userProfileSelect
                },
            },
            orderBy: { updatedAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', productsTrans.map((bought) => (Object.assign(Object.assign({}, bought), { product: parseImages(bought.product) }))));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve product transactions');
    }
});
exports.boughtProducts = boughtProducts;
const soldProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, role } = req.user;
    try {
        const result = query_1.boughtProductSchema.safeParse(req.query);
        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }
        const { status } = result.data;
        const productsTrans = yield prisma_1.default.productTransaction.findMany({
            where: Object.assign({ sellerId: id }, ((status && status !== 'all') ? { status: status } : {})),
            include: {
                product: true,
                order: {
                    include: {
                        rider: {
                            select: userProfileSelect
                        },
                    }
                },
                buyer: {
                    select: userProfileSelect
                },
            },
            orderBy: { updatedAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', productsTrans.map((sold) => (Object.assign(Object.assign({}, sold), { product: parseImages(sold.product) }))));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve product transactions');
    }
});
exports.soldProducts = soldProducts;
const restockProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = body_1.restockProductSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }
        const { productId, quantity } = result.data;
        const product = yield prisma_1.default.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const updated = yield prisma_1.default.product.update({
            where: { id: productId },
            data: { quantity: product.quantity + quantity }
        });
        return (0, modules_1.successResponse)(res, 'success', parseImages(updated));
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.restockProduct = restockProduct;
const selectProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = body_1.selectProductSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }
        const { productId, quantity, orderMethod } = result.data;
        const product = yield prisma_1.default.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (product.quantity < quantity) {
            return res.status(400).json({ error: 'Product quantity is not enough' });
        }
        const price = new library_1.Decimal(product.price).mul(quantity).sub(new library_1.Decimal(product.discount || 0).mul(quantity));
        const productTransaction = yield prisma_1.default.productTransaction.create({
            data: {
                productId,
                quantity,
                buyerId: req.user.id,
                sellerId: product.userId,
                price,
                orderMethod: orderMethod,
                date: new Date()
            }
        });
        return (0, modules_1.successResponse)(res, 'success', productTransaction);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error.message);
    }
});
exports.selectProduct = selectProduct;
const addProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.user;
        const result = body_1.createProductSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                status: false,
                message: 'Validation error',
                errors: result.error.flatten().fieldErrors,
            });
        }
        const { name, description, images, categoryId, quantity, price, discount, weightPerUnit, locationId, state, lga, address } = result.data;
        // Create a Location if state/lga/address provided and no locationId given
        let resolvedLocationId = locationId || null;
        if (!resolvedLocationId && (state || lga || address)) {
            const location = yield prisma_1.default.location.create({
                data: {
                    state: state || null,
                    lga: lga || null,
                    address: address || null,
                    userId: id,
                }
            });
            resolvedLocationId = location.id;
        }
        const newProduct = yield prisma_1.default.product.create({
            data: {
                name,
                description,
                images: images && images.length > 0 ? JSON.stringify(images) : null,
                categoryId,
                quantity,
                price,
                discount,
                weightPerUnit,
                userId: id,
                locationId: resolvedLocationId,
                approved: false
            },
            include: {
                category: { select: { id: true, name: true, description: true } },
            }
        });
        return (0, modules_1.successResponse)(res, 'Product added successfully', parseImages(newProduct));
    }
    catch (error) {
        console.error('Error adding product:', error);
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Failed to add product');
    }
});
exports.addProduct = addProduct;
const updateProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = body_1.updateProductSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation Errors',
            errors: result.error.flatten().fieldErrors
        });
    }
    try {
        yield prisma_1.default.product.update({
            where: { id: Number(id) },
            data: result.data
        });
        return (0, modules_1.successResponse)(res, 'success', "Product updated successfully");
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', "Error updating product!");
    }
});
exports.updateProduct = updateProduct;
const deleteProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.default.product.delete({
            where: { id: Number(id) }
        });
        return (0, modules_1.successResponse)(res, 'success', "Product deleted successfully");
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'There was error deleting products');
    }
});
exports.deleteProduct = deleteProduct;
const getProductTransactionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const productTransaction = yield prisma_1.default.productTransaction.findUnique({
            where: { id: Number(id) },
            include: {
                product: {
                    include: {
                        category: true,
                        pickupLocation: true,
                    }
                },
                order: {
                    include: {
                        rider: { select: userProfileSelect },
                        dropoffLocation: true,
                    }
                },
                transactions: true,
                buyer: { select: userProfileSelect },
                seller: { select: userProfileSelect },
            }
        });
        return (0, modules_1.successResponse)(res, 'success', productTransaction);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve product transaction');
    }
});
exports.getProductTransactionById = getProductTransactionById;
