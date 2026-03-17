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
exports.deleteLocation = exports.updateLocation = exports.addLocation = exports.getMyLocations = exports.getLocationById = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const modules_1 = require("../utils/modules");
const getLocationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const location = yield prisma_1.default.location.findUnique({
            where: { id: Number(id) }
        });
        if (!location) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Location not found');
        }
        return (0, modules_1.successResponse)(res, 'success', location);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getLocationById = getLocationById;
const getMyLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const locations = yield prisma_1.default.location.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' }
        });
        return (0, modules_1.successResponse)(res, 'success', locations);
    }
    catch (error) {
        return (0, modules_1.errorResponse)(res, 'error', error);
    }
});
exports.getMyLocations = getMyLocations;
const addLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.user;
    try {
        const { latitude, longitude, address, lga, state, zipcode } = req.body;
        const location = yield prisma_1.default.location.create({
            data: {
                latitude,
                longitude,
                address,
                lga,
                state,
                zipcode,
                userId: id
            }
        });
        return (0, modules_1.successResponse)(res, 'Location added successfully', location);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'Error adding location', error);
    }
});
exports.addLocation = addLocation;
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { locationId } = req.params;
    const { id } = req.user;
    try {
        const location = yield prisma_1.default.location.findFirst({
            where: { id: Number(locationId), userId: id }
        });
        if (!location) {
            return (0, modules_1.handleResponse)(res, 404, false, 'Location not found');
        }
        const { latitude, longitude, address, lga, state, zipcode } = req.body;
        const updated = yield prisma_1.default.location.update({
            where: { id: Number(locationId) },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (latitude !== undefined && { latitude })), (longitude !== undefined && { longitude })), (address !== undefined && { address })), (lga !== undefined && { lga })), (state !== undefined && { state })), (zipcode !== undefined && { zipcode }))
        });
        return (0, modules_1.successResponse)(res, 'Location updated successfully', updated);
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'Error updating location', error);
    }
});
exports.updateLocation = updateLocation;
const deleteLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma_1.default.location.delete({
            where: { id: Number(id) }
        });
        return (0, modules_1.successResponse)(res, 'Location deleted successfully', {});
    }
    catch (error) {
        console.log(error);
        return (0, modules_1.errorResponse)(res, 'Error deleting location', error);
    }
});
exports.deleteLocation = deleteLocation;
