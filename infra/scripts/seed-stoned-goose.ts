// Seed the Twenty workspace with Stoned Goose's standard packages, venues,
// vendors, and crew. Idempotent: re-running skips records whose name (or
// firstName+lastName) already exists. Reads ../../seed-data/*.json relative
// to this script.
//
// Usage:
//   TWENTY_API_KEY=<key> [TWENTY_API_URL=http://localhost:3000] \
//   npx tsx infra/scripts/seed-stoned-goose.ts
//
// The wrapper infra/scripts/seed-stoned-goose.sh sources infra/.env and
// invokes this script.

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const TWENTY_API_URL = process.env.TWENTY_API_URL ?? "http://localhost:3000";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? "";

if (!TWENTY_API_KEY) {
  console.error("TWENTY_API_KEY is not set. Generate one in Twenty UI → Settings → Developers → API Keys.");
  process.exit(1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED_DIR = resolve(HERE, "../../seed-data");

interface PackageRow {
  name: string;
  description?: string;
  basePrice?: number;
  inclusions?: string;
}

interface CompanyRow {
  name: string;
  city?: string;
  address?: string;
  website?: string;
  notes?: string;
}

interface PersonRow {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
}

async function call<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${TWENTY_API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TWENTY_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

function isPlaceholder(row: Record<string, unknown>): boolean {
  return "_comment" in row || Object.values(row).some((v) => v === "REPLACE");
}

async function loadJson<T>(filename: string): Promise<T[]> {
  const raw = await readFile(resolve(SEED_DIR, filename), "utf8");
  return JSON.parse(raw) as T[];
}

async function seedPackages(): Promise<void> {
  const rows = await loadJson<PackageRow & Record<string, unknown>>("packages.json");
  for (const row of rows) {
    if (isPlaceholder(row)) {
      console.log(`[packages] skip placeholder: ${row.name}`);
      continue;
    }
    const filter = encodeURIComponent(`name[eq]:"${row.name}"`);
    const existing = await call<{ data: { packages: Array<{ id: string }> } }>(
      "GET",
      `/rest/packages?filter=${filter}&limit=1`,
    );
    if (existing.data.packages[0]) {
      console.log(`[packages] exists, skip: ${row.name}`);
      continue;
    }
    await call("POST", "/rest/packages", {
      name: row.name,
      description: row.description ?? null,
      basePrice: row.basePrice ?? null,
      inclusions: row.inclusions ?? null,
    });
    console.log(`[packages] created: ${row.name}`);
  }
}

async function seedCompanies(filename: string, contactType: string): Promise<void> {
  const rows = await loadJson<CompanyRow & Record<string, unknown>>(filename);
  for (const row of rows) {
    if (isPlaceholder(row)) {
      console.log(`[${contactType}] skip placeholder: ${row.name}`);
      continue;
    }
    const filter = encodeURIComponent(`name[eq]:"${row.name}"`);
    const existing = await call<{ data: { companies: Array<{ id: string }> } }>(
      "GET",
      `/rest/companies?filter=${filter}&limit=1`,
    );
    if (existing.data.companies[0]) {
      console.log(`[${contactType}] exists, skip: ${row.name}`);
      continue;
    }
    await call("POST", "/rest/companies", {
      name: row.name,
      address: row.address ? { addressCity: row.city, addressStreet1: row.address } : undefined,
      domainName: row.website ? { primaryLinkUrl: row.website } : undefined,
      contactType,
    });
    console.log(`[${contactType}] created: ${row.name}`);
  }
}

async function seedCrew(): Promise<void> {
  const rows = await loadJson<PersonRow & Record<string, unknown>>("crew.json");
  for (const row of rows) {
    if (isPlaceholder(row)) {
      console.log(`[crew] skip placeholder: ${row.firstName} ${row.lastName ?? ""}`);
      continue;
    }
    const fullName = `${row.firstName} ${row.lastName ?? ""}`.trim();
    const filter = encodeURIComponent(`name.firstName[eq]:"${row.firstName}"`);
    const existing = await call<{ data: { people: Array<{ id: string }> } }>(
      "GET",
      `/rest/people?filter=${filter}&limit=5`,
    );
    if (existing.data.people.length) {
      console.log(`[crew] exists, skip: ${fullName}`);
      continue;
    }
    await call("POST", "/rest/people", {
      name: { firstName: row.firstName, lastName: row.lastName ?? "" },
      emails: row.email ? { primaryEmail: row.email } : undefined,
      phones: row.phone ? { primaryPhoneNumber: row.phone } : undefined,
      contactType: "Crew",
    });
    console.log(`[crew] created: ${fullName}`);
  }
}

async function main(): Promise<void> {
  console.log(`Seeding Twenty at ${TWENTY_API_URL}`);
  try {
    await seedPackages();
    await seedCompanies("venues.json", "Venue");
    await seedCompanies("vendors.json", "Vendor");
    await seedCrew();
    console.log("Done.");
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
}

void main();
