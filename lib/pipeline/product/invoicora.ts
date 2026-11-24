/**
 * Invoicora: Ali's own product, promoted by one blog post a week.
 *
 * Everything the writer may say about the product lives here, taken from
 * the live site (invoicora.com) on 18 Nov 2026. Update this file when the
 * product changes; the writer is told never to go beyond it.
 *
 * Screenshots are real captures of the public site, stored in
 * public/products/invoicora/ and uploaded to Cloudinary per post.
 */

import type { Product, ProductImage, ProductTopic } from "@/lib/pipeline/product/types";

export type { ProductTopic };
export type ProductScreenshot = ProductImage;

export const PRODUCT_PILLAR_PREFIX = "Product/";
export const INVOICORA_PILLAR = "Product/Invoicora";

export const INVOICORA = {
  key: "invoicora",
  name: "Invoicora",
  pillar: INVOICORA_PILLAR,
  imageKind: "screenshot",
  url: "https://www.invoicora.com/",
  links: {
    home: "https://www.invoicora.com/",
    create: "https://www.invoicora.com/create/",
    templates: "https://www.invoicora.com/templates/",
    platform: "https://www.invoicora.com/platform/",
    guides: "https://www.invoicora.com/guides/",
    freelanceGuide: "https://www.invoicora.com/guides/freelance-invoice-guide/",
    foreignClientsPakistan:
      "https://www.invoicora.com/guides/invoice-foreign-clients-pakistan/",
    invoiceNumbering: "https://www.invoicora.com/guides/invoice-numbering/",
    paymentTerms: "https://www.invoicora.com/guides/payment-terms-explained/",
    invoiceVsReceipt: "https://www.invoicora.com/guides/invoice-vs-receipt/",
    ntnVsStrn: "https://www.invoicora.com/guides/ntn-vs-strn/",
    fbrDigitalInvoicing: "https://www.invoicora.com/guides/fbr-digital-invoicing/",
    creditVsDebitNote: "https://www.invoicora.com/guides/credit-note-vs-debit-note/",
  },
  facts: [
    "Invoicora is an invoice generator Ali Raza built and runs. He is the author of this blog, so say plainly that it is his product.",
    "Free generator at invoicora.com: no signup, no watermark, no limits. Create an invoice, quotation or receipt and download a clean PDF in about a minute.",
    "The free generator runs in the browser: what you type stays on your device and nothing is uploaded to a server.",
    "Document types in the builder: invoice, tax invoice, quotation, proforma, receipt, credit note, purchase order, delivery challan, payment voucher and rent receipt.",
    "31 languages, including right-to-left. Arabic invoices are designed for Arabic, not flipped. Two languages can be mixed on one invoice, with amounts written in words.",
    "Any tax: VAT, GST or sales tax, with your own tax name and rate. Ready country presets for the UAE, Saudi Arabia, Pakistan and Indonesia.",
    "Ten free invoice templates (for example Minimal, Classic, Bilingual split, Tax invoice with QR, Corporate), each working in every language, in preview, print and PDF.",
    "Share a PDF or send it by WhatsApp from the generator.",
    "Optional account (the Invoicora platform): documents, clients, business profiles and numbering series live in the account, so an invoice started on a laptop is finished on a phone and the next number is always the next number.",
    "With an account you can email a document with the PDF attached and a hosted page the client opens on any device. Every delivery is logged: delivered, opened, bounced, and webhook retries.",
    "The account has recurring invoices, payment reminders, an API (for example POST /v1/documents) and signed webhooks such as document.issued; ready recipes for n8n and Zapier.",
    "Workspaces with members: Free has one member, Pro three, Business ten and several business profiles.",
    "Invoicora never collects, holds or transfers money. It issues and delivers documents and records when they are paid.",
    "Plans: Free account $0 forever (unlimited saved and issued documents, 10 document emails a month, hosted link, API and webhooks, one payment reminder per invoice, one member). Pro $9 a month or $90 a year (unlimited emails from your own address, full reminder schedule and recurring invoices, three members). Business $29 a month or $290 a year (everything in Pro, ten members and several business profiles, priority support).",
  ],
  screenshots: [
    {
      id: "home",
      file: "home-hero.jpg",
      alt: "Invoicora home page: invoices that speak your language, with a bilingual tax invoice preview",
      shows: "the home page hero with a tax invoice preview, currencies, Arabic and English, VAT and the privacy note",
    },
    {
      id: "editor",
      file: "create-editor.jpg",
      alt: "Invoicora invoice builder with document types, invoice details and a live PDF preview",
      shows: "the free invoice builder: the ten document types, invoice number, currency, dates, country rules and the live preview",
    },
    {
      id: "templates",
      file: "templates.jpg",
      alt: "Grid of free Invoicora invoice templates including Bilingual split, Tax invoice with QR and Corporate",
      shows: "the templates gallery with Bilingual split, Tax invoice with QR, Corporate, Creative, Receipt and Proforma",
    },
    {
      id: "languages",
      file: "languages-rtl.jpg",
      alt: "Invoicora language list and an English invoice beside the same invoice in Arabic",
      shows: "the 31 languages and an English invoice next to the same invoice laid out right to left in Arabic",
    },
    {
      id: "platform",
      file: "platform-features.jpg",
      alt: "Invoicora platform page showing a delivery log and numbering in one series across devices",
      shows: "the account side: a delivery log (delivered, opened, bounced, webhook retried) and one numbering series across laptop and phone",
    },
    {
      id: "plans",
      file: "platform-plans.jpg",
      alt: "Invoicora plans: Free $0, Pro $9 a month and Business $29 a month",
      shows: "the three plans with prices and what each includes",
    },
  ] satisfies ProductScreenshot[],
  topics: [
    {
      topic: "Why I built Invoicora, a free invoice generator in 31 languages",
      targetKeyword: "free invoice generator",
      angle: "Founder story: the invoicing pain I hit billing foreign clients from Pakistan, what I decided to build, what I left out on purpose (no signup, no payments).",
      screenshots: ["home", "editor", "languages"],
    },
    {
      topic: "Invoicing foreign clients from Pakistan without the back and forth",
      targetKeyword: "invoice foreign clients from Pakistan",
      angle: "Practical guide for freelancers and agencies: currency, numbering, payment terms, what the client's finance team asks for. Show the workflow in Invoicora.",
      screenshots: ["editor", "templates"],
    },
    {
      topic: "Right-to-left invoices: what flipping a layout gets wrong",
      targetKeyword: "Arabic invoice template",
      angle: "Engineering post on RTL done properly: numerals, amounts in words, mixed-language invoices, and how Invoicora renders the same invoice in Arabic.",
      screenshots: ["languages", "templates"],
    },
    {
      topic: "Building a PDF invoice generator that never uploads your data",
      targetKeyword: "client-side PDF generation",
      angle: "Architecture post: why the free generator runs entirely in the browser, the trade-offs, and what moved to the optional account and why.",
      screenshots: ["editor", "home"],
    },
    {
      topic: "Invoice numbering across devices: one series, no gaps",
      targetKeyword: "invoice numbering",
      angle: "Why numbering breaks when you invoice from a laptop and a phone, the rules accountants care about, and how the Invoicora account keeps one series.",
      screenshots: ["platform", "editor"],
    },
    {
      topic: "Webhooks for invoices: signed events and retries that actually help",
      targetKeyword: "invoice API webhooks",
      angle: "Developer post: designing document.issued webhooks with signatures and retry, the delivery log, and wiring it to a CRM, n8n or Zapier.",
      screenshots: ["platform", "plans"],
    },
    {
      topic: "VAT, GST or sales tax: one invoice builder for every country",
      targetKeyword: "VAT invoice generator",
      angle: "How tax fields differ across the UAE, Saudi Arabia, Pakistan and Indonesia, and how country presets in Invoicora fill them in.",
      screenshots: ["editor", "home"],
    },
    {
      topic: "Pricing a SaaS for freelancers: why Invoicora has a free plan forever",
      targetKeyword: "freelancer invoicing software pricing",
      angle: "Business post: how I chose Free, Pro $9 and Business $29, what each plan unlocks, and why the generator stays free with no watermark.",
      screenshots: ["plans", "platform"],
    },
    {
      topic: "Payment reminders that do not damage the client relationship",
      targetKeyword: "invoice payment reminder",
      angle: "Freelancer and agency advice on chasing late invoices politely, payment terms, and how reminder schedules and recurring invoices work in Invoicora.",
      screenshots: ["platform", "plans"],
    },
    {
      topic: "Quotation, proforma, invoice, receipt: which document when",
      targetKeyword: "proforma invoice vs invoice",
      angle: "Plain guide to the document lifecycle for small businesses, with each document made in the Invoicora builder.",
      screenshots: ["templates", "editor"],
    },
    {
      topic: "Workspaces and members: billing as a small team, not one person",
      targetKeyword: "invoicing software for small teams",
      angle: "When a solo freelancer becomes an agency: shared clients, members, several business profiles, and how the Invoicora workspace handles it.",
      screenshots: ["platform", "plans"],
    },
    {
      topic: "Sending invoices people actually open: hosted links and delivery logs",
      targetKeyword: "track if invoice was opened",
      angle: "Why emailed PDFs get lost, what a hosted invoice page and a delivery log tell you, and how Invoicora reports delivered, opened and bounced.",
      screenshots: ["platform", "editor"],
    },
    {
      topic: "Ten free invoice templates and the design choices behind them",
      targetKeyword: "free invoice templates",
      angle: "Design post: what makes an invoice readable, bilingual layouts, QR tax invoices, and the ten templates in Invoicora.",
      screenshots: ["templates", "languages"],
    },
    {
      topic: "Creating invoices from your own tools with an invoice API",
      targetKeyword: "invoice API",
      angle: "Developer guide: when to create invoices from your app or CRM, idempotency and numbering, and the Invoicora API with POST /v1/documents.",
      screenshots: ["platform", "plans"],
    },
    {
      topic: "Why Invoicora never touches your money",
      targetKeyword: "invoice software without payment processing",
      angle: "Product decision post: issuing and tracking documents without collecting payments, what that removes (compliance, holds), and what it means for users.",
      screenshots: ["platform", "home"],
    },
    {
      topic: "Tax invoices in Pakistan: NTN, STRN and what to put on the invoice",
      targetKeyword: "tax invoice Pakistan",
      angle: "Practical guide for Pakistani freelancers and businesses, linking Invoicora's guides, with the Pakistan preset in the builder.",
      screenshots: ["editor", "templates"],
    },
  ] satisfies ProductTopic[],
} satisfies Product;

// The helpers below keep the original Invoicora-only call sites working.
// New code should use lib/pipeline/product/catalog.ts.
import {
  isProductPillar as isAnyProductPillar,
  productFactSheet as factSheetFor,
  productInstructions as instructionsFor,
  productLinkedInNote as linkedInNoteFor,
  screenshotUrl as imageUrlFor,
  screenshotsFor as imagesFor,
  topicFor as topicOf,
} from "@/lib/pipeline/product/catalog";

export const isProductPillar = isAnyProductPillar;

export function topicFor(topic: string): ProductTopic | undefined {
  return topicOf(INVOICORA, topic);
}

export function screenshotsFor(topic: string): ProductScreenshot[] {
  return imagesFor(INVOICORA_PILLAR, topic);
}

export function screenshotUrl(shot: ProductScreenshot, siteUrl: string): string {
  return imageUrlFor(INVOICORA, shot, siteUrl);
}

export function productFactSheet(): string {
  return factSheetFor(INVOICORA_PILLAR);
}

export function productInstructions(topic: ProductTopic): string {
  return instructionsFor(INVOICORA, topic);
}

export function productLinkedInNote(): string {
  return linkedInNoteFor(INVOICORA_PILLAR);
}
