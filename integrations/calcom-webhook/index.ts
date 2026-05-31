// Cal.com → Twenty webhook glue.
//
// When Cal.com fires `BOOKING_CREATED`, we upsert a Person by attendee email
// and create a Twenty Job with `date` set to the booking start time and
// `externalId` set to the Cal.com booking uid so future updates can match.

import Fastify from "fastify";
import { TwentyClient } from "../shared/twenty-client.js";
import { verifyHmacSignature } from "../shared/verify-signature.js";

const PORT = Number(process.env.PORT ?? 3004);
const TWENTY_API_URL = process.env.TWENTY_API_URL ?? "http://server:3000";
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? "";
const WEBHOOK_SECRET = process.env.CALCOM_WEBHOOK_SECRET ?? "";

const app = Fastify({ logger: true });

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

interface CalcomBooking {
  triggerEvent: string;
  payload?: {
    uid?: string;
    title?: string;
    startTime?: string;
    attendees?: Array<{ email?: string; name?: string }>;
  };
}

app.post("/webhooks/calcom", async (req, reply) => {
  if (!TWENTY_API_KEY) {
    req.log.warn("TWENTY_API_KEY not set — dropping webhook");
    return reply.code(503).send({ error: "TWENTY_API_KEY not configured" });
  }

  const { raw, parsed } = req.body as { raw: string; parsed: CalcomBooking };

  const signature =
    (req.headers["x-cal-signature-256"] as string | undefined) ??
    (req.headers["x-signature"] as string | undefined);
  if (!verifyHmacSignature(raw, signature, WEBHOOK_SECRET)) {
    return reply.code(401).send({ error: "invalid signature" });
  }

  if (parsed.triggerEvent !== "BOOKING_CREATED") {
    return reply.send({ ignored: true, event: parsed.triggerEvent });
  }

  const attendee = parsed.payload?.attendees?.[0];
  const email = attendee?.email;
  if (!email) {
    return reply.send({ ignored: true, reason: "no attendee email" });
  }

  const [firstName, ...rest] = (attendee?.name ?? email).split(" ");
  const lastName = rest.join(" ") || undefined;

  const twenty = new TwentyClient({ baseUrl: TWENTY_API_URL, apiKey: TWENTY_API_KEY });

  const personId = await twenty.upsertPersonByEmail(email, firstName, lastName);

  const job = await twenty.createJob({
    name: parsed.payload?.title ?? `Booking ${parsed.payload?.uid}`,
    date: parsed.payload?.startTime,
    status: "Inquiry",
    externalId: parsed.payload?.uid,
    client: personId,
  });

  req.log.info({ jobId: job.id, personId, uid: parsed.payload?.uid }, "created Job from Cal.com booking");
  return reply.send({ ok: true, jobId: job.id });
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
