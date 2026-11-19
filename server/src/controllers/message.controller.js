import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createMessage, findMessagesByJobId } from '../models/message.model.js';

/**
 * GET /api/jobs/:id/messages
 * Retrieves all workroom messages for a gig.
 * Access restricted strictly to the client owner or hired freelancer (or admin).
 */
export const getJobMessages = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      clientId: true,
      escrow: {
        select: {
          freelancerId: true,
        },
      },
    },
  });

  if (!job) {
    throw new ApiError(404, 'Gig not found');
  }

  const isClientOwner = job.clientId === req.user.id;
  const isHiredFreelancer = job.escrow?.freelancerId === req.user.id;

  if (!isClientOwner && !isHiredFreelancer && req.user.role !== 'ADMIN') {
    throw new ApiError(
      403,
      "You are not authorized to view this gig's workroom messages"
    );
  }

  const messages = await findMessagesByJobId(jobId);

  res.status(200).json({
    success: true,
    messages,
  });
});

/**
 * POST /api/jobs/:id/messages
 * Sends a new message in the gig workroom chat.
 * Access restricted strictly to the client owner or hired freelancer (or admin).
 */
export const sendJobMessage = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.id);
  const { content } = req.body;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      clientId: true,
      escrow: {
        select: {
          freelancerId: true,
        },
      },
    },
  });

  if (!job) {
    throw new ApiError(404, 'Gig not found');
  }

  const isClientOwner = job.clientId === req.user.id;
  const isHiredFreelancer = job.escrow?.freelancerId === req.user.id;

  if (!isClientOwner && !isHiredFreelancer && req.user.role !== 'ADMIN') {
    throw new ApiError(
      403,
      "You are not authorized to send messages in this gig's workroom"
    );
  }

  const message = await createMessage({
    jobId,
    senderId: req.user.id,
    content: content.trim(),
  });

  res.status(201).json({
    success: true,
    message,
  });
});
