"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  XCircle,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      closeButton
      expand
      duration={5500}
      visibleToasts={4}
      gap={12}
      offset={{ top: "1.25rem", right: "1.25rem" }}
      mobileOffset={{ top: "1rem", right: "0.75rem" }}
      icons={{
        success: <CheckCircle2 className="size-5" strokeWidth={2.25} />,
        error: <XCircle className="size-5" strokeWidth={2.25} />,
        warning: <AlertTriangle className="size-5" strokeWidth={2.25} />,
        info: <Info className="size-5" strokeWidth={2.25} />,
        loading: <Loader2 className="size-5 animate-spin" strokeWidth={2.25} />,
      }}
      toastOptions={{
        classNames: {
          toast: "toast-item",
          title: "toast-item__title",
          description: "toast-item__description",
          closeButton: "toast-item__close",
          error: "toast-item--error",
          success: "toast-item--success",
          warning: "toast-item--warning",
          info: "toast-item--info",
          loading: "toast-item--loading",
        },
      }}
      {...props}
    />
  );
}
