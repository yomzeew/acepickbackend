import { Request, Response } from "express";
import prisma from '../config/prisma';
import { successResponse, errorResponse } from "../utils/modules";

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        })

        return successResponse(res, 'success', categories);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve categories');
    }
}


export const addCategory = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return errorResponse(res, 'error', 'Category name is required');
        }

        const newCategory = await prisma.category.create({ data: { name, description } });

        return successResponse(res, 'Category added successfully', newCategory);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to add category');
    }
}

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        const category = await prisma.category.findUnique({ where: { id: Number(id) } });

        if (!category) {
            return errorResponse(res, 'error', 'Category not found');
        }

        const updated = await prisma.category.update({
            where: { id: Number(id) },
            data: {
                name: name || category.name,
                description: description || category.description,
            }
        });

        return successResponse(res, 'Category updated successfully', updated);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to update category');
    }
}

export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const category = await prisma.category.findUnique({ where: { id: Number(id) } });

        if (!category) {
            return errorResponse(res, 'error', 'Category not found');
        }

        await prisma.category.delete({ where: { id: Number(id) } });

        return successResponse(res, 'Category deleted successfully');
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to delete category');
    }
}