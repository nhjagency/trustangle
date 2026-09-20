// Design Review — data layer.
//
// A design review is a record ABOUT a design, never the design itself: Figma
// stays the single source of truth for artwork. Each record points at an
// existing client in `portfolio.js` through `projectId`, so this module reads
// the same project list as the rest of the tracker rather than keeping a
// second one.
//
// Persistence follows the pattern every other feature here uses: seed data on
// first run, the working copy in localStorage under `nhj-design-reviews`.
// Swap `load`/`save` for API calls when the backend arrives; nothing above
// this file reaches into storage directly.

const STORE_KEY = 'nhj-design-reviews';
const CHANGE_EVENT = 'nhj-design-reviews-changed';

// ─── Vocabulary ───────────────────────────────────────────────────────
// Deliberately short: production workflow lives in Workiom, this is review.
const STATUS = {
  designing:       { key: 'designing',       label: 'Designing',        color: 'oklch(60% .02 250)' },
  ready_for_review:{ key: 'ready_for_review',label: 'Ready for Review', color: 'oklch(55% .14 250)' },
  revision:        { key: 'revision',        label: 'Revision Required',color: 'oklch(55% .16 30)'  },
  approved:        { key: 'approved',        label: 'Approved',         color: 'oklch(55% .15 152)' },
  published:       { key: 'published',       label: 'Published',        color: 'oklch(52% .12 295)' },
};
const STATUS_ORDER = ['designing', 'ready_for_review', 'revision', 'approved', 'published'];

const PRIORITY = {
  high:   { key: 'high',   label: 'High',   color: 'oklch(55% .15 30)'  },
  medium: { key: 'medium', label: 'Medium', color: 'oklch(58% .12 80)'  },
  low:    { key: 'low',    label: 'Low',    color: 'oklch(55% .07 200)' },
};

// Aspect ratio per format drives the preview frame, so a story does not sit
// in a square box waiting for artwork that will never fit it.
const FORMAT = {
  square:    { key: 'square',    label: 'Square 1:1',     ratio: '1 / 1'  },
  portrait:  { key: 'portrait',  label: 'Portrait 4:5',   ratio: '4 / 5'  },
  landscape: { key: 'landscape', label: 'Landscape 16:9', ratio: '16 / 9' },
  story:     { key: 'story',     label: 'Story 9:16',     ratio: '9 / 16' },
};

const PLATFORMS = ['Instagram', 'LinkedIn', 'X', 'TikTok', 'Facebook', 'YouTube', 'Snapchat'];

