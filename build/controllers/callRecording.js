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
exports.deleteCallRecording = exports.getCallRecordings = exports.saveCallRecording = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const supabaseStorage_1 = require("../services/supabaseStorage");
const supabase_1 = require("../config/supabase");
/**
 * Save call recording metadata.
 * The frontend uploads the audio file directly to Supabase and sends the URL + path here.
 *
 * POST /call-recordings
 * Body: { receiverId, url, path, duration, fileSize?, callType? }
 */
const saveCallRecording = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const callerId = req.user.id;
        const { receiverId, url, path, duration, fileSize, callType } = req.body;
        if (!receiverId || !url || !path) {
            res.status(400).json({ error: 'receiverId, url, and path are required' });
            return;
        }
        const recording = yield prisma_1.default.callRecording.create({
            data: {
                callerId,
                receiverId,
                url,
                path,
                duration: duration || 0,
                fileSize: fileSize || null,
                callType: callType || 'voice',
            },
        });
        res.status(201).json(recording);
    }
    catch (error) {
        console.error('saveCallRecording error:', error);
        res.status(500).json({ error: 'Failed to save call recording' });
    }
});
exports.saveCallRecording = saveCallRecording;
/**
 * Get all call recordings for the authenticated user (as caller or receiver).
 *
 * GET /call-recordings?page=1&limit=20
 */
const getCallRecordings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const where = {
            OR: [{ callerId: userId }, { receiverId: userId }],
        };
        const [recordings, total] = yield Promise.all([
            prisma_1.default.callRecording.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    caller: {
                        select: {
                            id: true,
                            profile: { select: { firstName: true, lastName: true, avatar: true } },
                        },
                    },
                    receiver: {
                        select: {
                            id: true,
                            profile: { select: { firstName: true, lastName: true, avatar: true } },
                        },
                    },
                },
            }),
            prisma_1.default.callRecording.count({ where }),
        ]);
        res.json({
            recordings,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        console.error('getCallRecordings error:', error);
        res.status(500).json({ error: 'Failed to fetch call recordings' });
    }
});
exports.getCallRecordings = getCallRecordings;
/**
 * Delete a call recording (only the caller who recorded it can delete).
 *
 * DELETE /call-recordings/:id
 */
const deleteCallRecording = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ error: 'Invalid recording ID' });
            return;
        }
        const recording = yield prisma_1.default.callRecording.findFirst({
            where: { id, callerId: userId },
        });
        if (!recording) {
            res.status(404).json({ error: 'Recording not found' });
            return;
        }
        // Delete file from Supabase storage
        try {
            yield (0, supabaseStorage_1.deleteFileFromSupabase)(supabase_1.BUCKET, recording.path);
        }
        catch (e) {
            console.warn('Failed to delete recording file from storage:', e);
        }
        yield prisma_1.default.callRecording.delete({ where: { id } });
        res.json({ message: 'Recording deleted' });
    }
    catch (error) {
        console.error('deleteCallRecording error:', error);
        res.status(500).json({ error: 'Failed to delete recording' });
    }
});
exports.deleteCallRecording = deleteCallRecording;
