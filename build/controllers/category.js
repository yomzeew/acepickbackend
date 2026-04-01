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
exports.deleteCategory = exports.updateCategory = exports.addCategory = exports.getCategories = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const cache_1 = require("../services/cache");
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield cache_1.CacheService.getOrSet('categories:all', () => __awaiter(void 0, void 0, void 0, function* () {
            return prisma_1.default.category.findMany({ orderBy: { name: 'asc' } });
        }), 600); // 10 min TTL
        return (0, modules_1.successResponse)(res, 'success', categories);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve categories');
    }
});
exports.getCategories = getCategories;
const addCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        if (!name) {
            return (0, modules_1.errorResponse)(res, 'error', 'Category name is required');
        }
        const newCategory = yield prisma_1.default.category.create({ data: { name, description } });
        yield cache_1.CacheService.invalidateCategories();
        return (0, modules_1.successResponse)(res, 'Category added successfully', newCategory);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to add category');
    }
});
exports.addCategory = addCategory;
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const category = yield prisma_1.default.category.findUnique({ where: { id: Number(id) } });
        if (!category) {
            return (0, modules_1.errorResponse)(res, 'error', 'Category not found');
        }
        const updated = yield prisma_1.default.category.update({
            where: { id: Number(id) },
            data: {
                name: name || category.name,
                description: description || category.description,
            }
        });
        yield cache_1.CacheService.invalidateCategories();
        return (0, modules_1.successResponse)(res, 'Category updated successfully', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to update category');
    }
});
exports.updateCategory = updateCategory;
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield prisma_1.default.category.findUnique({ where: { id: Number(id) } });
        if (!category) {
            return (0, modules_1.errorResponse)(res, 'error', 'Category not found');
        }
        yield prisma_1.default.category.delete({ where: { id: Number(id) } });
        yield cache_1.CacheService.invalidateCategories();
        return (0, modules_1.successResponse)(res, 'Category deleted successfully');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to delete category');
    }
});
exports.deleteCategory = deleteCategory;
