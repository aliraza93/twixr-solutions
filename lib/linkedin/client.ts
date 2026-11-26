import { cloudinaryAsJpeg } from "@/lib/media/cloudinary-url";
import { pipeline } from "@/lib/pipeline/config";

export type LinkedInPostInput = {
  text: string;
  /**
   * Post as someone other than LINKEDIN_PERSON_URN, e.g. a company page
   * (urn:li:organization:...). Needs a token with the matching scope.
   */
  author?: string;
  /** Token for `author`; defaults to LINKEDIN_ACCESS_TOKEN. */
  token?: string;
  imageUrl?: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
};

export type LinkedInPostResult = {
  ok: boolean;
  externalId?: string;
  error?: string;
};

type RegisterUploadResponse = {
  value?: {
    asset?: string;
    uploadMechanism?: Record<
      string,
      { uploadUrl?: string }
    >;
  };
};

/**
 * A short, readable reason from a failed LinkedIn response. An expired or
 * revoked token gets its own message, because the fix is a new token in
 * Vercel (LINKEDIN_ACCESS_TOKEN) rather than a retry.
 */
export function describeLinkedInError(
  step: string,
  status: number,
  body: string
): string {
  let code = "";
  let message = "";
  try {
    const parsed = JSON.parse(body) as { code?: string; message?: string };
    code = parsed.code ?? "";
    message = parsed.message ?? "";
  } catch {
    message = body;
  }
  if (status === 401 || code === "EXPIRED_ACCESS_TOKEN" || code === "REVOKED_ACCESS_TOKEN") {
    return `LinkedIn token expired or revoked (${step} ${status}${code ? ` ${code}` : ""}): renew LINKEDIN_ACCESS_TOKEN in Vercel`;
  }
  const detail = [code, message].filter(Boolean).join(": ").slice(0, 200);
  return `LinkedIn ${step} failed (${status}${detail ? ` ${detail}` : ""})`;
}

async function registerImageUpload(
  token: string,
  personUrn: string
): Promise<{ uploadUrl: string; asset: string } | { error: string }> {
  const res = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          owner: personUrn,
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("LinkedIn registerUpload failed:", res.status, body);
    return { error: describeLinkedInError("registerUpload", res.status, body) };
  }

  const data = (await res.json()) as RegisterUploadResponse;
  const mechanism = data.value?.uploadMechanism ?? {};
  const uploadUrl =
    Object.values(mechanism).find((m) => m?.uploadUrl)?.uploadUrl ?? "";
  const asset = data.value?.asset ?? "";
  if (!uploadUrl || !asset) {
    return { error: "LinkedIn registerUpload returned no upload URL" };
  }
  return { uploadUrl, asset };
}

async function putImageBytes(
  token: string,
  uploadUrl: string,
  bytes: ArrayBuffer,
  contentType: string
): Promise<boolean> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: Buffer.from(bytes),
  });
  return res.ok;
}

export async function postToLinkedIn(
  input: LinkedInPostInput
): Promise<LinkedInPostResult> {
  try {
    const token = (input.token || pipeline.linkedin.token).trim();
    const person = (input.author || pipeline.linkedin.person).trim();
    if (!token || !person) {
      return { ok: false, error: "LinkedIn credentials missing" };
    }

    const text = input.text?.trim() ?? "";
    if (!text) {
      return { ok: false, error: "Empty post body" };
    }
    if (text.length > 3000) {
      return { ok: false, error: "Post exceeds 3000 characters" };
    }

    const visibility = input.visibility ?? "PUBLIC";
    let shareMediaCategory: "NONE" | "IMAGE" = "NONE";
    let media:
      | Array<{
          status: string;
          media: string;
          title?: { text: string };
        }>
      | undefined;

    if (input.imageUrl) {
      // Stored images are WebP; LinkedIn's image upload takes JPG/PNG/GIF only.
      const imgRes = await fetch(cloudinaryAsJpeg(input.imageUrl));
      if (!imgRes.ok) {
        return {
          ok: false,
          error: `Failed to download image (${imgRes.status})`,
        };
      }
      const contentType = imgRes.headers.get("content-type") || "image/png";
      const bytes = await imgRes.arrayBuffer();
      const registered = await registerImageUpload(token, person);
      if ("error" in registered) {
        return { ok: false, error: registered.error };
      }
      const uploaded = await putImageBytes(
        token,
        registered.uploadUrl,
        bytes,
        contentType
      );
      if (!uploaded) {
        return { ok: false, error: "LinkedIn image PUT failed" };
      }
      shareMediaCategory = "IMAGE";
      media = [
        {
          status: "READY",
          media: registered.asset,
          title: { text: "Twixr Solutions" },
        },
      ];
    }

    const body = {
      author: person,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory,
          ...(media ? { media } : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": visibility,
      },
    };

    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("LinkedIn ugcPosts failed:", res.status, errText);
      return {
        ok: false,
        error: describeLinkedInError("ugcPosts", res.status, errText),
      };
    }

    const externalId =
      res.headers.get("x-restli-id") ||
      ((await res.json().catch(() => null)) as { id?: string } | null)?.id ||
      undefined;

    return { ok: true, externalId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown LinkedIn error",
    };
  }
}
