import { createElement, type ReactNode } from "react";
import { ImageResponse } from "next/og";
import { uploadToCloudinary } from "@/lib/cms/cloudinary";

const PINE = "#0f5132";
const LIME = "#bef03a";
const INK = "#0b0f0d";
const CANVAS = "#ffffff";

export async function renderOgCover(input: {
  title: string;
  category: string;
  slug?: string;
}): Promise<string> {
  const root: ReactNode = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: CANVAS,
        padding: 64,
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
        },
      },
      createElement("div", {
        style: {
          width: 14,
          height: 14,
          background: LIME,
        },
      }),
      createElement(
        "div",
        {
          style: {
            fontSize: 28,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: PINE,
          },
        },
        input.category || "Insights"
      )
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          fontSize: 64,
          lineHeight: 1.1,
          fontWeight: 700,
          color: INK,
          maxWidth: 1000,
        },
      },
      input.title.slice(0, 120)
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: 32,
            fontWeight: 700,
            color: PINE,
          },
        },
        "Twixr Solutions"
      ),
      createElement("div", {
        style: {
          width: 120,
          height: 8,
          background: LIME,
        },
      })
    )
  );

  const response = new ImageResponse(root, { width: 1200, height: 630 });
  const buffer = Buffer.from(await response.arrayBuffer());
  const file = new File(
    [new Uint8Array(buffer)],
    `og-${input.slug || Date.now()}.png`,
    { type: "image/png" }
  );
  const uploaded = await uploadToCloudinary(file);
  return uploaded.url;
}
