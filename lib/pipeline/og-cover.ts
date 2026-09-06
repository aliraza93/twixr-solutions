import { createElement, type ReactNode } from "react";
import { ImageResponse } from "next/og";
import { uploadToCloudinary } from "@/lib/cms/cloudinary";
import {
  brandStyleById,
  pickBrandStyle,
  type BrandStyle,
} from "@/lib/pipeline/brand-styles";

function patternLayer(style: BrandStyle): ReactNode | null {
  const { pattern, muted, accent } = style.og;
  if (pattern === "none") return null;

  if (pattern === "dots") {
    const dots: ReactNode[] = [];
    for (let y = 0; y < 18; y += 1) {
      for (let x = 0; x < 32; x += 1) {
        dots.push(
          createElement("div", {
            key: `${x}-${y}`,
            style: {
              position: "absolute",
              left: 24 + x * 38,
              top: 24 + y * 36,
              width: 3,
              height: 3,
              borderRadius: 99,
              background: muted,
              opacity: 0.22,
            },
          })
        );
      }
    }
    return createElement(
      "div",
      { style: { position: "absolute", inset: 0, display: "flex" } },
      ...dots
    );
  }

  if (pattern === "lines") {
    const lines: ReactNode[] = [];
    for (let i = 0; i < 24; i += 1) {
      lines.push(
        createElement("div", {
          key: i,
          style: {
            position: "absolute",
            left: 0,
            right: 0,
            top: 40 + i * 28,
            height: 1,
            background: muted,
            opacity: 0.12,
          },
        })
      );
    }
    return createElement(
      "div",
      { style: { position: "absolute", inset: 0, display: "flex" } },
      ...lines
    );
  }

  return createElement("div", {
    style: {
      position: "absolute",
      width: 520,
      height: 520,
      borderRadius: 999,
      right: -80,
      top: -120,
      background: accent,
      opacity: 0.16,
    },
  });
}

function mark(style: BrandStyle): ReactNode {
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
      },
    },
    createElement(
      "div",
      {
        style: {
          width: 48,
          height: 48,
          borderRadius: 10,
          background: style.og.panel,
          color: style.og.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          position: "relative",
        },
      },
      "TX",
      createElement("div", {
        style: {
          position: "absolute",
          width: 7,
          height: 7,
          borderRadius: 99,
          background: style.og.accent,
          top: 8,
          right: 8,
        },
      })
    ),
    createElement(
      "div",
      {
        style: {
          fontSize: 26,
          fontWeight: 700,
          color: style.og.ink,
        },
      },
      "Twixr Solutions"
    )
  );
}

