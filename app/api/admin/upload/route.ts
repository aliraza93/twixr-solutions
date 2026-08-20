import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/cms/auth";

export const runtime = "nodejs";

/**
 * Mints a short-lived Blob client token. The browser then uploads
 * straight to Vercel Blob — no file bytes pass through this function.
 * Uses BLOB_READ_WRITE_TOKEN only (no OIDC).
 */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token || token.length < 20) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN is missing on this deployment. In the Blob store → Connect to Project, enable “Add a read-write token”, Save Changes, then Redeploy.",
      },
      { status: 500 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  }

  try {
    const json = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
          "image/svg+xml",
          "application/pdf",
        ],
        maximumSizeInBytes: 4.5 * 1024 * 1024,
        addRandomSuffix: true,
      }),
    });
    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message.slice(0, 220) }, { status: 400 });
  }
}
