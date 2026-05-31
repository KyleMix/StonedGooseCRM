-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "org" TEXT,
    "role" TEXT,
    "type" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "website" TEXT,
    "lastContacted" DATETIME,
    "nextFollowUp" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PipelineEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "clientType" TEXT,
    "serviceNeeded" TEXT,
    "estValue" REAL,
    "lastContact" DATETIME,
    "nextFollowUp" DATETIME,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "jobId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PipelineEntry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PipelineEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "clientId" TEXT,
    "venueId" TEXT,
    "date" DATETIME,
    "eventType" TEXT,
    "packageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Inquiry',
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "depositCleared" BOOLEAN NOT NULL DEFAULT false,
    "agreedPrice" REAL,
    "deliverables" TEXT,
    "deliveryDate" DATETIME,
    "runOfShow" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Service" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobCrew" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "roleNote" TEXT,
    CONSTRAINT "JobCrew_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobCrew_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GearChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "system" TEXT,
    "item" TEXT NOT NULL,
    "qty" TEXT,
    "packed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GearChecklistItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "owner" TEXT,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'Med',
    "status" TEXT NOT NULL DEFAULT 'Not started',
    "notes" TEXT,
    "jobId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CapitalItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "category" TEXT,
    "qty" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL,
    "priceConfidence" TEXT NOT NULL DEFAULT 'Quote needed',
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OpexItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "category" TEXT,
    "monthlyAmount" REAL,
    "basis" TEXT NOT NULL DEFAULT 'Needs figure',
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "contingencyRate" REAL NOT NULL DEFAULT 0.12,
    "runwayMonths" INTEGER NOT NULL DEFAULT 6
);

-- CreateTable
CREATE TABLE "RevenueEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME,
    "clientId" TEXT,
    "service" TEXT,
    "invoiceAmount" REAL,
    "depositReceived" REAL NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Unpaid',
    "profitEstimate" REAL,
    "notes" TEXT,
    "jobId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RevenueEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RevenueEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME,
    "vendor" TEXT,
    "category" TEXT,
    "amount" REAL,
    "oneTimeOrRecurring" TEXT NOT NULL DEFAULT 'One-time',
    "receiptSaved" BOOLEAN NOT NULL DEFAULT false,
    "taxDeductible" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inclusions" TEXT,
    "basePrice" REAL,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'Quote needed',
    "dateQuoted" DATETIME,
    "link" TEXT,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item" TEXT NOT NULL,
    "category" TEXT,
    "brandModel" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "warranty" TEXT,
    "storageLocation" TEXT,
    "condition" TEXT DEFAULT 'Good',
    "maintenanceSchedule" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "platform" TEXT,
    "format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Idea',
    "owner" TEXT,
    "dueDate" DATETIME,
    "publishDate" DATETIME,
    "hook" TEXT,
    "thumbnailIdea" TEXT,
    "caption" TEXT,
    "link" TEXT,
    "performanceNotes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekOf" DATETIME NOT NULL,
    "wins" TEXT,
    "problems" TEXT,
    "moneyStatus" TEXT,
    "priorities" TEXT,
    "risks" TEXT,
    "decisionsNeeded" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PipelineEntry_jobId_key" ON "PipelineEntry"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "JobCrew_jobId_contactId_key" ON "JobCrew"("jobId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_weekOf_key" ON "WeeklyReview"("weekOf");

