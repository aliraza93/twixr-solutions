import type { Metadata } from "next";
import { FoundationDemo } from "./foundation-demo";

export const metadata: Metadata = {
  title: "Design foundation | Twixr Solutions",
  robots: { index: false, follow: false },
};

export default function FoundationPage() {
  return <FoundationDemo />;
}
