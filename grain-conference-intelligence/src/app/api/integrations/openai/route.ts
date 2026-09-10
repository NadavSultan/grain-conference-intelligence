import { z } from "zod";

import {
  CREDENTIAL_MAX_AGE_SECONDS,
  clearCredentialCookie,
  credentialCookieSecure,
  credentialStatus,
  encryptApiKey,
  integrationCredentialSecret,
  isSameOrigin,
  openaiModel,
  serializeCredentialCookie,
  type OpenAICredentialStatus,
} from "@/features/integrations/openai-credentials";

const configureSchema = z.object({
  apiKey: z.string().trim().min(20).max(512),
});

export async function GET(request: Request): Promise<Response> {
  return statusResponse(credentialStatus(request));
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return statusResponse(unconfiguredStatus(), 403);
  }

  const secret = integrationCredentialSecret();
  if (!secret) {
    return statusResponse(unconfiguredStatus(), 503);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return statusResponse(unconfiguredStatus(), 400);
  }

  const parsed = configureSchema.safeParse(raw);
  if (!parsed.success) {
    return statusResponse(unconfiguredStatus(), 400);
  }

  const encrypted = encryptApiKey(parsed.data.apiKey, secret);
  const response = statusResponse({
    configured: true,
    liveConfigured: Boolean(process.env.AI_USAGE_SECRET),
    source: "session",
    model: openaiModel(),
  });
  response.headers.set(
    "Set-Cookie",
    serializeCredentialCookie(encrypted, {
      maxAge: CREDENTIAL_MAX_AGE_SECONDS,
      secure: credentialCookieSecure(),
    }),
  );
  return response;
}

export async function DELETE(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return statusResponse(unconfiguredStatus(), 403);
  }

  const response = statusResponse(unconfiguredStatus());
  response.headers.set("Set-Cookie", clearCredentialCookie(credentialCookieSecure()));
  return response;
}

function unconfiguredStatus(): OpenAICredentialStatus {
  return {
    configured: false,
    liveConfigured: false,
    source: "none",
    model: openaiModel(),
  };
}

function statusResponse(payload: OpenAICredentialStatus, status = 200): Response {
  const response = Response.json(payload, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
