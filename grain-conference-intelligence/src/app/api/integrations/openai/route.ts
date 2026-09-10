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
    return statusResponse({ configured: false, source: "none", model: openaiModel() }, 403);
  }

  const secret = integrationCredentialSecret();
  if (!secret) {
    return statusResponse({ configured: false, source: "none", model: openaiModel() }, 503);
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return statusResponse({ configured: false, source: "none", model: openaiModel() }, 400);
  }

  const parsed = configureSchema.safeParse(raw);
  if (!parsed.success) {
    return statusResponse({ configured: false, source: "none", model: openaiModel() }, 400);
  }

  const encrypted = encryptApiKey(parsed.data.apiKey, secret);
  const response = statusResponse({
    configured: true,
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
    return statusResponse({ configured: false, source: "none", model: openaiModel() }, 403);
  }

  const response = statusResponse({ configured: false, source: "none", model: openaiModel() });
  response.headers.set("Set-Cookie", clearCredentialCookie(credentialCookieSecure()));
  return response;
}

function statusResponse(payload: OpenAICredentialStatus, status = 200): Response {
  const response = Response.json(payload, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
