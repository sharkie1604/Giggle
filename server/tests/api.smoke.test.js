import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { app } from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { env } from '../src/config/env.js';

// Activate test mode so rate limiters do not throttle test execution
process.env.NODE_ENV = 'test';

describe('Giggle API Automated Smoke & Security Suite', () => {
  let server;
  let baseUrl;

  // Unique timestamp for test isolation
  const ts = Date.now();
  const clientEmail = `smoke_client_${ts}@test.com`;
  const freelancerEmail = `smoke_freelancer_${ts}@test.com`;
  const outsiderEmail = `smoke_outsider_${ts}@test.com`;
  const adminEmail = `smoke_admin_${ts}@test.com`;
  const testPassword = 'Password123!';

  // State variables captured sequentially across the workflow
  let clientId, clientToken;
  let freelancerId, freelancerToken;
  let outsiderId, outsiderToken;
  let adminId, adminToken;

  let jobId;
  let proposalId;
  let escrowId;
  let razorpayOrderId;
  let submissionId;

  // Track created entities for reverse FK cleanup
  const createdUserIds = [];
  const createdJobIds = [];
  const createdEscrowIds = [];

  before(async () => {
    // Start Express app on an ephemeral port (port 0)
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Reverse foreign key cleanup strictly respecting onDelete: Restrict
    try {
      if (createdJobIds.length > 0) {
        await prisma.message.deleteMany({ where: { jobId: { in: createdJobIds } } });
        await prisma.review.deleteMany({ where: { jobId: { in: createdJobIds } } });
        await prisma.submission.deleteMany({ where: { jobId: { in: createdJobIds } } });
      }
      if (createdEscrowIds.length > 0) {
        await prisma.transaction.deleteMany({ where: { escrowId: { in: createdEscrowIds } } });
        await prisma.escrow.deleteMany({ where: { id: { in: createdEscrowIds } } });
      }
      if (createdJobIds.length > 0) {
        await prisma.proposal.deleteMany({ where: { jobId: { in: createdJobIds } } });
        await prisma.job.deleteMany({ where: { id: { in: createdJobIds } } });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    } catch (cleanupErr) {
      console.error('Error during smoke test cleanup:', cleanupErr);
    } finally {
      if (server) {
        await new Promise((resolve) => server.close(resolve));
      }
      await prisma.$disconnect();
    }
  });

  // ─── 1. Health Check ────────────────────────────────────────────────────────
  test('1.1 GET /health returns HTTP 200 with { status: "ok" }', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);

    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'freelance-escrow-api');
    assert.equal(typeof data.uptime, 'number');
    assert.ok(data.timestamp);
  });

  // ─── 2. Auth & PII Isolation ───────────────────────────────────────────────
  test('2.1 POST /api/auth/register creates Client, Freelancer, Outsider, and Admin accounts (201)', async () => {
    // 1. Client
    const clientRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: clientEmail,
        password: testPassword,
        name: 'Smoke Client',
        role: 'CLIENT',
      }),
    });
    assert.equal(clientRes.status, 201);
    const clientData = await clientRes.json();
    assert.ok(clientData.token);
    assert.equal(clientData.user.email, clientEmail);
    assert.equal(clientData.user.role, 'CLIENT');
    clientId = clientData.user.id;
    clientToken = clientData.token;
    createdUserIds.push(clientId);

    // 2. Freelancer
    const freelancerRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: freelancerEmail,
        password: testPassword,
        name: 'Smoke Freelancer',
        role: 'FREELANCER',
        skills: ['Node.js', 'PostgreSQL', 'Express'],
      }),
    });
    assert.equal(freelancerRes.status, 201);
    const freelancerData = await freelancerRes.json();
    assert.ok(freelancerData.token);
    assert.equal(freelancerData.user.role, 'FREELANCER');
    freelancerId = freelancerData.user.id;
    freelancerToken = freelancerData.token;
    createdUserIds.push(freelancerId);

    // 3. Outsider Freelancer (for IDOR boundary tests)
    const outsiderRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: outsiderEmail,
        password: testPassword,
        name: 'Smoke Outsider',
        role: 'FREELANCER',
      }),
    });
    assert.equal(outsiderRes.status, 201);
    const outsiderData = await outsiderRes.json();
    outsiderId = outsiderData.user.id;
    outsiderToken = outsiderData.token;
    createdUserIds.push(outsiderId);

    // 4. Admin Account (Registered and elevated in PostgreSQL)
    const adminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: testPassword,
        name: 'Smoke Admin',
        role: 'CLIENT',
      }),
    });
    assert.equal(adminRes.status, 201);
    const adminData = await adminRes.json();
    adminId = adminData.user.id;
    createdUserIds.push(adminId);

    // Elevate admin role directly in PostgreSQL
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // Login as Admin to obtain JWT signed with role === 'ADMIN'
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: testPassword,
      }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLoginData = await adminLoginRes.json();
    assert.equal(adminLoginData.user.role, 'ADMIN');
    adminToken = adminLoginData.token;
  });

  test('2.2 POST /api/auth/register blocks duplicate email with 409 Conflict', async () => {
    const duplicateRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: clientEmail,
        password: testPassword,
        name: 'Duplicate Client',
        role: 'CLIENT',
      }),
    });
    assert.equal(duplicateRes.status, 409);
    const err = await duplicateRes.json();
    assert.equal(err.success, false);
  });

  test('2.3 POST /api/auth/register blocks client self-assignment of ADMIN with 400 Bad Request', async () => {
    const adminTamperRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `tamper_admin_${ts}@test.com`,
        password: testPassword,
        name: 'Tamper Admin',
        role: 'ADMIN',
      }),
    });
    assert.equal(adminTamperRes.status, 400);
  });

  test('2.4 GET /api/users/:id returns public profile (200) strictly omitting passwordHash, email, and upiId', async () => {
    const profileRes = await fetch(`${baseUrl}/api/users/${freelancerId}`);
    assert.equal(profileRes.status, 200);

    const data = await profileRes.json();
    assert.ok(data.user);
    assert.equal(data.user.id, freelancerId);
    assert.equal(data.user.name, 'Smoke Freelancer');
    // PII Invariants: these sensitive fields must NEVER be returned
    assert.equal(data.user.passwordHash, undefined);
    assert.equal(data.user.email, undefined);
    assert.equal(data.user.upiId, undefined);
  });

  // ─── 3. Job Creation, Param Guards & Bait-and-Switch Budget Freeze ─────────
  test('3.1 POST /api/jobs creates a fixed-budget BACKEND gig (201)', async () => {
    const deadline = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const jobRes = await fetch(`${baseUrl}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        title: 'High-Throughput Node.js Microservice',
        description: 'Build a production-ready Express and PostgreSQL backend with 3NF database design and automated testing.',
        category: 'BACKEND',
        budget: 25000,
        deadline,
        requiredSkills: ['Node.js', 'PostgreSQL', 'Express'],
      }),
    });

    assert.equal(jobRes.status, 201);
    const data = await jobRes.json();
    assert.ok(data.job);
    jobId = data.job.id;
    createdJobIds.push(jobId);
    assert.equal(data.job.status, 'OPEN');
    assert.equal(Number(data.job.budget), 25000);
    assert.equal(data.job.category, 'BACKEND');
  });

  test('3.2 Param guards: GET /api/jobs/abc returns 400, GET /api/jobs/99999999 returns 404', async () => {
    const badParamRes = await fetch(`${baseUrl}/api/jobs/abc`);
    assert.equal(badParamRes.status, 400);

    const notFoundRes = await fetch(`${baseUrl}/api/jobs/99999999`);
    assert.equal(notFoundRes.status, 404);
  });

  test('3.3 PATCH /api/jobs/:id allows budget update when 0 proposals exist (200)', async () => {
    const updateRes = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        budget: 30000,
      }),
    });

    assert.equal(updateRes.status, 200);
    const data = await updateRes.json();
    assert.equal(Number(data.job.budget), 30000);
  });

  test('3.4 PATCH /api/jobs/:id rejects budget update with 409 Conflict once a proposal is submitted', async () => {
    // 1. Freelancer submits a proposal
    const proposalRes = await fetch(`${baseUrl}/api/jobs/${jobId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        proposalNote: 'I have 5+ years of Express and PostgreSQL experience and can deliver ahead of schedule.',
        estimatedDays: 4,
      }),
    });
    assert.equal(proposalRes.status, 201);
    const pData = await proposalRes.json();
    proposalId = pData.proposal.id;

    // 2. Client attempts to modify budget -> must be rejected with 409 Conflict
    const tamperBudgetRes = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        budget: 20000,
      }),
    });

    assert.equal(tamperBudgetRes.status, 409);
    const err = await tamperBudgetRes.json();
    assert.ok(err.message.includes('Budget is frozen'));
  });

  // ─── 4. Proposals & Atomic Locking ─────────────────────────────────────────
  test('4.1 POST /api/jobs/:id/proposals duplicate proposal by same freelancer fails with 409 Conflict', async () => {
    const dupProposalRes = await fetch(`${baseUrl}/api/jobs/${jobId}/proposals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        proposalNote: 'Duplicate proposal attempt from the same freelancer.',
        estimatedDays: 3,
      }),
    });

    assert.equal(dupProposalRes.status, 409);
    const err = await dupProposalRes.json();
    assert.ok(err.message.includes('already submitted a proposal'));
  });

  test('4.2 PATCH /api/proposals/:id/accept atomically locks Job.status = IN_PROGRESS and creates Escrow in PENDING (200)', async () => {
    const acceptRes = await fetch(`${baseUrl}/api/proposals/${proposalId}/accept`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });

    assert.equal(acceptRes.status, 200);
    const data = await acceptRes.json();
    escrowId = data.escrow.id;
    createdEscrowIds.push(escrowId);
    assert.equal(data.job.status, 'IN_PROGRESS');
    assert.equal(data.escrow.status, 'PENDING');
    assert.equal(Number(data.escrow.amount), 30000);
    assert.equal(data.escrow.freelancerId, freelancerId);
  });

  // ─── 5. Webhook HMAC Security & Idempotency ────────────────────────────────
  test('5.1 POST /api/webhooks/razorpay with an invalid X-Razorpay-Signature returns 401 Unauthorized', async () => {
    const fakeBody = JSON.stringify({ event: 'payment.captured' });
    const badSigRes = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': 'forged_fake_signature_abc123',
      },
      body: fakeBody,
    });

    assert.equal(badSigRes.status, 401);
  });

  test('5.2 Valid HMAC-SHA256 payment.captured webhook transitions Escrow PENDING -> FUNDED (200) with idempotency', async () => {
    // 1. Client initiates order creation
    const orderRes = await fetch(`${baseUrl}/api/escrow/${escrowId}/create-order`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });

    assert.equal(orderRes.status, 201);
    const orderData = await orderRes.json();
    razorpayOrderId = orderData.order.id;
    assert.ok(razorpayOrderId);

    // 2. Construct authentic Razorpay webhook event payload
    const paymentId = `pay_smoke_${ts}_${Date.now()}`;
    const webhookPayloadString = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: razorpayOrderId,
            amount: 3000000,
            status: 'captured',
          },
        },
      },
    });

    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'giggle_test_webhook_secret_2026';
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(Buffer.from(webhookPayloadString, 'utf8'))
      .digest('hex');

    // 3. Send authentic webhook
    const webhookRes = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature,
      },
      body: webhookPayloadString,
    });

    assert.equal(webhookRes.status, 200);
    const hookData = await webhookRes.json();
    assert.equal(hookData.received, true);

    // Verify DB escrow status transitioned to FUNDED
    const updatedEscrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
    });
    assert.equal(updatedEscrow.status, 'FUNDED');

    // 4. Test Webhook Idempotency: Replay identical webhook
    const replayRes = await fetch(`${baseUrl}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature,
      },
      body: webhookPayloadString,
    });

    assert.equal(replayRes.status, 200);
    const replayEscrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
    });
    assert.equal(replayEscrow.status, 'FUNDED');
  });

  // ─── 6. Workroom Chat IDOR & Revision Feedback Notes ───────────────────────
  test('6.1 POST /api/jobs/:id/messages allows Client & Freelancer (201), blocks Outsider (403)', async () => {
    // 1. Outsider attempts to message -> 403 Forbidden
    const outsiderMsgRes = await fetch(`${baseUrl}/api/jobs/${jobId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${outsiderToken}`,
      },
      body: JSON.stringify({
        content: 'Hello from unauthorized outsider!',
      }),
    });
    assert.equal(outsiderMsgRes.status, 403);

    // 2. Client sends message -> 201 Created
    const clientMsgRes = await fetch(`${baseUrl}/api/jobs/${jobId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        content: 'Welcome aboard! The escrow vault is funded.',
      }),
    });
    assert.equal(clientMsgRes.status, 201);
    const cMsg = await clientMsgRes.json();
    assert.equal(cMsg.message.content, 'Welcome aboard! The escrow vault is funded.');

    // 3. Assigned Freelancer sends message -> 201 Created
    const freelancerMsgRes = await fetch(`${baseUrl}/api/jobs/${jobId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        content: 'Thank you! Starting development now.',
      }),
    });
    assert.equal(freelancerMsgRes.status, 201);
  });

  test('6.2 POST /api/jobs/:id/submissions rejects non-https URLs (400) and accepts valid https URL (201)', async () => {
    // Non-https: javascript pseudo protocol
    const xssRes = await fetch(`${baseUrl}/api/jobs/${jobId}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        deliveryUrl: 'javascript:alert(1)',
        notes: 'Malicious payload',
      }),
    });
    assert.equal(xssRes.status, 400);

    // Non-https: http protocol
    const httpRes = await fetch(`${baseUrl}/api/jobs/${jobId}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        deliveryUrl: 'http://insecure-delivery.com/archive.zip',
        notes: 'Insecure URL',
      }),
    });
    assert.equal(httpRes.status, 400);

    // Valid https URL
    const validSubRes = await fetch(`${baseUrl}/api/jobs/${jobId}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        deliveryUrl: 'https://github.com/developer/giggle-verified-delivery',
        notes: 'Completed full stack service implementation with comprehensive test suite.',
      }),
    });
    assert.equal(validSubRes.status, 201);
    const subData = await validSubRes.json();
    assert.equal(subData.submission.status, 'SUBMITTED');
    submissionId = subData.submission.id;
  });

  test('6.3 PATCH /api/submissions/:id/revision persists revisionNotes (200)', async () => {
    const revisionRes = await fetch(`${baseUrl}/api/submissions/${submissionId}/revision`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        revisionNotes: 'Please add automated test coverage and documentation.',
      }),
    });

    assert.equal(revisionRes.status, 200);
    const data = await revisionRes.json();
    assert.equal(data.submission.status, 'REVISION_REQUESTED');
    assert.equal(data.submission.revisionNotes, 'Please add automated test coverage and documentation.');
  });

  // ─── 7. Payout Release, Two-Way Reviews & Ledger ───────────────────────────
  test('7.1 PATCH /api/escrow/:id/release transitions Escrow = RELEASED and Job = COMPLETED (200)', async () => {
    const releaseRes = await fetch(`${baseUrl}/api/escrow/${escrowId}/release`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });

    assert.equal(releaseRes.status, 200);
    const data = await releaseRes.json();
    assert.equal(data.escrow.status, 'RELEASED');
    assert.equal(data.job.status, 'COMPLETED');
  });

  test('7.2 POST /api/jobs/:id/reviews allows mutual 2-way reviews (201) and blocks duplicates (409)', async () => {
    // 1. Client reviews Freelancer -> 201
    const clientRevRes = await fetch(`${baseUrl}/api/jobs/${jobId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Outstanding technical execution, pristine code quality, and great communication.',
      }),
    });
    assert.equal(clientRevRes.status, 201);

    // Duplicate review by Client -> 409 Conflict
    const dupClientRevRes = await fetch(`${baseUrl}/api/jobs/${jobId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
      body: JSON.stringify({
        rating: 4,
        comment: 'Attempting duplicate review submission.',
      }),
    });
    assert.equal(dupClientRevRes.status, 409);

    // 2. Freelancer reviews Client -> 201
    const freelancerRevRes = await fetch(`${baseUrl}/api/jobs/${jobId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Clear specifications and instantaneous payment release upon review.',
      }),
    });
    assert.equal(freelancerRevRes.status, 201);

    // Duplicate review by Freelancer -> 409 Conflict
    const dupFreelancerRevRes = await fetch(`${baseUrl}/api/jobs/${jobId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freelancerToken}`,
      },
      body: JSON.stringify({
        rating: 3,
        comment: 'Duplicate attempt from freelancer.',
      }),
    });
    assert.equal(dupFreelancerRevRes.status, 409);
  });

  test('7.3 GET /api/transactions/history returns verified DEPOSIT and PAYOUT ledger entries (200)', async () => {
    // Client transaction ledger
    const clientTxRes = await fetch(`${baseUrl}/api/transactions/history`, {
      headers: {
        Authorization: `Bearer ${clientToken}`,
      },
    });
    assert.equal(clientTxRes.status, 200);
    const clientTxData = await clientTxRes.json();
    assert.ok(Array.isArray(clientTxData.transactions));
    const hasDeposit = clientTxData.transactions.some(
      (tx) => tx.type === 'DEPOSIT' && tx.status === 'SUCCESS' && tx.escrowId === escrowId
    );
    assert.ok(hasDeposit, 'Client history must include SUCCESS DEPOSIT for this escrow');

    // Freelancer transaction ledger
    const freelancerTxRes = await fetch(`${baseUrl}/api/transactions/history`, {
      headers: {
        Authorization: `Bearer ${freelancerToken}`,
      },
    });
    assert.equal(freelancerTxRes.status, 200);
    const freelancerTxData = await freelancerTxRes.json();
    assert.ok(Array.isArray(freelancerTxData.transactions));
    const hasPayout = freelancerTxData.transactions.some(
      (tx) => tx.type === 'PAYOUT' && tx.status === 'SUCCESS' && tx.escrowId === escrowId
    );
    assert.ok(hasPayout, 'Freelancer history must include SUCCESS PAYOUT for this escrow');
  });
});
