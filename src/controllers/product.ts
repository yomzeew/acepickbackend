import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { successResponse, errorResponse } from '../utils/modules';
import { boughtProductSchema, getProductSchema } from '../validation/query';
import { createProductSchema, productTransactionIdSchema, restockProductSchema, selectProductSchema, updateProductSchema } from '../validation/body';

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

const parseImages = (product: any) => {
    if (!product) return product;
    
    // Handle images field safely
    let images = [];
    if (product.images) {
        if (Array.isArray(product.images)) {
            images = product.images;
        } else if (typeof product.images === 'string') {
            // Try to parse as JSON, if fails, treat as single URL
            try {
                const parsed = JSON.parse(product.images);
                images = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
                // It's not JSON, treat as single URL string
                images = [product.images];
            }
        }
    }
    
    return {
        ...product,
        images
    };
};

export const getProducts = async (req: Request, res: Response) => {
    const result = getProductSchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { categoryId, category, search, state, lga, locationId, page, limit, orderBy, orderDir, minPrice, maxPrice } = result.data;

    try {
        const products = await prisma.product.findMany({
            where: {
                approved: true,
                ...(categoryId && { categoryId: Number(categoryId) }),
                ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
                ...(locationId && { locationId: Number(locationId) }),
                ...(category && {
                    category: { name: { contains: category, mode: 'insensitive' as const } }
                }),
                ...((minPrice !== undefined || maxPrice !== undefined) && {
                    price: {
                        ...(minPrice !== undefined && { gte: minPrice }),
                        ...(maxPrice !== undefined && { lte: maxPrice }),
                    }
                }),
                ...(state || lga ? {
                    pickupLocation: {
                        ...(state && { state: { contains: state, mode: 'insensitive' as const } }),
                        ...(lga && { lga: { contains: lga, mode: 'insensitive' as const } })
                    }
                } : undefined)
            },
            take: limit,
            skip: (page - 1) * limit,
            include: {
                category: { select: { id: true, name: true, description: true } },
                pickupLocation: true,
            },
            orderBy: { [orderBy || 'createdAt']: (orderDir || 'desc').toLowerCase() as any },
        })

        return successResponse(res, 'success', products.map(parseImages));
    } catch (error) {
        console.error('Error in getProducts:', error);
        return errorResponse(res, 'error', 'Failed to retrieve products');
    }
}


export const getProduct = async (req: Request, res: Response) => {
    const { id } = req.params

    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                pickupLocation: true,
                user: {
                    select: userProfileSelect
                }
            }
        })

        if (!product) {
            return errorResponse(res, 'error', 'Product not found');
        }

        return successResponse(res, 'success', parseImages(product))
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve product');
    }
}


export const getMyProducts = async (req: Request, res: Response) => {
    const { id, role } = req.user

    console.log("id", id);

    try {
        const products = await prisma.product.findMany({
            where: { userId: id },
            include: {
                category: { select: { id: true, name: true, description: true } },
                pickupLocation: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        return successResponse(res, 'success', products.map(parseImages));
    } catch (error) {
        console.error('Error in getProducts:', error);
        return errorResponse(res, 'error', 'Failed to retrieve products');
    }
}

export const boughtProducts = async (req: Request, res: Response) => {
    const { id, role } = req.user

    try {
        const result = boughtProductSchema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }

        const { status } = result.data;

        const productsTrans = await prisma.productTransaction.findMany({
            where: {
                buyerId: id,
                ...((status && status !== 'all') ? { status: status as any } : {})
            },
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
        })

        return successResponse(res, 'success', productsTrans.map((bought: any) => ({
            ...bought,
            product: parseImages(bought.product),
        })))
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve product transactions');
    }
}


export const soldProducts = async (req: Request, res: Response) => {
    const { id, role } = req.user

    try {
        const result = boughtProductSchema.safeParse(req.query);

        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }

        const { status } = result.data;

        const productsTrans = await prisma.productTransaction.findMany({
            where: {
                sellerId: id,
                ...((status && status !== 'all') ? { status: status as any } : {})
            },
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
        })

        return successResponse(res, 'success', productsTrans.map((sold: any) => ({
            ...sold,
            product: parseImages(sold.product),
        })))
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve product transactions');
    }
}


export const restockProduct = async (req: Request, res: Response) => {
    try {
        const result = restockProductSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }

        const { productId, quantity } = result.data;

        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const updated = await prisma.product.update({
            where: { id: productId },
            data: { quantity: product.quantity + quantity }
        });

        return successResponse(res, 'success', parseImages(updated));
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}


export const selectProduct = async (req: Request, res: Response) => {
    try {
        const result = selectProductSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ error: result.error.format() });
        }

        const { productId, quantity, orderMethod } = result.data;

        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ error: 'Product quantity is not enough' });
        }

        const price = new Decimal(product.price).mul(quantity).sub(new Decimal(product.discount || 0).mul(quantity));

        const productTransaction = await prisma.productTransaction.create({
            data: {
                productId,
                quantity,
                buyerId: req.user.id,
                sellerId: product.userId,
                price,
                orderMethod: orderMethod as any,
                date: new Date()
            }
        })

        return successResponse(res, 'success', productTransaction)
    } catch (error: any) {
        return errorResponse(res, 'error', error.message);
    }
}

export const addProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.user;

        const result = createProductSchema.safeParse(req.body);

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
            const location = await prisma.location.create({
                data: {
                    state: state || null,
                    lga: lga || null,
                    address: address || null,
                    userId: id,
                }
            });
            resolvedLocationId = location.id;
        }

        const newProduct = await prisma.product.create({
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

        return successResponse(res, 'Product added successfully', parseImages(newProduct));
    } catch (error: any) {
        console.error('Error adding product:', error);
        return errorResponse(res, 'error', error.message || 'Failed to add product');
    }
}



export const updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = updateProductSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            status: false,
            message: 'Validation Errors',
            errors: result.error.flatten().fieldErrors
        })
    }

    try {
        await prisma.product.update({
            where: { id: Number(id) },
            data: result.data as any
        })

        return successResponse(res, 'success', "Product updated successfully")
    } catch (error: any) {
        return errorResponse(res, 'error', "Error updating product!")
    }
}

export const deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.product.delete({
            where: { id: Number(id) }
        })

        return successResponse(res, 'success', "Product deleted successfully")
    } catch (error: any) {
        return errorResponse(res, 'error', 'There was error deleting products');
    }
}

export const getProductTransactionById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const productTransaction = await prisma.productTransaction.findUnique({
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
        })

        return successResponse(res, 'success', productTransaction);
    } catch (error) {
        console.log(error)
        return errorResponse(res, 'error', 'Failed to retrieve product transaction');
    }
}