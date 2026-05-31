// Documenso → Twenty webhook glue.
//
// When Documenso fires `document.completed`, we look up the associated Job in
// Twenty by its externalId (which we set when creating the envelope), then
// flip contractSigned to true. The booking-rule workflow in Twenty
// (docs/twenty-custom-objects.md) takes over from there: if depositCleared is
// also true, status auto-flips to "Booked".

import Fastify from "fastify";
import { TwentyClient } from "../shared/twenty-client.js";
import { verifyHmacSignature } from "../shared/verify-signature.js";

const PORT = Number(process.env.PORT ?? 3003);
const TWENTY_API_URL = process.env.TWENTY_API_URL ?? "http://server:3000";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? "";
const WEBHOOK_SECRET = process.env.DOCUMENSO_WEBHOOK_SECRET ?? "";

const app = Fastify({ logger: true });

// Capture the raw body so we can verify the HMAC signature exactly as sent.
app.addContentTypeParser(
  "application/json",
  { parseAs: "string" },
  (_req, body, done) => {
    try {
      done(null, { raw: body, parsed: JSON.parse(body as string) });
    } catch (err) {
      done(err as Error);
    }
  },
);

app.get("/healthz", async () => ({ ok: true }));

interface DocumensoCompleted {
  event: string;
  payload?: {
    id?: number | string;
    externalId?: string | null;
    status?: string;
  };
}

app.post("/webhooks/documenso", async (req, reply) => {
  if (!TWENTY_API_KEY) {
    req.log.warn("TWENTY_API_KEY not set — dropping webhook");
    return reply.code(503).send({ error: "TWENTY_API_KEY not configured" });
  }

  const { raw, parsed } = req.body as { raw: string; parsed: DocumensoCompleted };

  const signature =
    (req.headers["x-documenso-signature"] as string | undefined) ??
    (req.headers["x-signature"] as string | undefined);
  if (!verifyHmacSignature(raw, signature, WEBHOOK_SECRET)) {
    return reply.code(401).send({ error: "invalid signature" });
  }

  if (parsed.event !== "document.completed") {
    return reply.send({ ignored: true, event: parsed.event });
  }

  const externalId = parsed.payload?.externalId ?? null;
  if (!externalId) {
    req.log.warn({ payload: parsed.payload }, "completed document has no externalId");
    return reply.send({ ignored: true, reason: "no externalId" });
  }

  const twenty = new TwentyClient({ baseUrl: TWENTY_API_URL, apiKey: TWENTY_API_KEY });
  const job = await twenty.findJobByExternalId(externalId);
  if (!job) {
    req.log.warn({ externalId }, "no matching Job in Twenty");
    return reply.send({ ignored: true, reason: "no matching job" });
  }

  await twenty.updateJob(job.id, { contractSigned: true });
  req.log.info({ jobId: job.id, externalId }, "flipped Job.contractSigned");
  return reply.send({ ok: true, jobId: job.id });
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
