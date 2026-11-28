"use client";

import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_CONFIG } from "@/lib/data/scheduling";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type CalEmbedProps = {
  className?: string;
};

const CAL_UI_CONFIG = {
  hideEventTypeDetails: false,
  layout: "month_view" as const,
  theme: "light" as const,
  styles: {
    body: { background: "transparent" },
    eventTypeListItem: { background: "transparent" },
    availabilityDatePicker: { background: "transparent" },
  },
  cssVarsPerTheme: {
    light: {
      "cal-bg": "transparent",
      "cal-bg-emphasis": "transparent",
      "cal-bg-subtle": "transparent",
      "cal-bg-muted": "transparent",
    },
    dark: {
      "cal-bg": "transparent",
      "cal-bg-emphasis": "transparent",
      "cal-bg-subtle": "transparent",
      "cal-bg-muted": "transparent",
    },
  },
};

export function CalEmbed({ className }: CalEmbedProps) {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: CAL_CONFIG.namespace });
      cal("ui", CAL_UI_CONFIG);
      // The calendar rendered: someone opened the booking widget.
      cal("on", {
        action: "linkReady",
        callback: () => track("book_call", { booking_stage: "widget_opened" }),
      });
      // A slot was actually booked. Only the stage is sent, no attendee data.
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: () => track("book_call", { booking_stage: "completed" }),
      });
    })();
  }, []);

  return (
    <div className={cn("cal-embed h-[min(820px,calc(100svh-18rem))] min-h-[640px] w-full", className)}>
      <Cal
        namespace={CAL_CONFIG.namespace}
        calLink={CAL_CONFIG.calLink}
        style={{ width: "100%", height: "100%", overflow: "scroll", background: "transparent" }}
        config={{
          layout: "month_view",
          useSlotsViewOnSmallScreen: "true",
          theme: "light",
        }}
      />
    </div>
  );
}
