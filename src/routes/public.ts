import { Router } from "express";
import { getSectors } from "../controllers/sector";
import { getSkills, getSkillCategories, getPopularSkills } from "../controllers/skills";
import { getProducts } from "../controllers/product";
import { getCategories } from "../controllers/category";
import prisma from "../config/prisma";

const routes = Router();

// Public endpoints - no authentication required
routes.get("/sectors", getSectors);

// Public skills endpoints
routes.get("/skills", getSkills);
routes.get("/skills/popular", getPopularSkills);
routes.get("/skills/categories", getSkillCategories);

// Public products endpoints
routes.get("/products", getProducts);
routes.get("/categories", getCategories);

export default routes;
