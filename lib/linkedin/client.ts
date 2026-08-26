import { pipeline } from "@/lib/pipeline/config";

export type LinkedInPostInput = {
  text: string;
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

async function registerImageUpload(
  token: string,
  personUrn: string
): Promise<{ uploadUrl: string; asset: string } | null> {
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
    return null;
  }

  const data = (await res.json()) as RegisterUploadResponse;
  const mechanism = data.value?.uploadMechanism ?? {};
  const uploadUrl =
    Object.values(mechanism).find((m) => m?.uploadUrl)?.uploadUrl ?? "";
  const asset = data.value?.asset ?? "";
  if (!uploadUrl || !asset) return null;
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
    const token = pipeline.linkedin.token.trim();
    const person = pipeline.linkedin.person.trim();
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
      const imgRes = await fetch(input.imageUrl);
      if (!imgRes.ok) {
        return {
          ok: false,
          error: `Failed to download image (${imgRes.status})`,
        };
      }
      const contentType = imgRes.headers.get("content-type") || "image/png";
      const bytes = await imgRes.arrayBuffer();
      const registered = await registerImageUpload(token, person);
      if (!registered) {
        return { ok: false, error: "LinkedIn registerUpload failed" };
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
      return {
        ok: false,
        error: `ugcPosts ${res.status}: ${errText.slice(0, 240)}`,
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
