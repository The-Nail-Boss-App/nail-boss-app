/**
 * End-to-end Playwright test for The Nail Boss (standalone)
 * Tests: Login → Dashboard → Design Studio (create design) → Proposals (create + view client page)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:4000';
const SHOTS = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ── 1. Login page ────────────────────────────────────────────────
  console.log('\n[1] Login page');
  await page.goto(BASE);
  await page.waitForSelector('input[type="text"], input[placeholder]', { timeout: 8000 });
  await page.screenshot({ path: path.join(SHOTS, '01-login.png') });
  const loginTitle = await page.textContent('body');
  assert(loginTitle.includes('Nail Boss') || loginTitle.includes('Sign in') || loginTitle.includes('name'), 'Login page loaded');

  // Fill name and log in
  const nameInput = page.locator('input').first();
  await nameInput.fill('Shikeata');
  // Click the submit button
  await page.locator('button[type="submit"], button').filter({ hasText: /sign in|log in|enter|start|go/i }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS, '02-dashboard.png') });

  // ── 2. Dashboard ─────────────────────────────────────────────────
  console.log('\n[2] Dashboard');
  const dashBody = await page.textContent('body');
  assert(dashBody.includes('Shikeata') || dashBody.includes('Dashboard') || dashBody.includes('Design'), 'Dashboard loaded after login');

  // ── 3. Navigate to Design Studio ─────────────────────────────────
  console.log('\n[3] Design Studio');
  // Try sidebar nav first, then dashboard button
  const studioNav = page.locator('text=/design studio/i').first();
  await studioNav.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, '03-design-studio.png') });

  const studioBody = await page.textContent('body');
  assert(studioBody.includes('Shape') || studioBody.includes('Color') || studioBody.includes('Effect'), 'Design Studio page loaded');

  // Fill out design form
  const designNameInput = page.locator('input[placeholder*="e.g" i], input[placeholder*="name" i]').first();
  await designNameInput.fill('Shikeata Test Look');

  // Pick Coffin shape if available
  const coffinBtn = page.locator('button').filter({ hasText: /coffin/i }).first();
  if (await coffinBtn.isVisible()) await coffinBtn.click();

  // Set base color
  const colorInputs = page.locator('input[type="color"]');
  if (await colorInputs.count() > 0) {
    await colorInputs.first().evaluate(el => { el.value = '#cc44aa'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  }

  await page.screenshot({ path: path.join(SHOTS, '04-design-filled.png') });

  // Save design
  const saveBtn = page.locator('button').filter({ hasText: /save|create design/i }).first();
  await saveBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SHOTS, '05-design-saved.png') });

  // Verify via API
  const designsRes = await page.request.get(`${BASE}/api/designs`);
  const designs = await designsRes.json();
  assert(designs.length > 0, `Design saved to backend (count: ${designs.length})`);
  const designId = designs[0]?.id;

  // ── 4. Proposals page ────────────────────────────────────────────
  console.log('\n[4] Proposals');
  const proposalsNav = page.locator('text=/proposals/i').first();
  await proposalsNav.click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SHOTS, '06-proposals-empty.png') });

  const proposalsBody = await page.textContent('body');
  assert(proposalsBody.includes('Proposal') || proposalsBody.includes('proposal'), 'Proposals page loaded');

  // Open create form
  const newProposalBtn = page.locator('button').filter({ hasText: /new proposal/i }).first();
  await newProposalBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS, '07-proposals-form.png') });

  // Fill form
  const clientInput = page.locator('input[placeholder*="client" i], input[placeholder*="Maya" i], input[placeholder*="name" i]').last();
  await clientInput.fill('Maya Johnson');

  const priceInput = page.locator('input[type="number"]').first();
  await priceInput.fill('95');

  await page.screenshot({ path: path.join(SHOTS, '08-proposal-filled.png') });

  // Submit
  const sendBtn = page.locator('button').filter({ hasText: /send proposal/i }).first();
  await sendBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SHOTS, '09-proposal-sent.png') });

  // Verify proposal in API
  const proposalsRes = await page.request.get(`${BASE}/api/proposals`);
  const proposals = await proposalsRes.json();
  assert(proposals.length > 0, `Proposal saved to backend (count: ${proposals.length})`);
  assert(proposals[0]?.status === 'Sent', `Proposal status is "Sent"`);
  assert(proposals[0]?.clientName === 'Maya Johnson', `Client name saved correctly`);

  // ── 5. Client proposal page ───────────────────────────────────────
  console.log('\n[5] Client proposal page');
  const proposalId = proposals[0]?.id;
  if (proposalId) {
    await page.goto(`${BASE}/proposal/${proposalId}`);
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SHOTS, '10-client-view.png') });

    const clientBody = await page.textContent('body');
    assert(clientBody.includes('Maya') || clientBody.includes('Proposal') || clientBody.includes('Accept'), 'Client proposal page loaded');
    assert(clientBody.includes('95') || clientBody.includes('$'), 'Price visible on client page');

    // Verify status auto-advanced to Viewed
    const checkRes = await page.request.get(`${BASE}/api/proposals/${proposalId}`);
    const checked = await checkRes.json();
    assert(checked.status === 'Viewed', `Status auto-advanced to "Viewed" on open`);
    await page.screenshot({ path: path.join(SHOTS, '11-client-view-loaded.png') });
  }

  await browser.close();

  // ── Summary ───────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed / ${failed} failed`);
  if (failed > 0) process.exit(1);
})().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
