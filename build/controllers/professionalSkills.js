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
exports.getMySkills = exports.removeProfessionalSkill = exports.updateProfessionalSkill = exports.addProfessionalSkills = exports.getProfessionalSkills = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const getProfessionalSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { professionalId } = req.params;
    try {
        const professionalSkills = yield prisma_1.default.professionalSkill.findMany({
            where: { professionalId: Number(professionalId) },
            include: {
                skill: {
                    include: {
                        _count: {
                            select: {
                                professionalSkills: true,
                                jobSkills: true
                            }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', professionalSkills);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve professional skills');
    }
});
exports.getProfessionalSkills = getProfessionalSkills;
const addProfessionalSkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user; // Professional's user ID
    const { skills } = req.body; // Array of { skillId, proficiency, yearsOfExp }
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return (0, modules_1.handleResponse)(res, 400, false, 'Skills array is required');
    }
    try {
        // Get professional record
        const professional = yield prisma_1.default.professional.findFirst({
            where: { profile: { user: { id } } }
        });
        if (!professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional profile not found');
        }
        // Validate skills data
        const validatedSkills = skills.map(skill => {
            if (!skill.skillId || !skill.proficiency) {
                throw new Error('Each skill must have skillId and proficiency');
            }
            return {
                professionalId: professional.id,
                skillId: Number(skill.skillId),
                proficiency: skill.proficiency,
                yearsOfExp: skill.yearsOfExp ? Number(skill.yearsOfExp) : null
            };
        });
        // Create skills in transaction
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const createdSkills = [];
            for (const skillData of validatedSkills) {
                // Check if skill exists
                const skill = yield tx.skill.findUnique({
                    where: { id: skillData.skillId }
                });
                if (!skill) {
                    throw new Error(`Skill with ID ${skillData.skillId} not found`);
                }
                // Check if professional already has this skill
                const existing = yield tx.professionalSkill.findFirst({
                    where: {
                        professionalId: skillData.professionalId,
                        skillId: skillData.skillId
                    }
                });
                if (existing) {
                    // Update existing skill
                    const updated = yield tx.professionalSkill.update({
                        where: { id: existing.id },
                        data: {
                            proficiency: skillData.proficiency,
                            yearsOfExp: skillData.yearsOfExp
                        },
                        include: { skill: true }
                    });
                    createdSkills.push(updated);
                }
                else {
                    // Create new skill
                    const created = yield tx.professionalSkill.create({
                        data: skillData,
                        include: { skill: true }
                    });
                    createdSkills.push(created);
                }
            }
            return createdSkills;
        }));
        return (0, modules_1.successResponse)(res, 'Skills added successfully', result);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return (0, modules_1.handleResponse)(res, 404, false, error.message);
        }
        return (0, modules_1.errorResponse)(res, 'error', error.message || 'Failed to add skills');
    }
});
exports.addProfessionalSkills = addProfessionalSkills;
const updateProfessionalSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { skillId } = req.params;
    const { proficiency, yearsOfExp } = req.body;
    try {
        // Get professional record
        const professional = yield prisma_1.default.professional.findFirst({
            where: { profile: { user: { id } } }
        });
        if (!professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional profile not found');
        }
        // Find and update the skill
        const professionalSkill = yield prisma_1.default.professionalSkill.findFirst({
            where: {
                id: Number(skillId),
                professionalId: professional.id
            }
        });
        if (!professionalSkill) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional skill not found');
        }
        const updated = yield prisma_1.default.professionalSkill.update({
            where: { id: Number(skillId) },
            data: {
                proficiency: proficiency || professionalSkill.proficiency,
                yearsOfExp: yearsOfExp !== undefined ? Number(yearsOfExp) : professionalSkill.yearsOfExp
            },
            include: { skill: true }
        });
        return (0, modules_1.successResponse)(res, 'Skill updated successfully', updated);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to update skill');
    }
});
exports.updateProfessionalSkill = updateProfessionalSkill;
const removeProfessionalSkill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    const { skillId } = req.params;
    try {
        // Get professional record
        const professional = yield prisma_1.default.professional.findFirst({
            where: { profile: { user: { id } } }
        });
        if (!professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional profile not found');
        }
        // Find and delete the skill
        const professionalSkill = yield prisma_1.default.professionalSkill.findFirst({
            where: {
                id: Number(skillId),
                professionalId: professional.id
            }
        });
        if (!professionalSkill) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional skill not found');
        }
        yield prisma_1.default.professionalSkill.delete({
            where: { id: Number(skillId) }
        });
        return (0, modules_1.successResponse)(res, 'Skill removed successfully');
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to remove skill');
    }
});
exports.removeProfessionalSkill = removeProfessionalSkill;
const getMySkills = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user; // Professional's user ID
    try {
        const professional = yield prisma_1.default.professional.findFirst({
            where: { profile: { user: { id } } }
        });
        if (!professional) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Professional profile not found');
        }
        const professionalSkills = yield prisma_1.default.professionalSkill.findMany({
            where: { professionalId: professional.id },
            include: {
                skill: {
                    include: {
                        _count: {
                            select: {
                                professionalSkills: true,
                                jobSkills: true
                            }
                        }
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', professionalSkills);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', 'Failed to retrieve your skills');
    }
});
exports.getMySkills = getMySkills;
