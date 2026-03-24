import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { deleteFileFromSupabase } from '../services/supabaseStorage';
import { BUCKET } from '../config/supabase';

/**
 * Save call recording metadata.
 * The frontend uploads the audio file directly to Supabase and sends the URL + path here.
 *
 * POST /call-recordings
 * Body: { receiverId, url, path, duration, fileSize?, callType? }
 */
export const saveCallRecording = async (req: Request, res: Response): Promise<void> => {
  try {
    const callerId = req.user.id;
    const { receiverId, url, path, duration, fileSize, callType } = req.body;

    if (!receiverId || !url || !path) {
      res.status(400).json({ error: 'receiverId, url, and path are required' });
      return;
    }

    const recording = await prisma.callRecording.create({
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
  } catch (error) {
    console.error('saveCallRecording error:', error);
    res.status(500).json({ error: 'Failed to save call recording' });
  }
};

/**
 * Get all call recordings for the authenticated user (as caller or receiver).
 *
 * GET /call-recordings?page=1&limit=20
 */
export const getCallRecordings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const where = {
      OR: [{ callerId: userId }, { receiverId: userId }],
    };

    const [recordings, total] = await Promise.all([
      prisma.callRecording.findMany({
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
      prisma.callRecording.count({ where }),
    ]);

    res.json({
      recordings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('getCallRecordings error:', error);
    res.status(500).json({ error: 'Failed to fetch call recordings' });
  }
};

/**
 * Delete a call recording (only the caller who recorded it can delete).
 *
 * DELETE /call-recordings/:id
 */
export const deleteCallRecording = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid recording ID' });
      return;
    }

    const recording = await prisma.callRecording.findFirst({
      where: { id, callerId: userId },
    });

    if (!recording) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    // Delete file from Supabase storage
    try {
      await deleteFileFromSupabase(BUCKET, recording.path);
    } catch (e) {
      console.warn('Failed to delete recording file from storage:', e);
    }

    await prisma.callRecording.delete({ where: { id } });

    res.json({ message: 'Recording deleted' });
  } catch (error) {
    console.error('deleteCallRecording error:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
};
