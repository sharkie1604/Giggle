import { prisma } from '../config/db.js';

/**
 * createSubmissionAndTimestamp — atomically creates a submission record and stamps submittedAt on Escrow.
 * @param {object} params - { jobId, freelancerId, escrowId, deliveryUrl, notes }
 * @returns {Promise<{ submission: Submission, escrow: Escrow }>}
 */
export const createSubmissionAndTimestamp = async ({
  jobId,
  freelancerId,
  escrowId,
  deliveryUrl,
  notes,
}) => {
  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.create({
      data: {
        jobId,
        freelancerId,
        deliveryUrl,
        notes,
        status: 'SUBMITTED',
      },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const escrow = await tx.escrow.update({
      where: { id: escrowId },
      data: {
        submittedAt: new Date(),
      },
    });

    return { submission, escrow };
  });
};

/**
 * findSubmissionByIdWithJob — retrieves a submission including job and escrow ownership metadata.
 * @param {number} submissionId
 * @returns {Promise<Submission|null>}
 */
export const findSubmissionByIdWithJob = async (submissionId) => {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      job: {
        select: {
          id: true,
          clientId: true,
          status: true,
          title: true,
          escrow: {
            select: {
              id: true,
              status: true,
              freelancerId: true,
              amount: true,
            },
          },
        },
      },
    },
  });
};

/**
 * markSubmissionRevisionRequested — transitions a submission to REVISION_REQUESTED and saves feedback notes.
 * @param {number} submissionId
 * @param {string} [revisionNotes]
 * @returns {Promise<Submission>}
 */
export const markSubmissionRevisionRequested = async (submissionId, revisionNotes) => {
  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: 'REVISION_REQUESTED',
      ...(revisionNotes !== undefined ? { revisionNotes } : {}),
    },
  });
};

export const SubmissionModel = {
  create: (data) => prisma.submission.create({ data }),
  findById: (id, include) => prisma.submission.findUnique({ where: { id }, include }),
  findManyByJobId: (jobId) =>
    prisma.submission.findMany({
      where: { jobId },
      orderBy: { createdAt: 'desc' },
      include: { freelancer: { select: { id: true, name: true } } },
    }),
  update: (id, data) => prisma.submission.update({ where: { id }, data }),
  createSubmissionAndTimestamp,
  findSubmissionByIdWithJob,
  markSubmissionRevisionRequested,
};

export default SubmissionModel;
