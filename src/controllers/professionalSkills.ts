import { Request, Response } from "express";
import prisma from '../config/prisma';
import { successResponse, errorResponse, handleResponse } from "../utils/modules";

export const getProfessionalSkills = async (req: Request, res: Response) => {
    const { professionalId } = req.params;
    
    try {
        const professionalSkills = await prisma.professionalSkill.findMany({
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

        return successResponse(res, 'success', professionalSkills);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve professional skills');
    }
};

export const addProfessionalSkills = async (req: Request, res: Response) => {
    const { id } = req.user; // Professional's user ID
    const { skills } = req.body; // Array of { skillId, proficiency, yearsOfExp }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        return handleResponse(res, 400, false, 'Skills array is required');
    }

    try {
        // Get professional record
        const professional = await prisma.professional.findFirst({
            where: { profile: { user: { id } } }
        });

        if (!professional) {
            return handleResponse(res, 404, false, 'Professional profile not found');
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
        const result = await prisma.$transaction(async (tx) => {
            const createdSkills = [];
            
            for (const skillData of validatedSkills) {
                // Check if skill exists
                const skill = await tx.skill.findUnique({
                    where: { id: skillData.skillId }
                });
                
                if (!skill) {
                    throw new Error(`Skill with ID ${skillData.skillId} not found`);
                }

                // Check if professional already has this skill
                const existing = await tx.professionalSkill.findFirst({
                    where: {
                        professionalId: skillData.professionalId,
                        skillId: skillData.skillId
                    }
                });

                if (existing) {
                    // Update existing skill
                    const updated = await tx.professionalSkill.update({
                        where: { id: existing.id },
                        data: {
                            proficiency: skillData.proficiency,
                            yearsOfExp: skillData.yearsOfExp
                        },
                        include: { skill: true }
                    });
                    createdSkills.push(updated);
                } else {
                    // Create new skill
                    const created = await tx.professionalSkill.create({
                        data: skillData,
                        include: { skill: true }
                    });
                    createdSkills.push(created);
                }
            }
            
            return createdSkills;
        });

        return successResponse(res, 'Skills added successfully', result);
    } catch (error: any) {
        if (error.message.includes('not found')) {
            return handleResponse(res, 404, false, error.message);
        }
        return errorResponse(res, 'error', error.message || 'Failed to add skills');
    }
};

export const updateProfessionalSkill = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { skillId } = req.params;
    const { proficiency, yearsOfExp } = req.body;

    try {
        // Get professional record
        const professional = await prisma.professional.findFirst({
            where: { profile: { user: { id } } }
        });

        if (!professional) {
            return handleResponse(res, 404, false, 'Professional profile not found');
        }

        // Find and update the skill
        const professionalSkill = await prisma.professionalSkill.findFirst({
            where: {
                id: Number(skillId),
                professionalId: professional.id
            }
        });

        if (!professionalSkill) {
            return handleResponse(res, 404, false, 'Professional skill not found');
        }

        const updated = await prisma.professionalSkill.update({
            where: { id: Number(skillId) },
            data: {
                proficiency: proficiency || professionalSkill.proficiency,
                yearsOfExp: yearsOfExp !== undefined ? Number(yearsOfExp) : professionalSkill.yearsOfExp
            },
            include: { skill: true }
        });

        return successResponse(res, 'Skill updated successfully', updated);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to update skill');
    }
};

export const removeProfessionalSkill = async (req: Request, res: Response) => {
    const { id } = req.user;
    const { skillId } = req.params;

    try {
        // Get professional record
        const professional = await prisma.professional.findFirst({
            where: { profile: { user: { id } } }
        });

        if (!professional) {
            return handleResponse(res, 404, false, 'Professional profile not found');
        }

        // Find and delete the skill
        const professionalSkill = await prisma.professionalSkill.findFirst({
            where: {
                id: Number(skillId),
                professionalId: professional.id
            }
        });

        if (!professionalSkill) {
            return handleResponse(res, 404, false, 'Professional skill not found');
        }

        await prisma.professionalSkill.delete({
            where: { id: Number(skillId) }
        });

        return successResponse(res, 'Skill removed successfully');
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to remove skill');
    }
};

export const getMySkills = async (req: Request, res: Response) => {
    const { id } = req.user; // Professional's user ID

    try {
        const professional = await prisma.professional.findFirst({
            where: { profile: { user: { id } } }
        });

        if (!professional) {
            return handleResponse(res, 404, false, 'Professional profile not found');
        }

        const professionalSkills = await prisma.professionalSkill.findMany({
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

        return successResponse(res, 'success', professionalSkills);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve your skills');
    }
};
