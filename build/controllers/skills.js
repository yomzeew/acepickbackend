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
exports.getPopularSkills = exports.getSkillCategories = exports.deleteSkill = exports.updateSkill = exports.createSkill = exports.getSkillById = exports.getSkills = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const getSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, search } = req.query;
        let whereCondition = {};
        if (category) {
            whereCondition.category = category;
        }
        if (search) {
            whereCondition.name = {
                contains: search,
                mode: 'insensitive'
            };
        }
        const skills = yield prisma_1.default.skill.findMany({
            where: whereCondition,
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        professionalSkills: true,
                        jobSkills: true
                    }
                }
            }
        });
        return (0, modules_1.successResponse)(res, 'success', skills);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve skills');
    }
});
exports.getSkills = getSkills;
const getSkillById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const skill = yield prisma_1.default.skill.findUnique({
            where: { id: Number(id) },
            include: {
                _count: {
                    select: {
                        professionalSkills: true,
                        jobSkills: true
                    }
                }
            }
        });
        if (!skill) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Skill not found');
        }
        return (0, modules_1.successResponse)(res, 'success', skill);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve skill');
    }
});
exports.getSkillById = getSkillById;
const createSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, category } = req.body;
    if (!name) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Skill name is required');
    }
    try {
        // Check if skill already exists
        const existingSkill = yield prisma_1.default.skill.findFirst({
            where: { name: name.trim() }
        });
        if (existingSkill) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Skill with this name already exists');
        }
        const newSkill = yield prisma_1.default.skill.create({
            data: {
                name: name.trim(),
                description: description === null || description === void 0 ? void 0 : description.trim(),
                category: category === null || category === void 0 ? void 0 : category.trim()
            }
        });
        return (0, modules_1.successResponse)(res, 'Skill created successfully', newSkill);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to create skill');
    }
});
exports.createSkill = createSkill;
const updateSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, description, category } = req.body;
    try {
        const skill = yield prisma_1.default.skill.findUnique({ where: { id: Number(id) } });
        if (!skill) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Skill not found');
        }
        // Check if new name conflicts with existing skill
        if (name && name.trim() !== skill.name) {
            const existingSkill = yield prisma_1.default.skill.findFirst({
                where: { name: name.trim() }
            });
            if (existingSkill) {
                return (0, modules_1.handleResponse)(res, 400, false, 'Skill with this name already exists');
            }
        }
        const updated = yield prisma_1.default.skill.update({
            where: { id: Number(id) },
            data: {
                name: name ? name.trim() : skill.name,
                description: (description === null || description === void 0 ? void 0 : description.trim()) || skill.description,
                category: (category === null || category === void 0 ? void 0 : category.trim()) || skill.category
            }
        });
        return (0, modules_1.successResponse)(res, 'Skill updated successfully', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to update skill');
    }
});
exports.updateSkill = updateSkill;
const deleteSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const skill = yield prisma_1.default.skill.findUnique({ where: { id: Number(id) } });
        if (!skill) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Skill not found');
        }
        // Check if skill is being used by professionals or jobs
        const professionalCount = yield prisma_1.default.professionalSkill.count({
            where: { skillId: Number(id) }
        });
        const jobCount = yield prisma_1.default.jobSkill.count({
            where: { skillId: Number(id) }
        });
        if (professionalCount > 0 || jobCount > 0) {
            return (0, modules_1.handleResponse)(res, 400, false, 'Cannot delete skill that is being used by professionals or jobs');
        }
        yield prisma_1.default.skill.delete({ where: { id: Number(id) } });
        return (0, modules_1.successResponse)(res, 'Skill deleted successfully');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to delete skill');
    }
});
exports.deleteSkill = deleteSkill;
const getSkillCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma_1.default.skill.groupBy({
            by: ['category'],
            where: {
                category: {
                    not: null
                }
            },
            _count: {
                category: true
            },
            orderBy: {
                category: 'asc'
            }
        });
        const result = categories.map(cat => ({
            name: cat.category,
            count: cat._count.category
        }));
        return (0, modules_1.successResponse)(res, 'success', result);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve skill categories');
    }
});
exports.getSkillCategories = getSkillCategories;
const getPopularSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const skills = yield prisma_1.default.skill.findMany({
            include: {
                _count: {
                    select: {
                        professionalSkills: true,
                        jobSkills: true
                    }
                }
            },
            orderBy: {
                professionalSkills: {
                    _count: 'desc'
                }
            },
            take: 20
        });
        // Sort by total usage (professionals + jobs)
        const sortedSkills = skills.sort((a, b) => (b._count.professionalSkills + b._count.jobSkills) -
            (a._count.professionalSkills + a._count.jobSkills));
        return (0, modules_1.successResponse)(res, 'success', sortedSkills);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve popular skills');
    }
});
exports.getPopularSkills = getPopularSkills;
