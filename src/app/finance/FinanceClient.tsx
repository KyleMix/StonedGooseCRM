"use client";

import { useState } from "react";
import {
  ActionForm,
  AddButton,
  EditButton,
  DeleteButton,
  TextField,
  NumberField,
  DateField,
  SelectField,
  TextArea,
  CheckboxField,
} from "@/components/form";
import { Badge, Card, EmptyState, SectionTitle, StatCard, confidenceTone } from "@/components/ui";
import { money, formatDate } from "@/lib/utils";
import {
  PRICE_CONFIDENCE,
  OPEX_BASIS,
  PAYMENT_STATUSES,
  EXPENSE_RECURRENCE,
  CAPITAL_CATEGORIES,
} from "@/lib/constants";
import type { ActionResult } from "@/lib/action-result";
import { CashChart, type CashDatum } from "./CashChart";
import {
  createCapital,
  updateCapital,
  deleteCapital,
  createOpex,
  updateOpex,
  deleteOpex,
  createRevenue,
  updateRevenue,
  deleteRevenue,
  createExpense,
  updateExpense,
  deleteExpense,
  updateSettings,
} from "./actions";

// ---- Row types (serializable shapes passed from the server page) -----------

export interface CapitalRow {
  id: string;
  item: string;
  category?: string | null;
  qty: number;
  unitPrice?: number | null;
  lineTotal?: number | null;
  priceConfidence: string;
  notes?: string | null;
}
export interface OpexRow {
  id: string;
  item: string;
  category?: string | null;
  monthlyAmount?: number | null;
  basis: string;
  notes?: string | null;
}
export interface RevenueRow {
  id: string;
  date?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  service?: string | null;
  invoiceAmount?: number | null;
  depositReceived: number;
  balanceDue?: number | null;
  paymentStatus: string;
  profitEstimate?: number | null;
  jobId?: string | null;
  notes?: string | null;
}
export interface ExpenseRow {
  id: string;
  date?: string | null;
  vendor?: string | null;
  category?: string | null;
  amount?: number | null;
  oneTimeOrRecurring: string;
  receiptSaved: boolean;
  taxDeductible: boolean;
  notes?: string | null;
}
export interface Option {
  value: string;
  label: string;
}

export interface FinanceData {
  capital: CapitalRow[];
  opex: OpexRow[];
  revenue: RevenueRow[];
  expenses: ExpenseRow[];
  clients: Option[];
  jobs: Option[];
  contingencyRate: number;
  runwayMonths: number;
  summary: {
    capitalSubtotal: number;
    capitalContingency: number;
    capitalTotal: number;
    capitalMissingPrice: number;
    monthlyOpex: number;
    opexMissing: number;
    opexHasMissing: boolean;
    scenarios: { months: number; runwayCost: number; totalRaise: number }[];
    revenueInvoiced: number;
    expensesLogged: number;
    net: number;
    balanceOutstanding: number;
  };
  chart: CashDatum[];
}

const TABS = ["Capital", "Monthly Opex", "Revenue", "Expenses", "Runway & Raise"] as const;
type Tab = (typeof TABS)[number];

