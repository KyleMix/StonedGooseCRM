// Minimal Twenty REST client. Used by the webhook glue services to upsert
// Persons/Companies and update custom Job records when Documenso/Cal.com fire.
//
// Twenty's REST surface lives at /rest/<objectNamePlural>. Auth is a bearer
// API key generated in the UI (Settings → Developers → API Keys).

export interface TwentyClientOptions {
  baseUrl: string; // e.g. http://server:3000
  apiKey: string;
}

export class TwentyClient {
  constructor(private readonly opts: TwentyClientOptions) {}

  private async request<T = unknown>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${this.opts.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twenty ${method} ${path} → ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  }

  // Find a Person by email. Returns the first match or null.
  async findPersonByEmail(email: string): Promise<{ id: string } | null> {
    const filter = encodeURIComponent(`emails.primaryEmail[eq]:"${email}"`);
    const data = await this.request<{ data: { people: Array<{ id: string }> } }>(
      "GET",
      `/rest/people?filter=${filter}&limit=1`,
    );
    return data.data.people[0] ?? null;
  }

  async createPerson(input: {
    name: { firstName: string; lastName?: string };
    emails?: { primaryEmail: string };
  }): Promise<{ id: string }> {
    const data = await this.request<{ data: { createPerson: { id: string } } }>(
      "POST",
      "/rest/people",
      input,
    );
    return data.data.createPerson;
  }

  // Upsert: find-or-create by email. Returns the Person id.
  async upsertPersonByEmail(email: string, firstName: string, lastName?: string): Promise<string> {
    const existing = await this.findPersonByEmail(email);
    if (existing) return existing.id;
    const created = await this.createPerson({
      name: { firstName, lastName },
      emails: { primaryEmail: email },
    });
    return created.id;
  }

  // Update a custom Job record by id. Path is /rest/jobs/:id (Twenty pluralizes).
  async updateJob(id: string, patch: Record<string, unknown>): Promise<void> {
    await this.request("PATCH", `/rest/jobs/${id}`, patch);
  }

  async createJob(input: Record<string, unknown>): Promise<{ id: string }> {
    const data = await this.request<{ data: { createJob: { id: string } } }>(
      "POST",
      "/rest/jobs",
      input,
    );
    return data.data.createJob;
  }

  // Find a Job by an externalId field. Caller must have added an `externalId`
  // Text field on the Job custom object (per docs/twenty-custom-objects.md).
  async findJobByExternalId(externalId: string): Promise<{ id: string } | null> {
    const filter = encodeURIComponent(`externalId[eq]:"${externalId}"`);
    const data = await this.request<{ data: { jobs: Array<{ id: string }> } }>(
      "GET",
      `/rest/jobs?filter=${filter}&limit=1`,
    );
    return data.data.jobs[0] ?? null;
  }
}