// ─── Seed records ─────────────────────────────────────────────────────
// Sample data so the queue is not empty on first run. Every projectId is a
// real client id from portfolio.js and every designer/approver is a real name
// from TEAM_LEADERS. Figma fields are left empty because no Figma file is
// connected yet: the preview frame says so rather than showing invented
// artwork. Replace this array once reviews come from a real source.
const SEED = [
  {
    id: 'dr-001', projectId: 'techtown', postId: 'TT-SEP-014',
    title: 'Internet Speed Campaign', campaign: 'Q3 Connectivity Push',
    designer: 'Lama Al-Sheikh', contentOwner: 'Ayah Hamada', approver: 'Sana Shrbaji',
    platform: 'LinkedIn', format: 'landscape', deadline: '2026-09-22', priority: 'high',
    figmaVersion: 'V3', status: 'ready_for_review',
    createdAt: '2026-09-12T09:10:00Z', updatedAt: '2026-09-18T14:05:00Z',
  },
  {
    id: 'dr-002', projectId: 'tachyon', postId: 'TA-SEP-031',
    title: 'Launch Teaser: Frame 2', campaign: 'Tachyon Launch',
    designer: 'Maha Omara', contentOwner: 'Esraa Riyadh', approver: 'Sana Shrbaji',
    platform: 'Instagram', format: 'square', deadline: '2026-09-21', priority: 'high',
    figmaVersion: 'V2', status: 'ready_for_review',
    createdAt: '2026-09-14T08:00:00Z', updatedAt: '2026-09-19T11:20:00Z',
  },
  {
    id: 'dr-003', projectId: 'silver', postId: 'SF-SEP-008',
    title: 'Annual Report Highlights', campaign: 'Foundation Annual Report',
    designer: 'Ayah Mohammed', contentOwner: 'Khulod Akhutheri', approver: 'Iujain Al-asadi',
    platform: 'LinkedIn', format: 'portrait', deadline: '2026-09-24', priority: 'medium',
    figmaVersion: 'V1', status: 'ready_for_review',
    createdAt: '2026-09-15T12:30:00Z', updatedAt: '2026-09-17T16:45:00Z',
  },
  {
    id: 'dr-004', projectId: 'mealy', postId: 'ME-SEP-022',
    title: 'Healthy Eating Carousel: Cover', campaign: 'Ramadan Pre-Launch',
    designer: 'Esraa Riyadh', contentOwner: 'Ayah Hamada', approver: 'Sana Shrbaji',
    platform: 'Instagram', format: 'portrait', deadline: '2026-09-18', priority: 'high',
    figmaVersion: 'V4', status: 'ready_for_review',
    createdAt: '2026-09-08T07:45:00Z', updatedAt: '2026-09-19T09:15:00Z',
  },
  {
    id: 'dr-005', projectId: 'lynnc', postId: 'LY-SEP-011',
    title: 'Hiring Announcement', campaign: 'Employer Brand',
    designer: 'Khulod Akhutheri', contentOwner: 'Rewa Al-Najar', approver: 'Sana Shrbaji',
    platform: 'LinkedIn', format: 'square', deadline: '2026-09-26', priority: 'low',
    figmaVersion: 'V1', status: 'designing',
    createdAt: '2026-09-16T10:00:00Z', updatedAt: '2026-09-16T10:00:00Z',
  },
  {
    id: 'dr-006', projectId: 'invest', postId: 'IN-SEP-019',
    title: 'Investor Summit Save the Date', campaign: 'Summit 2026',
    designer: 'Ayah Hamada', contentOwner: 'Esraa Riyadh', approver: 'Iujain Al-asadi',
    platform: 'X', format: 'landscape', deadline: '2026-09-19', priority: 'high',
    figmaVersion: 'V2', status: 'revision',
    createdAt: '2026-09-09T13:00:00Z', updatedAt: '2026-09-18T08:30:00Z',
  },
  {
    id: 'dr-007', projectId: 'nowa', postId: 'NO-SEP-006',
    title: 'Service Range Explainer', campaign: 'Always On',
    designer: 'Maha Omara', contentOwner: 'Ayah Mohammed', approver: 'Sana Shrbaji',
    platform: 'Instagram', format: 'story', deadline: '2026-09-17', priority: 'medium',
    figmaVersion: 'V2', status: 'revision',
    createdAt: '2026-09-07T11:00:00Z', updatedAt: '2026-09-16T15:10:00Z',
  },
  {
    id: 'dr-008', projectId: 'fundraizely', postId: 'FR-SEP-027',
    title: 'Donor Impact Stat Card', campaign: 'Impact Series',
    designer: 'Sana Shrbaji', contentOwner: 'Rewa Al-Najar', approver: 'Iujain Al-asadi',
    platform: 'Instagram', format: 'square', deadline: '2026-09-15', priority: 'medium',
    figmaVersion: 'V3', status: 'approved',
    createdAt: '2026-09-02T09:00:00Z', updatedAt: '2026-09-16T16:32:00Z',
  },
  {
    id: 'dr-009', projectId: 'qeema', postId: 'QE-SEP-004',
    title: 'Brand Values: Card 1', campaign: 'Brand Rollout',
    designer: 'Rewa Al-Najar', contentOwner: 'Khulod Akhutheri', approver: 'Sana Shrbaji',
    platform: 'LinkedIn', format: 'square', deadline: '2026-09-12', priority: 'low',
    figmaVersion: 'V2', status: 'approved',
    createdAt: '2026-09-01T08:20:00Z', updatedAt: '2026-09-14T10:05:00Z',
  },
  {
    id: 'dr-010', projectId: 'syber', postId: 'SY-SEP-016',
    title: 'Security Awareness Tip 03', campaign: 'Awareness Month',
    designer: 'Lama Al-Sheikh', contentOwner: 'Ayah Hamada', approver: 'Iujain Al-asadi',
    platform: 'LinkedIn', format: 'landscape', deadline: '2026-09-29', priority: 'medium',
    figmaVersion: 'V1', status: 'designing',
    createdAt: '2026-09-17T14:00:00Z', updatedAt: '2026-09-17T14:00:00Z',
  },
  {
    id: 'dr-011', projectId: 'rmz', postId: 'RM-SEP-009',
    title: 'Project Handover Announcement', campaign: 'Delivery Milestones',
    designer: 'Ayah Mohammed', contentOwner: 'Esraa Riyadh', approver: 'Sana Shrbaji',
    platform: 'Instagram', format: 'portrait', deadline: '2026-09-23', priority: 'medium',
    figmaVersion: 'V1', status: 'ready_for_review',
    createdAt: '2026-09-15T09:40:00Z', updatedAt: '2026-09-19T13:00:00Z',
  },
  {
    id: 'dr-012', projectId: 'wateen', postId: 'WA-SEP-012',
    title: 'Ecosystem Partners Grid', campaign: 'Partner Network',
    designer: 'Esraa Riyadh', contentOwner: 'Rewa Al-Najar', approver: 'Iujain Al-asadi',
    platform: 'LinkedIn', format: 'landscape', deadline: '2026-09-10', priority: 'high',
    figmaVersion: 'V5', status: 'approved',
    createdAt: '2026-08-28T10:00:00Z', updatedAt: '2026-09-11T12:00:00Z',
  },
].map(r => ({
  // Figma references live on every record from the start, empty until a file
  // is connected. Nothing downstream has to special-case their absence.
  figmaFileKey: '', figmaNodeId: '', figmaUrl: '', thumbnailUrl: '',
  // Links out to the tools that own the other halves of the job.
  workiomUrl: '', pinterestUrl: '',
  ...r,
}));

// ─── Storage ──────────────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { /* private mode or corrupt value: fall through to the seed */ }
  return SEED.map(r => ({ ...r }));
}

function save(rows) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(rows)); } catch (e) {}
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

function resetToSeed() {
  try { localStorage.removeItem(STORE_KEY); } catch (e) {}
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

// ─── Derived helpers ──────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDeadline(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// Whole-day comparison so a deadline is not "overdue" for the hours before
// midnight on the day it is due.
function daysUntil(iso, now = new Date()) {
  if (!iso) return null;
  const due = new Date(iso);
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / 86400000);
}

// Overdue means the work is still open past its deadline. An approved or
// published design is finished and can never be overdue.
function isOverdue(row, now = new Date()) {
  if (row.status === 'approved' || row.status === 'published') return false;
  const d = daysUntil(row.deadline, now);
  return d != null && d < 0;
}

function monthKey(iso) {
  return iso ? iso.slice(0, 7) : '';
}

function monthLabel(key) {
  if (!key) return '—';
  const [y, m] = key.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export {
  STORE_KEY,
  CHANGE_EVENT,
  STATUS,
  STATUS_ORDER,
  PRIORITY,
  FORMAT,
  PLATFORMS,
  SEED,
  load,
  save,
  resetToSeed,
  fmtDeadline,
  daysUntil,
  isOverdue,
  monthKey,
  monthLabel,
};