export function FinanceClient({ data }: { data: FinanceData }) {
  const [tab, setTab] = useState<Tab>("Capital");
  const s = data.summary;

  return (
    <div className="space-y-5">
      {/* Top money snapshot */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Capital total" value={money(s.capitalTotal)} hint={`incl. ${(data.contingencyRate * 100).toFixed(0)}% contingency`} tone="gold" />
        <StatCard label="Monthly opex" value={money(s.monthlyOpex)} hint={s.opexHasMissing ? `${s.opexMissing} line(s) need a figure` : "all figures set"} tone={s.opexHasMissing ? "warn" : "default"} />
        <StatCard label="Revenue to date" value={money(s.revenueInvoiced)} hint={`${money(s.balanceOutstanding)} outstanding`} tone="ok" />
        <StatCard label="Net (rev − exp)" value={money(s.net)} hint={`${money(s.expensesLogged)} expenses`} tone={s.net >= 0 ? "ok" : "danger"} />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-ink-600 pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
              (tab === t ? "bg-gold text-ink-900" : "text-zinc-300 hover:bg-ink-700")
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Capital" && <CapitalTab data={data} />}
      {tab === "Monthly Opex" && <OpexTab data={data} />}
      {tab === "Revenue" && <RevenueTab data={data} />}
      {tab === "Expenses" && <ExpensesTab data={data} />}
      {tab === "Runway & Raise" && <RunwayTab data={data} />}
    </div>
  );
}

// ---- Capital ---------------------------------------------------------------

function CapitalForm({ action, values, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: CapitalRow; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="item" label="Item" defaultValue={values?.item} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Category" options={CAPITAL_CATEGORIES} defaultValue={values?.category} includeBlank />
        <NumberField name="qty" label="Quantity" defaultValue={values?.qty ?? 1} step="1" />
        <NumberField name="unitPrice" label="Unit price ($)" defaultValue={values?.unitPrice} hint="Blank is fine — never a fake number." />
        <SelectField name="priceConfidence" label="Price confidence" options={PRICE_CONFIDENCE} defaultValue={values?.priceConfidence ?? "Quote needed"} />
      </div>
      <TextArea name="notes" label="Notes / source" defaultValue={values?.notes} />
    </ActionForm>
  );
}

function CapitalTab({ data }: { data: FinanceData }) {
  const s = data.summary;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          Subtotal <span className="font-semibold text-white">{money(s.capitalSubtotal)}</span> + contingency{" "}
          <span className="font-semibold text-white">{money(s.capitalContingency)}</span> ={" "}
          <span className="font-semibold text-gold">{money(s.capitalTotal)}</span>
          {s.capitalMissingPrice > 0 && (
            <span className="ml-2 text-warn">· {s.capitalMissingPrice} item(s) need a price</span>
          )}
        </div>
        <AddButton label="+ Add capital item" title="Add capital item" wide>
          {(close) => <CapitalForm action={createCapital} onSuccess={close} />}
        </AddButton>
      </div>
      {data.capital.length === 0 ? (
        <EmptyState>No capital items yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Item</th>
                <th className="sg-th">Category</th>
                <th className="sg-th text-right">Qty</th>
                <th className="sg-th text-right">Unit</th>
                <th className="sg-th text-right">Line total</th>
                <th className="sg-th">Confidence</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {data.capital.map((c) => (
                <tr key={c.id} className="hover:bg-ink-800/50">
                  <td className="sg-td font-medium text-white">
                    {c.item}
                    {c.notes && <div className="mt-0.5 max-w-[260px] truncate text-xs text-zinc-500">{c.notes}</div>}
                  </td>
                  <td className="sg-td">{c.category || "—"}</td>
                  <td className="sg-td text-right">{c.qty}</td>
                  <td className="sg-td text-right">{money(c.unitPrice)}</td>
                  <td className="sg-td text-right font-medium">{money(c.lineTotal)}</td>
                  <td className="sg-td">
                    <Badge tone={confidenceTone(c.priceConfidence)}>{c.priceConfidence}</Badge>
                  </td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit capital item" wide>
                        {(close) => <CapitalForm action={updateCapital} values={c} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteCapital} id={c.id} confirmText={`Delete "${c.item}"?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Opex ------------------------------------------------------------------

function OpexForm({ action, values, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: OpexRow; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <TextField name="item" label="Item" defaultValue={values?.item} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField name="category" label="Category" defaultValue={values?.category} />
        <NumberField name="monthlyAmount" label="Monthly amount ($)" defaultValue={values?.monthlyAmount} hint="Blank until you have a real figure." />
        <SelectField name="basis" label="Basis" options={OPEX_BASIS} defaultValue={values?.basis ?? "Needs figure"} />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

function OpexTab({ data }: { data: FinanceData }) {
  const s = data.summary;
  return (
    <div className="space-y-4">
      {s.opexHasMissing && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
          ⚠ Runway is only meaningful once monthly opex is filled in. {s.opexMissing} line(s) still need a real figure.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          Monthly opex total <span className="font-semibold text-white">{money(s.monthlyOpex)}</span>
        </div>
        <AddButton label="+ Add opex line" title="Add monthly cost" wide>
          {(close) => <OpexForm action={createOpex} onSuccess={close} />}
        </AddButton>
      </div>
      {data.opex.length === 0 ? (
        <EmptyState>No opex lines yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Item</th>
                <th className="sg-th">Category</th>
                <th className="sg-th text-right">Monthly $</th>
                <th className="sg-th">Basis</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {data.opex.map((o) => (
                <tr key={o.id} className="hover:bg-ink-800/50">
                  <td className="sg-td font-medium text-white">
                    {o.item}
                    {o.notes && <div className="mt-0.5 max-w-[260px] truncate text-xs text-zinc-500">{o.notes}</div>}
                  </td>
                  <td className="sg-td">{o.category || "—"}</td>
                  <td className="sg-td text-right">{money(o.monthlyAmount)}</td>
                  <td className="sg-td">
                    <Badge tone={o.basis === "Known" ? "ok" : o.basis === "Placeholder" ? "warn" : "danger"}>{o.basis}</Badge>
                  </td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit opex line" wide>
                        {(close) => <OpexForm action={updateOpex} values={o} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteOpex} id={o.id} confirmText={`Delete "${o.item}"?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Revenue ---------------------------------------------------------------

function RevenueForm({ action, values, data, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: RevenueRow; data: FinanceData; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField name="date" label="Date" defaultValue={values?.date} />
        <SelectField name="clientId" label="Client" options={data.clients} defaultValue={values?.clientId} includeBlank />
        <TextField name="service" label="Service" defaultValue={values?.service} />
        <SelectField name="jobId" label="Linked job" options={data.jobs} defaultValue={values?.jobId} includeBlank />
        <NumberField name="invoiceAmount" label="Invoice amount ($)" defaultValue={values?.invoiceAmount} />
        <NumberField name="depositReceived" label="Deposit received ($)" defaultValue={values?.depositReceived ?? 0} />
        <SelectField name="paymentStatus" label="Payment status" options={PAYMENT_STATUSES} defaultValue={values?.paymentStatus ?? "Unpaid"} />
        <NumberField name="profitEstimate" label="Profit estimate ($)" defaultValue={values?.profitEstimate} />
      </div>
      <p className="text-xs text-zinc-500">Balance due is computed automatically (invoice − deposit).</p>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

function RevenueTab({ data }: { data: FinanceData }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          Invoiced <span className="font-semibold text-white">{money(data.summary.revenueInvoiced)}</span> · Outstanding{" "}
          <span className="font-semibold text-warn">{money(data.summary.balanceOutstanding)}</span>
        </div>
        <AddButton label="+ Add revenue" title="Add revenue entry" wide>
          {(close) => <RevenueForm action={createRevenue} data={data} onSuccess={close} />}
        </AddButton>
      </div>
      {data.revenue.length === 0 ? (
        <EmptyState>No revenue entries yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[860px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Date</th>
                <th className="sg-th">Client / Service</th>
                <th className="sg-th text-right">Invoice</th>
                <th className="sg-th text-right">Deposit</th>
                <th className="sg-th text-right">Balance</th>
                <th className="sg-th">Status</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {data.revenue.map((r) => (
                <tr key={r.id} className="hover:bg-ink-800/50">
                  <td className="sg-td">{formatDate(r.date)}</td>
                  <td className="sg-td">
                    <div className="font-medium text-white">{r.clientName || "—"}</div>
                    <div className="text-xs text-zinc-500">{r.service || ""}</div>
                  </td>
                  <td className="sg-td text-right">{money(r.invoiceAmount)}</td>
                  <td className="sg-td text-right">{money(r.depositReceived)}</td>
                  <td className="sg-td text-right font-medium">{money(r.balanceDue)}</td>
                  <td className="sg-td">
                    <Badge tone={r.paymentStatus === "Paid in full" ? "ok" : r.paymentStatus === "Overdue" ? "danger" : r.paymentStatus === "Deposit paid" ? "info" : "gray"}>
                      {r.paymentStatus}
                    </Badge>
                  </td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit revenue entry" wide>
                        {(close) => <RevenueForm action={updateRevenue} values={r} data={data} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteRevenue} id={r.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Expenses --------------------------------------------------------------

function ExpenseForm({ action, values, onSuccess }: { action: (p: ActionResult, f: FormData) => Promise<ActionResult>; values?: ExpenseRow; onSuccess: () => void }) {
  return (
    <ActionForm action={action} onSuccess={onSuccess}>
      {values?.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField name="date" label="Date" defaultValue={values?.date} />
        <TextField name="vendor" label="Vendor" defaultValue={values?.vendor} />
        <TextField name="category" label="Category" defaultValue={values?.category} />
        <NumberField name="amount" label="Amount ($)" defaultValue={values?.amount} />
        <SelectField name="oneTimeOrRecurring" label="Type" options={EXPENSE_RECURRENCE} defaultValue={values?.oneTimeOrRecurring ?? "One-time"} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CheckboxField name="receiptSaved" label="Receipt saved" defaultChecked={values?.receiptSaved} />
        <CheckboxField name="taxDeductible" label="Tax deductible" defaultChecked={values?.taxDeductible} />
      </div>
      <TextArea name="notes" label="Notes" defaultValue={values?.notes} />
    </ActionForm>
  );
}

function ExpensesTab({ data }: { data: FinanceData }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-400">
          Logged <span className="font-semibold text-white">{money(data.summary.expensesLogged)}</span>
        </div>
        <AddButton label="+ Add expense" title="Add expense" wide>
          {(close) => <ExpenseForm action={createExpense} onSuccess={close} />}
        </AddButton>
      </div>
      {data.expenses.length === 0 ? (
        <EmptyState>No expenses logged yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-600">
          <table className="w-full min-w-[820px] border-collapse">
            <thead className="bg-ink-800">
              <tr>
                <th className="sg-th">Date</th>
                <th className="sg-th">Vendor</th>
                <th className="sg-th">Category</th>
                <th className="sg-th text-right">Amount</th>
                <th className="sg-th">Type</th>
                <th className="sg-th">Flags</th>
                <th className="sg-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {data.expenses.map((e) => (
                <tr key={e.id} className="hover:bg-ink-800/50">
                  <td className="sg-td">{formatDate(e.date)}</td>
                  <td className="sg-td font-medium text-white">{e.vendor || "—"}</td>
                  <td className="sg-td">{e.category || "—"}</td>
                  <td className="sg-td text-right font-medium">{money(e.amount)}</td>
                  <td className="sg-td">{e.oneTimeOrRecurring}</td>
                  <td className="sg-td text-xs text-zinc-400">
                    {e.receiptSaved ? "🧾 " : ""}
                    {e.taxDeductible ? "✓ deductible" : ""}
                  </td>
                  <td className="sg-td">
                    <div className="flex items-center justify-end gap-3">
                      <EditButton title="Edit expense" wide>
                        {(close) => <ExpenseForm action={updateExpense} values={e} onSuccess={close} />}
                      </EditButton>
                      <DeleteButton action={deleteExpense} id={e.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Runway & Raise --------------------------------------------------------

function RunwayTab({ data }: { data: FinanceData }) {
  const s = data.summary;
  return (
    <div className="space-y-5">
      {s.opexHasMissing && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
          ⚠ Runway &amp; raise numbers below use only the opex figures entered so far. {s.opexMissing} line(s) still
          need a real figure, so treat these as a floor, not the final ask.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle>The raise math</SectionTitle>
          <p className="text-sm text-zinc-300">
            Total raise = capital + contingency + (monthly opex × runway months).
          </p>
          <div className="mt-3 space-y-1 text-sm">
            <Row label="Capital + contingency" value={money(s.capitalTotal)} />
            <Row label="Monthly opex" value={money(s.monthlyOpex)} />
            <Row label="Runway months" value={String(data.runwayMonths)} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Scenarios</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sg-th">Runway</th>
                  <th className="sg-th text-right">Runway cost</th>
                  <th className="sg-th text-right">Total raise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-600">
                {s.scenarios.map((sc) => (
                  <tr key={sc.months} className={sc.months === data.runwayMonths ? "bg-gold/5" : ""}>
                    <td className="sg-td font-medium">
                      {sc.months} months {sc.months === data.runwayMonths && <span className="text-gold">(current)</span>}
                    </td>
                    <td className="sg-td text-right">{money(sc.runwayCost)}</td>
                    <td className="sg-td text-right font-semibold text-gold">{money(sc.totalRaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>Cash picture</SectionTitle>
        <CashChart data={data.chart} />
      </Card>

      <Card>
        <SectionTitle>Assumptions</SectionTitle>
        <SettingsForm contingencyRate={data.contingencyRate} runwayMonths={data.runwayMonths} />
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-700 py-1">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function SettingsForm({ contingencyRate, runwayMonths }: { contingencyRate: number; runwayMonths: number }) {
  const [saved, setSaved] = useState(false);
  return (
    <ActionForm
      action={updateSettings}
      submitLabel="Save assumptions"
      onSuccess={() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField name="contingencyRate" label="Contingency rate (0–1)" defaultValue={contingencyRate} step="0.01" hint="0.12 = 12%" />
        <NumberField name="runwayMonths" label="Runway months" defaultValue={runwayMonths} step="1" />
      </div>
      {saved && <span className="text-xs text-ok">Saved.</span>}
    </ActionForm>
  );
}