export async function renderOgCover(input: {
  title: string;
  category: string;
  slug?: string;
  /** Force a style; otherwise pick randomly each run */
  styleId?: string;
}): Promise<{ url: string; styleId: string }> {
  const active = input.styleId
    ? brandStyleById(input.styleId)
    : pickBrandStyle();

  const title = input.title.slice(0, 110);
  const category = (input.category || "Insights").toUpperCase();
  const align = active.og.titleAlign;

  const root: ReactNode = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: active.og.background,
        color: active.og.ink,
        padding: 64,
        position: "relative",
        overflow: "hidden",
      },
    },
    patternLayer(active),
    active.id === "lime-slash"
      ? createElement("div", {
          style: {
            position: "absolute",
            width: 280,
            height: 900,
            background: active.og.accent,
            right: 120,
            top: -80,
            transform: "rotate(18deg)",
            opacity: 0.9,
          },
        })
      : null,
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 28,
          position: "relative",
        },
      },
      active.og.showMark ? mark(active) : null,
      createElement(
        "div",
        {
          style: {
            display: "flex",
            fontSize: 22,
            letterSpacing: "0.16em",
            textTransform: "uppercase" as const,
            color: active.og.accent,
            fontWeight: 600,
          },
        },
        category
      )
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 20,
          position: "relative",
          alignItems: align === "center" ? "center" : "flex-start",
          textAlign: align,
          maxWidth: align === "center" ? 980 : 920,
          alignSelf: align === "center" ? "center" : "flex-start",
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            fontSize: title.length > 70 ? 48 : 58,
            lineHeight: 1.08,
            fontWeight: 700,
            color: active.og.ink,
            letterSpacing: "-0.03em",
          },
        },
        title
      ),
      createElement("div", {
        style: {
          width: 96,
          height: 6,
          background: active.og.accent,
          borderRadius: 4,
        },
      })
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: 20,
            color: active.og.muted,
            letterSpacing: "0.04em",
          },
        },
        "twixrsolutions.com"
      ),
      createElement(
        "div",
        {
          style: {
            fontSize: 16,
            color: active.og.accent,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
          },
        },
        active.label
      )
    )
  );

  const response = new ImageResponse(root, { width: 1200, height: 630 });
  const buffer = Buffer.from(await response.arrayBuffer());
  const file = new File(
    [new Uint8Array(buffer)],
    `og-${input.slug || Date.now()}-${active.id}.png`,
    { type: "image/png" }
  );
  const uploaded = await uploadToCloudinary(file);
  return { url: uploaded.url, styleId: active.id };
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Composite a crisp headline + domain lockup over a text-free AI background to
 * produce a 1080x1080 LinkedIn card. Text is rendered by Satori (next/og), so it
 * is always legible and correctly spelled - the image model paints no text.
 */
export async function renderLinkedInCard(input: {
  backgroundDataUri: string;
  title: string;
  category?: string;
  styleId?: string;
  slug?: string;
}): Promise<{ url: string; styleId: string }> {
  const active = input.styleId
    ? brandStyleById(input.styleId)
    : pickBrandStyle();
  const bg = active.og.background;
  const title = input.title.slice(0, 90);
  const category = (input.category || "Twixr Solutions").toUpperCase();
  const fontSize = title.length > 42 ? 60 : title.length > 26 ? 72 : 86;

  const root: ReactNode = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: bg,
      },
    },
    createElement("img", {
      src: input.backgroundDataUri,
      width: 1080,
      height: 1080,
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: 1080,
        height: 1080,
        objectFit: "cover",
      },
    }),
    createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 640,
        display: "flex",
        background: `linear-gradient(180deg, ${hexToRgba(bg, 0.94)} 0%, ${hexToRgba(bg, 0.72)} 45%, ${hexToRgba(bg, 0)} 100%)`,
      },
    }),
    createElement("div", {
      style: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 260,
        display: "flex",
        background: `linear-gradient(0deg, ${hexToRgba(bg, 0.94)} 0%, ${hexToRgba(bg, 0)} 100%)`,
      },
    }),
    createElement(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: 76,
        },
      },
      createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 30 } },
        mark(active),
        createElement(
          "div",
          {
            style: {
              display: "flex",
              fontSize: 24,
              letterSpacing: "0.16em",
              textTransform: "uppercase" as const,
              color: active.og.accent,
              fontWeight: 600,
            },
          },
          category
        )
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 900,
          },
        },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              fontSize,
              lineHeight: 1.05,
              fontWeight: 700,
              color: active.og.ink,
              letterSpacing: "-0.03em",
            },
          },
          title
        ),
        createElement("div", {
          style: {
            width: 108,
            height: 7,
            background: active.og.accent,
            borderRadius: 4,
            display: "flex",
          },
        })
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            color: active.og.ink,
            letterSpacing: "0.04em",
            fontWeight: 600,
          },
        },
        "twixrsolutions.com"
      )
    )
  );

  const response = new ImageResponse(root, { width: 1080, height: 1080 });
  const buffer = Buffer.from(await response.arrayBuffer());
  const file = new File(
    [new Uint8Array(buffer)],
    `${input.slug || `li-${Date.now()}`}-${active.id}.png`,
    { type: "image/png" }
  );
  const uploaded = await uploadToCloudinary(file);
  return { url: uploaded.url, styleId: active.id };
}
