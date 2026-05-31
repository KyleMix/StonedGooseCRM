"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { str, parseDate, parseNullableNumber, parseNumber } from "@/lib/utils";
import { ASSET_CONDITIONS } from "@/lib/constants";

function refresh() {
  revalidatePath("/equipment");
  revalidatePath("/");
}

function readAsset(formData: FormData) {
  const item = str(formData.get("item"));
  if (!item) return { error: "Item is required." as const };
  const condition = str(formData.get("condition")) ?? "Good";
  if (!ASSET_CONDITIONS.includes(condition as (typeof ASSET_CONDITIONS)[number])) {
    return { error: "Invalid condition." as const };
  }
  return {
    data: {
      item,
      category: str(formData.get("category")),
      brandModel: str(formData.get("brandModel")),
      serialNumber: str(formData.get("serialNumber")),
      purchaseDate: parseDate(formData.get("purchaseDate")),
      purchasePrice: parseNullableNumber(formData.get("purchasePrice")),
      warranty: str(formData.get("warranty")),
      storageLocation: str(formData.get("storageLocation")),
      condition,
      maintenanceSchedule: str(formData.get("maintenanceSchedule")),
      qty: parseNumber(formData.get("qty"), 1),
      notes: str(formData.get("notes")),
    },
  };
}

export async function createAsset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = readAsset(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.asset.create({ data: parsed.data });
  refresh();
  return ok;
}

export async function updateAsset(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = str(formData.get("id"));
  if (!id) return fail("Missing id.");
  const parsed = readAsset(formData);
  if ("error" in parsed) return fail(parsed.error);
  await prisma.asset.update({ where: { id }, data: parsed.data });
  refresh();
  return ok;
}

export async function deleteAsset(formData: FormData): Promise<void> {
  const id = str(formData.get("id"));
  if (id) await prisma.asset.delete({ where: { id } });
  refresh();
}

// Build a job's pack list from selected inventory assets. Adds each chosen
// asset as a GearChecklistItem on the job (skipping duplicates by item name).
export async function addAssetsToJob(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const jobId = str(formData.get("jobId"));
  if (!jobId) return fail("Pick a job to build the pack list for.");
  const assetIds = formData.getAll("assetIds").map(String).filter(Boolean);
  if (assetIds.length === 0) return fail("Select at least one item.");

  const assets = await prisma.asset.findMany({ where: { id: { in: assetIds } } });
  const existing = await prisma.gearChecklistItem.findMany({
    where: { jobId },
    select: { item: true },
  });
  const have = new Set(existing.map((g) => g.item.toLowerCase()));
  const max = await prisma.gearChecklistItem.aggregate({ where: { jobId }, _max: { position: true } });
  let pos = max._max.position ?? 0;

  const toCreate = assets
    .filter((a) => !have.has(a.item.toLowerCase()))
    .map((a) => ({
      jobId,
      system: a.category,
      item: a.item,
      qty: String(a.qty),
      position: ++pos,
    }));

  if (toCreate.length > 0) await prisma.gearChecklistItem.createMany({ data: toCreate });
  revalidatePath(`/jobs/${jobId}`);
  refresh();
  return ok;
}
