import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/db.js';
import {
  createProposal,
  findProposalsByJobId,
  findProposalByIdWithJob,
  deleteProposalById,
  acceptProposalAtomically,
} from '../models/proposal.model.js';

/**
 * submitProposal — POST /api/jobs/:id/proposals
 * Role: FREELANCER only
 * Invariants:
 * - Fixed-budget model: strictly proposalNote + estimatedDays (no price/bid field).
 * - Gig must exist and have status 'OPEN'.
 * - Unique constraint @@unique([jobId, freelancerId]) prevents duplicate applications.
 */
export const submitProposal = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.id);
  const freelancerId = req.user.id;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  if (job.status !== 'OPEN') {
    throw new ApiError(409, 'This gig is no longer accepting proposals');
  }

  try {
    const proposal = await createProposal({
      jobId,
      freelancerId,
      proposalNote: req.body.proposalNote,
      estimatedDays: Number(req.body.estimatedDays),
    });

    res.status(201).json({
      success: true,
      proposal,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ApiError(409, 'You have already submitted a proposal for this gig');
    }
    throw err;
  }
});

/**
 * getJobProposals — GET /api/jobs/:id/proposals
 * Role: CLIENT owner only
 * Invariants:
 * - Only the owning client can inspect proposals submitted to their gig (IDOR protection).
 * - Strips sensitive PII (passwordHash, email, upiId).
 */
export const getJobProposals = asyncHandler(async (req, res) => {
  const jobId = Number(req.params.id);

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  // CRITICAL SECURITY RULE 5: Strict IDOR Protection
  if (job.clientId !== req.user.id) {
    throw new ApiError(403, 'You can only view proposals on your own gigs');
  }

  const proposals = await findProposalsByJobId(job.id);

  res.status(200).json({
    success: true,
    proposals,
  });
});

/**
 * withdrawProposal — DELETE /api/proposals/:id
 * Role: FREELANCER owner only
 * Invariants:
 * - Only the freelancer who submitted the proposal can withdraw it.
 * - Only PENDING proposals can be deleted.
 */
export const withdrawProposal = asyncHandler(async (req, res) => {
  const proposalId = Number(req.params.id);

  const proposal = await findProposalByIdWithJob(proposalId);

  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }

  // Strict IDOR Protection: only author can withdraw
  if (proposal.freelancerId !== req.user.id) {
    throw new ApiError(403, 'You can only withdraw your own proposal');
  }

  if (proposal.status !== 'PENDING') {
    throw new ApiError(409, 'Only pending proposals can be withdrawn');
  }

  await deleteProposalById(proposal.id);

  res.status(200).json({
    success: true,
    message: 'Proposal withdrawn successfully',
  });
});

/**
 * acceptProposal — PATCH /api/proposals/:id/accept
 * Role: CLIENT owner only
 * Invariants:
 * - Only the owning client can accept a proposal.
 * - Job must be 'OPEN' and Proposal must be 'PENDING'.
 * - Executes atomic $transaction:
 *   1. Proposal -> ACCEPTED
 *   2. Competing proposals -> REJECTED
 *   3. Job -> IN_PROGRESS
 *   4. Escrow -> PENDING (amount === job.budget)
 */
export const acceptProposal = asyncHandler(async (req, res) => {
  const proposalId = Number(req.params.id);

  const proposal = await findProposalByIdWithJob(proposalId);

  if (!proposal) {
    throw new ApiError(404, 'Proposal not found');
  }

  // Strict IDOR Protection: only gig owner can accept
  if (proposal.job.clientId !== req.user.id) {
    throw new ApiError(403, 'Only the gig owner can accept proposals');
  }

  if (proposal.job.status !== 'OPEN' || proposal.status !== 'PENDING') {
    throw new ApiError(
      409,
      'This gig is no longer open or the proposal is not pending'
    );
  }

  const result = await acceptProposalAtomically({
    proposalId: proposal.id,
    jobId: proposal.job.id,
    freelancerId: proposal.freelancerId,
    budget: proposal.job.budget,
  });

  res.status(200).json({
    success: true,
    message: 'Proposal accepted and gig locked in progress',
    ...result,
  });
});
