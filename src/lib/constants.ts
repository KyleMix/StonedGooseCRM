// Central list of allowed enum values. SQLite has no native enums, so these
// arrays are the single source of truth used by forms, validation, and badges.

// Type-guard: is `value` one of the allowed literals in `list`? Narrows to the
// union type, replacing repeated `LIST.includes(x as (typeof LIST)[number])`
// assertions in the server actions and import logic.
export function oneOf<T extends readonly string[]>(list: T, value: unknown): value is T[number] {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export const CONTACT_TYPES = [
  "Client",
  "Lead",
  "Venue",
  "Vendor",
  "Sponsor",
  "Contractor",
  "Comedian/Talent",
  "Crew",
  "Media",
  "Referral",
] as const;

// The 11 sales-pipeline stages, in order (left -> right on the kanban board).
export const PIPELINE_STAGES = [
  "Lead identified",
  "Contacted",
  "Responded",
  "Discovery call scheduled",
  "Proposal sent",
  "Contract sent",
  "Deposit paid",
  "Job booked",
  "Job completed",
  "Final payment received",
  "Follow-up/testimonial",
] as const;

// Service / event types.
export const SERVICE_TYPES = [
  "Comedy venue",
  "Comedian/Producer",
  "Brewery",
  "Festival",
  "Corporate",
  "Wedding",
  "Live music",
  "Sports",
  "Other",
] as const;

// Job status flow. "Booked" is gated by the booking rule (see lib/jobs.ts).
export const JOB_STATUSES = [
  "Inquiry",
  "Proposal",
  "Booked",
  "In Prep",
  "Completed",
  "Delivered",
  "Archived",
] as const;

export const TASK_CATEGORIES = [
  "Admin",
  "Sales",
  "Finance",
  "Marketing",
  "Operations",
  "Client",
  "Equipment",
  "Legal",
  "Follow-up",
] as const;

export const TASK_PRIORITIES = ["High", "Med", "Low"] as const;

export const TASK_STATUSES = [
  "Not started",
  "In progress",
  "Waiting",
  "Blocked",
  "Done",
] as const;

// Price-confidence flags (§5.2). Every cost/quote carries one.
export const PRICE_CONFIDENCE = [
  "Confirmed",
  "Approximate",
  "Placeholder",
  "Quote needed",
] as const;

// Opex basis flags.
export const OPEX_BASIS = ["Known", "Placeholder", "Needs figure"] as const;

export const PAYMENT_STATUSES = [
  "Unpaid",
  "Deposit paid",
  "Paid in full",
  "Overdue",
] as const;

export const EXPENSE_RECURRENCE = ["One-time", "Recurring"] as const;

// Capital categories (mirrors the equipment budget structure).
export const CAPITAL_CATEGORIES = [
  "Cameras & Lenses",
  "Gimbals & Remote",
  "Switch/Stream/Record",
  "Audio",
  "Crew Comms",
  "PA",
  "Lighting",
  "Camera Support",
  "Connectivity",
  "Power",
  "Media/Storage",
  "Cabling",
  "Road Cases",
  "Transport",
] as const;

// ---- Phase 2 ---------------------------------------------------------------

// Quote status reuses the price-confidence flags (PRICE_CONFIDENCE above).

export const ASSET_CONDITIONS = ["New", "Good", "Fair", "Needs repair", "Retired"] as const;

export const ASSET_CATEGORIES = [
  "Cameras",
  "Lenses",
  "Gimbals & Remote",
  "Switch/Stream/Record",
  "Audio",
  "Crew Comms",
  "PA",
  "Lighting",
  "Camera Support",
  "Connectivity",
  "Power",
  "Media/Storage",
  "Cabling",
  "Road Cases",
  "Transport",
  "Other",
] as const;

export const CONTENT_PLATFORMS = [
  "YouTube",
  "Instagram",
  "TikTok",
  "X",
  "Facebook",
  "Other",
] as const;

export const CONTENT_FORMATS = ["Clip", "Long-form", "Reel", "Short", "Post", "Thumbnail"] as const;

export const CONTENT_STATUSES = [
  "Idea",
  "Scripted",
  "Filming",
  "Editing",
  "Scheduled",
  "Published",
  "Repurposed",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type PriceConfidence = (typeof PRICE_CONFIDENCE)[number];
