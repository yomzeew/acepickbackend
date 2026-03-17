import { Request, Response } from "express";
import prisma from '../config/prisma';
import { successResponse, errorResponse, handleResponse } from "../utils/modules";

export const getSkills = async (req: Request, res: Response) => {
    try {
        const { category, search } = req.query;
        
        let whereCondition: any = {};
        
        if (category) {
            whereCondition.category = category as string;
        }
        
        if (search) {
            whereCondition.name = {
                contains: search as string,
                mode: 'insensitive'
            };
        }

        const skills = await prisma.skill.findMany({
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

        return successResponse(res, 'success', skills);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve skills');
    }
};

export const getSkillById = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
        const skill = await prisma.skill.findUnique({
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
            return handleResponse(res, 404, false, 'Skill not found');
        }

        return successResponse(res, 'success', skill);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve skill');
    }
};

export const createSkill = async (req: Request, res: Response) => {
    const { name, description, category } = req.body;

    if (!name) {
        return handleResponse(res, 400, false, 'Skill name is required');
    }

    try {
        // Check if skill already exists
        const existingSkill = await prisma.skill.findFirst({
            where: { name: name.trim() }
        });

        if (existingSkill) {
            return handleResponse(res, 400, false, 'Skill with this name already exists');
        }

        const newSkill = await prisma.skill.create({
            data: {
                name: name.trim(),
                description: description?.trim(),
                category: category?.trim()
            }
        });

        return successResponse(res, 'Skill created successfully', newSkill);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to create skill');
    }
};

export const updateSkill = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, category } = req.body;

    try {
        const skill = await prisma.skill.findUnique({ where: { id: Number(id) } });

        if (!skill) {
            return handleResponse(res, 404, false, 'Skill not found');
        }

        // Check if new name conflicts with existing skill
        if (name && name.trim() !== skill.name) {
            const existingSkill = await prisma.skill.findFirst({
                where: { name: name.trim() }
            });

            if (existingSkill) {
                return handleResponse(res, 400, false, 'Skill with this name already exists');
            }
        }

        const updated = await prisma.skill.update({
            where: { id: Number(id) },
            data: {
                name: name ? name.trim() : skill.name,
                description: description?.trim() || skill.description,
                category: category?.trim() || skill.category
            }
        });

        return successResponse(res, 'Skill updated successfully', updated);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to update skill');
    }
};

export const deleteSkill = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const skill = await prisma.skill.findUnique({ where: { id: Number(id) } });

        if (!skill) {
            return handleResponse(res, 404, false, 'Skill not found');
        }

        // Check if skill is being used by professionals or jobs
        const professionalCount = await prisma.professionalSkill.count({
            where: { skillId: Number(id) }
        });

        const jobCount = await prisma.jobSkill.count({
            where: { skillId: Number(id) }
        });

        if (professionalCount > 0 || jobCount > 0) {
            return handleResponse(res, 400, false, 
                'Cannot delete skill that is being used by professionals or jobs'
            );
        }

        await prisma.skill.delete({ where: { id: Number(id) } });

        return successResponse(res, 'Skill deleted successfully');
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to delete skill');
    }
};

export const getSkillCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.skill.groupBy({
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

        return successResponse(res, 'success', result);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve skill categories');
    }
};

export const getPopularSkills = async (req: Request, res: Response) => {
    try {
        const skills = await prisma.skill.findMany({
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
        const sortedSkills = skills.sort((a, b) => 
            (b._count.professionalSkills + b._count.jobSkills) - 
            (a._count.professionalSkills + a._count.jobSkills)
        );

        return successResponse(res, 'success', sortedSkills);
    } catch (error) {
        return errorResponse(res, 'error', 'Failed to retrieve popular skills');
    }
};
