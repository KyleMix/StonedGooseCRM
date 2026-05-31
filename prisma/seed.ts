/**
 * Seed script — real Stoned Goose data so the app is usable immediately.
 *
 * IDEMPOTENT: it checks whether data already exists and skips re-seeding, so it
 * is safe to run on every `npm run dev` (via the predev hook). To wipe and
 * re-seed from scratch, run `npm run db:reset`.
 *
 * Capital line items, opex, contacts, pipeline, and packages are taken
 * verbatim from the founder's spreadsheets (Equipment Budget, Finance Tracker,
 * CRM Pipeline — May 2026). No prices were invented (§5.3). The spreadsheet's
 * price-basis labels map to the app's price-confidence flags as:
 *   Researched  -> Confirmed
 *   Researched~ -> Approximate
 *   Estimate    -> Quote needed   (named product, planning price pending quote)
 *   Allowance   -> Placeholder    (grouped budget line)
 *   Owned       -> Confirmed      ($0, already owned)
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- Contacts (CRM) ---------------------------------------------------------
const venues = [
  {
    name: "Craft Kitchen & Brewery",
    org: "Craft Kitchen & Brewery",
    role: "Venue / booker",
    location: "Bend, OR",
    notes: "62988 Layton Ave #103, Bend OR 97701. Hosted SG stand-up show. Repeat opportunity.",
  },
  {
    name: "BeatDrop Kitchen & Event Center",
    org: "BeatDrop",
    role: "Venue / booker",
    notes: "Event center — comedy/music potential.",
  },
  {
    name: "Hill City Tap House & Bottle Shop",
    org: "Hill City",
    role: "Venue",
    notes: "Tap house — comedy night potential.",
  },
  {
    name: "Club Comedy Seattle",
    org: "Club Comedy Seattle",
    role: "Venue",
    location: "Seattle, WA",
    notes: "From prior promo context.",
  },
  {
    name: "Lacey Comedy Night",
    org: "Lacey Comedy Night",
    role: "Organizer",
    location: "Lacey, WA",
    notes: "From prior promo context.",
  },
];

const crew = [
  { name: "Kyle Mixon", org: "Stoned Goose Productions", role: "Founder / Producer", location: "Seattle area", notes: "Founder & operator." },
  { name: "Brendan Meeks", org: "Stoned Goose Crew", role: "Comedian / Crew", notes: "Craft Kitchen show." },
  { name: "Garrett Iverson", org: "Stoned Goose Crew", role: "Comedian / Crew", notes: "Craft Kitchen show." },
  { name: "Joseph Humphrey", org: "Stoned Goose Crew", role: "Comedian / Crew", notes: "Craft Kitchen show." },
  { name: "Sam Tweed", org: "Stoned Goose Crew", role: "Comedian / Crew", notes: "Craft Kitchen show. Also seen as Samuel Tweed." },
];

const comedians = [
  { name: "Gavin Howells", role: "Comedian (headliner)", location: "Bend, OR area", notes: "Headlined Craft Kitchen show." },
  { name: "Luis J. Gomez", role: "Comedian / media", notes: "From promo context." },
  { name: "Logan Cantrell", role: "Comedian", notes: "From content context." },
  { name: "Brandon White", role: "Comedian", notes: "From content context." },
];

// --- Pipeline leads ---------------------------------------------------------
const leads = [
  { contactName: "Craft Kitchen & Brewery", clientType: "Brewery", serviceNeeded: "Comedy livestream + recording", stage: "Follow-up/testimonial", notes: "Prior SG show (Gavin Howells, $15 tix). Pitch a recurring filmed series." },
  { contactName: "BeatDrop Kitchen & Event Center", clientType: "Comedy venue", serviceNeeded: "Comedy showcase capture", stage: "Lead identified", notes: "Local event center." },
  { contactName: "Hill City Tap House & Bottle Shop", clientType: "Comedy venue", serviceNeeded: "Comedy night livestream", stage: "Lead identified", notes: "" },
  { contactName: "Club Comedy Seattle", clientType: "Comedy venue", serviceNeeded: "Set recording / livestream", stage: "Lead identified", notes: "Seattle club from promo context." },
  { contactName: "Lacey Comedy Night", clientType: "Comedy venue", serviceNeeded: "Show capture", stage: "Lead identified", notes: "" },
];

// --- Capital items (itemized equipment budget) ------------------------------
// [item, category, qty, unitPrice, basis, notes]
type Basis = "Researched" | "Researched~" | "Estimate" | "Allowance" | "Owned";
const basisToConfidence: Record<Basis, string> = {
  Researched: "Confirmed",
  "Researched~": "Approximate",
  Estimate: "Quote needed",
  Allowance: "Placeholder",
  Owned: "Confirmed",
};

const capital: [string, string, number, number, Basis, string][] = [
  ["Panasonic Lumix BS1H (SDI box cinema, primary)", "Cameras & Lenses", 2, 3500, "Researched", "B&H list ~$3,498. L-mount, 3G-SDI, genlock/TC."],
  ["Sigma 70-200mm f/2.8 DG DN OS Sports (L-mount)", "Cameras & Lenses", 2, 1400, "Researched", "~$1,400 ea. Tele for both tripod cams."],
  ["Sigma 14-24mm f/2.8 DG DN Art (L-mount wide)", "Cameras & Lenses", 1, 1400, "Estimate", "~$1,399. Room-master angle. Confirm choice."],
  ["Owned: 2x Lumix S5 IIX + Sigma 24-70 II + kit", "Cameras & Lenses", 1, 0, "Owned", "Already owned. B-cams on gimbals."],
  ["DJI RS 4 Pro Combo (image TX + focus motor)", "Gimbals & Remote", 2, 1099, "Researched", "DJI direct $1,099. HD feed + remote control."],
  ["Hollyland Pyro H wireless TX/RX set", "Gimbals & Remote", 2, 400, "Estimate", "~$369-399/set. Gimbal cam feed to switcher."],
  ["vMix 4K perpetual license", "Switch/Stream/Record", 1, 1200, "Researched", "$1,200. Switch + graphics + stream + ISO."],
  ["Switchblade VMC12 PRO control surface", "Switch/Stream/Record", 1, 700, "Researched", "~$700. T-bar + PTZ joystick."],
  ["vMix 4K workstation (i9 / RTX 4070 / 64GB)", "Switch/Stream/Record", 1, 4000, "Estimate", "Purpose-built show PC. Final build quote needed."],
  ["Blackmagic DeckLink Quad HDMI Recorder", "Switch/Stream/Record", 1, 595, "Researched", "$595. 4 camera feeds into vMix."],
  ["Blackmagic Micro Converter SDI->HDMI", "Switch/Stream/Record", 2, 45, "Estimate", "~$45 ea. For the two BS1H SDI feeds."],
  ["Program / multiview monitor (27in)", "Switch/Stream/Record", 1, 350, "Estimate", "Director view: all cams + program."],
  ["Behringer X32 (32-ch digital console)", "Audio", 1, 2800, "Researched~", "Street ~$2,799. USB to vMix. You know X32."],
  ["Behringer S16 digital stage box", "Audio", 1, 550, "Researched~", "~$549. 16 stage inputs over one cable."],
  ["Shure SLXD24/SM58 handheld wireless", "Audio", 4, 769, "Researched", "$769 ea. Four handheld channels."],
  ["Shure SLXD14/WL185 lavalier wireless", "Audio", 4, 699, "Researched~", "~$699 ea. Four lav channels."],
  ["Shure UA844+SWB antenna distribution", "Audio", 1, 675, "Researched", "$675. May need a 2nd for 8ch."],
  ["Shure DMK57-52 drum mic kit", "Audio", 1, 400, "Estimate", "~$399. Kick + 3x SM57."],
  ["Band mics, Radial DI, stands, XLR cabling", "Audio", 1, 700, "Allowance", "Instrument capture + stage hardware."],
  ["Sony MDR-7506 monitoring headphones", "Audio", 1, 100, "Estimate", "~$99. Audio operator."],
  ["Hollyland Solidcom C1 Pro - 6 headsets", "Crew Comms", 1, 1949, "Researched", "$1,949. 1 master + 5 remote, full-duplex."],
  ["QSC K12.2 powered mains (2,000W 12in)", "PA", 2, 1000, "Researched", "~$999 ea. Front-of-house tops."],
  ["QSC KS118 powered sub (3,600W 18in)", "PA", 2, 1499, "Researched~", "~$1,499 ea. Low end."],
  ["QSC CP8 compact powered (stage monitors)", "PA", 4, 549, "Estimate", "~$549 ea. Band wedges."],
  ["Speaker stands, sub poles, PA cabling", "PA", 1, 400, "Allowance", "Stands + poles + runs."],
  ["LED lighting kit (3x COB + stands + softboxes)", "Lighting", 1, 1500, "Estimate", "Key/fill so performers read on stream."],
  ["Benro C373F + S8 PRO carbon tripod kit", "Camera Support", 2, 450, "Estimate", "~$450 ea. Handles body + 70-200."],
  ["Feelworld LUT7S 7in SDI/HDMI monitor", "Camera Support", 4, 350, "Estimate", "~$350 ea. BS1H has no screen."],
  ["SmallRig cages / plates / accessories", "Camera Support", 4, 200, "Estimate", "~$200 ea per-camera build-out."],
  ["Starlink Mini (hardware)", "Connectivity", 1, 250, "Researched", "~$249. Service is monthly (see Opex)."],
  ["Netgear Nighthawk M6 5G hotspot (backup)", "Connectivity", 1, 400, "Estimate", "~$400. Never ride a stream on one link."],
  ["Managed gigabit network switch", "Connectivity", 1, 150, "Estimate", "~$150. Ties vMix, control, tally, internet."],
  ["CyberPower 1500VA UPS", "Power", 1, 300, "Estimate", "~$300. Protects PC + switcher."],
  ["Furman power conditioner + distribution", "Power", 1, 400, "Estimate", "~$400. Clean power across positions."],
  ["V-mount battery kit (6x 99Wh + charger)", "Power", 1, 1200, "Estimate", "Powers cams/monitors off wall."],
  ["UHS-II V90 SD cards 128GB (6-pack)", "Media/Storage", 1, 780, "Estimate", "~$130 ea. Internal media."],
  ["Recording SSDs (2x 2TB) + backup drive", "Media/Storage", 1, 700, "Estimate", "Master record + backup copy."],
  ["SDI/BNC + HDMI runs, reels, gaff, labels", "Cabling", 1, 1500, "Allowance", "Itemize at purchase."],
  ["SKB/Gator/Pelican cases per subsystem", "Road Cases", 1, 4000, "Allowance", "Protects subsystems in transit."],
  ["Used Ford Transit 250 (high roof, low mi)", "Transport", 1, 32000, "Researched", "Used market $23k-48k (May 2026)."],
  ["Adrian Steel / Weather Guard shelving fit-out", "Transport", 1, 2000, "Estimate", "Secure gear mounting in van."],
];

// --- Monthly operating costs ------------------------------------------------
// [item, category, monthlyAmount|null, basis, notes]
const opex: [string, string, number | null, string, string][] = [
  ["Starlink service", "Connectivity", 165, "Placeholder", "~$165/mo (your est.). Confirm current Roam plan."],
  ["Cellular backup data plan", "Connectivity", null, "Needs figure", "Backup link data."],
  ["Equipment insurance (inland marine)", "Insurance", null, "Needs figure", "Get broker quote."],
  ["General liability insurance", "Insurance", null, "Needs figure", "Often venue-required."],
  ["Commercial auto insurance", "Insurance", null, "Needs figure", "For the Transit."],
  ["Van payment (0 if cash purchase)", "Vehicle", null, "Needs figure", "Only if financed."],
  ["Storage / parking", "Facilities", null, "Needs figure", "If van/gear stored off-site."],
  ["Software subscriptions", "Software", null, "Needs figure", "Editing/CRM (vMix is perpetual)."],
  ["Website / booking tools", "Software", null, "Needs figure", ""],
  ["Accounting / admin", "Admin", null, "Needs figure", "Bookkeeping software/service."],
  ["Maintenance reserve (van + gear)", "Reserve", null, "Needs figure", "Set-aside, not a bill."],
  ["Marketing", "Marketing", null, "Needs figure", ""],
  ["Fuel baseline (non-event)", "Vehicle", null, "Needs figure", ""],
];

// --- Service packages (placeholder names; prices nullable until set) ---------
const packages = [
  { name: "Comedy Capture", description: "Single-night stand-up capture, the wedge offering.", inclusions: "Multicam capture + clean audio + master recording + a few clips.", notes: "Flagship comedy offering. Price after costs confirmed." },
  { name: "Livestream + Recording", description: "Live broadcast plus simultaneous master record.", inclusions: "4-cam livestream + ISO/master record + audio mix.", notes: "" },
  { name: "Venue Broadcast", description: "Recurring filmed series for a venue.", inclusions: "Per-night broadcast package, recurring rate.", notes: "Pitch to repeat venues (e.g. Craft Kitchen)." },
  { name: "Full Mobile Production", description: "Complete rig: cameras, PA, lighting, comms, connectivity.", inclusions: "Everything — broadcast + sound reinforcement + lighting.", notes: "Music/corporate/large events." },
  { name: "Add-on Editing/Clip", description: "Post-production add-on: edited set, multicam, social clips.", inclusions: "Editing per deliverable spec.", notes: "Attach to any package." },
];

// --- Starter tasks (from the Active Projects sheet) --------------------------
const tasks = [
  { title: "Lock equipment budget (firm quotes)", category: "Equipment", owner: "Kyle", priority: "High", status: "In progress", notes: "Turn each Estimate/Allowance into a real quote or defer to Phase 2." },
  { title: "Size the raise (capital + runway)", category: "Finance", owner: "Kyle", priority: "High", status: "Not started", notes: "Gather monthly opex, events/mo, and day rate; build the model." },
  { title: "Insurance quotes (GL, inland marine, auto)", category: "Admin", owner: "Kyle", priority: "High", status: "Not started", notes: "Call 2-3 brokers. Opex, not capital." },
  { title: "Book 2-3 proof-of-concept comedy shows", category: "Sales", owner: "Kyle", priority: "High", status: "Not started", notes: "Use owned S5 IIX + rentals; build demo reel; test workflow." },
  { title: "Define service packages + pricing", category: "Sales", owner: "Kyle", priority: "Med", status: "Not started", notes: "Draft 3-4 packages; price after costs are confirmed." },
  { title: "Client contract + deposit template", category: "Legal", owner: "Kyle", priority: "Med", status: "Not started", notes: "Needed before first paid job." },
  { title: "Purchase Ford Transit 250", category: "Equipment", owner: "Kyle", priority: "High", status: "Not started", notes: "Decide cash vs. finance; then shelving/fit-out. ~$34k line." },
  { title: "YouTube / Open Mic Explorer content", category: "Marketing", owner: "Stoned Goose Crew", priority: "Med", status: "In progress", notes: "Keep the comedy brand warm while building." },
];

// --- Owned equipment (assets) -----------------------------------------------
// Only gear actually owned today (per the founder's spec). The rest of the rig
// is still in the capital budget / quote tracker until purchased.
// [item, category, brandModel, qty, condition, notes]
const assets: [string, string, string, number, string, string][] = [
  ["Lumix S5 IIX", "Cameras", "Panasonic S5 IIX", 2, "Good", "B-cameras on gimbals. Already owned."],
  ["Sigma 24-70mm f/2.8 DG DN Art II", "Lenses", "Sigma 24-70 f/2.8 Art II (L-mount)", 1, "Good", "Shared standard zoom. Already owned."],
  ["Kit lens", "Lenses", "L-mount kit lens", 1, "Good", "Already owned."],
];

async function main() {
  // Idempotency guard: if contacts already exist, assume seeded and bail.
  const existing = await prisma.contact.count();
  if (existing > 0) {
    console.log(`Seed skipped — database already has ${existing} contacts.`);
    return;
  }

  console.log("Seeding Stoned Goose Hub with real company data…");

  // Settings singleton (12% contingency, 6-month default runway).
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", contingencyRate: 0.12, runwayMonths: 6 },
  });

  // Contacts.
  const contactByName = new Map<string, string>();
  const allContacts = [
    ...venues.map((v) => ({ ...v, type: "Venue" as const })),
    ...crew.map((c) => ({ ...c, type: "Crew" as const })),
    ...comedians.map((c) => ({ ...c, type: "Comedian/Talent" as const })),
  ];
  for (const c of allContacts) {
    const created = await prisma.contact.create({ data: c });
    contactByName.set(created.name, created.id);
  }

  // Pipeline leads (linked to their contact).
  let pos = 0;
  for (const l of leads) {
    const contactId = contactByName.get(l.contactName);
    if (!contactId) continue;
    await prisma.pipelineEntry.create({
      data: {
        contactId,
        stage: l.stage,
        clientType: l.clientType,
        serviceNeeded: l.serviceNeeded,
        notes: l.notes || null,
        position: pos++,
      },
    });
  }

  // Capital items.
  await prisma.capitalItem.createMany({
    data: capital.map(([item, category, qty, unitPrice, basis, notes], i) => ({
      item,
      category,
      qty,
      unitPrice,
      priceConfidence: basisToConfidence[basis],
      notes: notes || null,
      position: i,
    })),
  });

  // Opex items.
  await prisma.opexItem.createMany({
    data: opex.map(([item, category, monthlyAmount, basis, notes], i) => ({
      item,
      category,
      monthlyAmount,
      basis,
      notes: notes || null,
      position: i,
    })),
  });

  // Packages.
  await prisma.service.createMany({
    data: packages.map((p, i) => ({ ...p, position: i })),
  });

  // Tasks.
  await prisma.task.createMany({ data: tasks });

  // Assets (owned equipment).
  await prisma.asset.createMany({
    data: assets.map(([item, category, brandModel, qty, condition, notes], i) => ({
      item,
      category,
      brandModel,
      qty,
      condition,
      storageLocation: "Home base (Burien)",
      notes,
      position: i,
    })),
  });

  // Quote tracker — seed every capital line that is NOT a confirmed price, so
  // the "needs a quote" workflow has real entries to chase. Confirmed lines and
  // $0 owned lines are skipped. This mirrors the founder's Quote Tracker sheet.
  const quoteSeeds = capital
    .filter(([, , , unitPrice, basis]) => basis !== "Researched" && basis !== "Owned" && unitPrice > 0)
    .map(([item, , qty, unitPrice, basis, notes], i) => ({
      item,
      // Carry the extended line price so the tracker shows the budgeted figure.
      price: unitPrice * qty,
      status: basisToConfidence[basis], // Approximate | Quote needed | Placeholder
      notes: notes || null,
      position: i,
    }));
  await prisma.quote.createMany({ data: quoteSeeds });

  const summary = {
    contacts: await prisma.contact.count(),
    leads: await prisma.pipelineEntry.count(),
    capitalItems: await prisma.capitalItem.count(),
    opexItems: await prisma.opexItem.count(),
    packages: await prisma.service.count(),
    tasks: await prisma.task.count(),
    assets: await prisma.asset.count(),
    quotes: await prisma.quote.count(),
  };
  console.log("Seed complete:", summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
