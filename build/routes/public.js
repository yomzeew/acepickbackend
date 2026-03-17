"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sector_1 = require("../controllers/sector");
const skills_1 = require("../controllers/skills");
const product_1 = require("../controllers/product");
const category_1 = require("../controllers/category");
const routes = (0, express_1.Router)();
// Public endpoints - no authentication required
routes.get("/sectors", sector_1.getSectors);
// Public skills endpoints
routes.get("/skills", skills_1.getSkills);
routes.get("/skills/popular", skills_1.getPopularSkills);
routes.get("/skills/categories", skills_1.getSkillCategories);
// Public products endpoints
routes.get("/products", product_1.getProducts);
routes.get("/categories", category_1.getCategories);
exports.default = routes;
