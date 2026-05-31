// Minimal Twenty REST client. Used by the webhook glue services to look up
// and update Job records.
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

  // Find a Job by an `externalId` Text field (added in docs/twenty-custom-objects.md).
  async findJobByExternalId(externalId: string): Promise<{ id: string } | null> {
    const filter = encodeURIComponent(`externalId[eq]:"${externalId}"`);
    const data = await this.request<{ data: { jobs: Array<{ id: string }> } }>(
      "GET",
      `/rest/jobs?filter=${filter}&limit=1`,
    );
    return data.data.jobs[0] ?? null;
  }

  // Update a custom Job record by id.
  async updateJob(id: string, patch: Record<string, unknown>): Promise<void> {
    await this.request("PATCH", `/rest/jobs/${id}`, patch);
  }
}
