import type { BlogFormat } from "@/lib/pipeline/seo/formats";

/**
 * Editorial banks.
 *
 * These are the multipliers. A longer topic list grows variety linearly; one
 * topic crossed with a structure, a lens, an audience, a stake, an opening
 * device and a stylebook does not repeat in practice. Everything here is drawn
 * per run and excluded for the next few runs.
 */

/* ---------------------------------------------------------------- */
/* Structure                                                        */
/* ---------------------------------------------------------------- */

export type StructureSkeleton = {
  id: string;
  label: string;
  /** How the body is shaped. Goes into the prompt verbatim. */
  shape: string[];
  sectionsMin: number;
  sectionsMax: number;
  /** Formats this skeleton suits. Empty means any. */
  formats: BlogFormat[];
  /** Skeletons that carry their own ending do not want a generic conclusion. */
  ownEnding: boolean;
};

export const STRUCTURES: StructureSkeleton[] = [
  {
    id: "problem-diagnosis-fix",
    label: "Problem, diagnosis, fix, tradeoffs",
    shape: [
      "Open on the symptom as the reader would experience it.",
      "Show the diagnosis: what you looked at, in what order, and what ruled things out.",
      "The fix, concretely enough to apply.",
      "The tradeoffs the fix introduces.",
      "What you would do differently next time.",
    ],
    sectionsMin: 4,
    sectionsMax: 6,
    formats: ["Teardown", "Postmortem", "Before / After"],
    ownEnding: true,
  },
  {
    id: "claim-evidence-counter",
    label: "Claim, evidence, counter-argument, verdict",
    shape: [
      "State the claim flatly in the first two lines. No preamble.",
      "The evidence, with specifics.",
      "The strongest honest counter-argument, taken seriously.",
      "Your verdict and the conditions under which you would change it.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Myth vs Reality", "Anti-pattern", "Question-led"],
    ownEnding: true,
  },
  {
    id: "symptoms-rootcause-playbook",
    label: "Symptom list, root cause, playbook",
    shape: [
      "A short list of symptoms the reader will recognize.",
      "The root cause they all share.",
      "The playbook, in order, each step one or two lines.",
      "How to tell it worked.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Checklist", "Teardown"],
    ownEnding: false,
  },
  {
    id: "timeline-postmortem",
    label: "Timeline postmortem",
    shape: [
      "What broke, in one line, with the blast radius.",
      "The timeline: what happened and when, in order.",
      "The real cause, separated from the triggering event.",
      "What changed afterwards, including the thing that did not get fixed.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Postmortem", "Receipt"],
    ownEnding: true,
  },
  {
    id: "decision-table-first",
    label: "Decision table first, rationale after",
    shape: [
      "Lead with the recommendation table or list: option, when it wins, when it loses.",
      "Then the rationale for each row, one short section each.",
      "Close on the default you would pick with no other information.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Decision Table", "Numbers"],
    ownEnding: true,
  },
  {
    id: "question-ladder",
    label: "Question ladder",
    shape: [
      "Open on the question the reader actually typed into a search box.",
      "Answer it in the first paragraph. Do not withhold it.",
      "Then the follow-up questions that answer raises, each as a section.",
    ],
    sectionsMin: 3,
    sectionsMax: 6,
    formats: ["Question-led", "Myth vs Reality"],
    ownEnding: false,
  },
  {
    id: "three-myths",
    label: "Three things people get wrong",
    shape: [
      "Name the pattern of wrongness in one line.",
      "Three sections, one per misconception: what people believe, what happens, what to do instead.",
      "One line on what they all have in common.",
    ],
    sectionsMin: 3,
    sectionsMax: 4,
    formats: ["Myth vs Reality", "Anti-pattern"],
    ownEnding: true,
  },
  {
    id: "numbers-then-narrative",
    label: "Numbers first, narrative second",
    shape: [
      "Open on the measurement, stated plainly.",
      "Why that number is surprising.",
      "What produced it, step by step.",
      "What it means for a decision the reader has to make.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Numbers", "Receipt"],
    ownEnding: true,
  },
  {
    id: "annotated-artifact",
    label: "Annotated artifact",
    shape: [
      "Show the artifact first: the query plan, the log line, the config, the bill.",
      "Walk it line by line, annotating only what matters.",
      "What you changed because of it.",
    ],
    sectionsMin: 2,
    sectionsMax: 4,
    formats: ["Receipt", "Teardown", "Numbers"],
    ownEnding: false,
  },
  {
    id: "build-log",
    label: "Build log",
    shape: [
      "What you set out to build and the constraint that made it interesting.",
      "The attempts, in order, including the ones that failed.",
      "Where it landed and what is still wrong with it.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Teardown", "Before / After", "Receipt"],
    ownEnding: true,
  },
  {
    id: "objection-handling",
    label: "Objection handling",
    shape: [
      "The position, stated once.",
      "Each section takes one objection a sceptical senior engineer would raise and answers it honestly.",
      "The objection you cannot answer, named as such.",
    ],
    sectionsMin: 3,
    sectionsMax: 5,
    formats: ["Myth vs Reality", "Decision Table", "Question-led"],
    ownEnding: true,
  },
  {
    id: "single-arc-short",
    label: "Single arc, no sections",
    shape: [
      "One continuous argument, no headings at all or at most two.",
      "One idea, developed properly, then stop.",
      "Under no circumstances pad this out to look like a longer article.",
    ],
    sectionsMin: 0,
    sectionsMax: 2,
    formats: ["Short Take"],
    ownEnding: true,
  },
];

/* ---------------------------------------------------------------- */
/* Surface variation                                                */
/* ---------------------------------------------------------------- */

export const OPENING_DEVICES: { id: string; instruction: string }[] = [
  { id: "blunt-claim", instruction: "Open with a flat, slightly uncomfortable claim. No setup sentence before it." },
  { id: "log-line", instruction: "Open with a real log line, error message, or shell output, then explain what it means." },
  { id: "question", instruction: "Open with the exact question a reader would have typed, then answer it immediately." },
  { id: "cost-number", instruction: "Open with what the problem costs: hours, dollars, requests, or an outage window." },
  { id: "scene", instruction: "Open with one line of scene: where you were, what was broken. One line only, no storytelling." },
  { id: "objection", instruction: "Open by stating the reader's likely objection to the whole premise, then take it on." },
  { id: "definition-fix", instruction: "Open by correcting how a term is commonly used, then build on the corrected version." },
  { id: "two-paths", instruction: "Open with the two choices the reader is actually deciding between." },
  { id: "wrong-number", instruction: "Open with a number that looks like a typo but is not." },
  { id: "admission", instruction: "Open by admitting something you got wrong about this, then explain what changed." },
];

export const TITLE_PATTERNS: { id: string; instruction: string }[] = [
  { id: "slower-than-you-think", instruction: "A claim that contradicts a common assumption." },
  { id: "n-things", instruction: "A counted list, where the count is specific and small." },
  { id: "why-x-fails", instruction: "Why a common practice does not work." },
  { id: "x-vs-y", instruction: "A direct comparison with the deciding criterion named." },
  { id: "noun-phrase", instruction: "A bare noun phrase naming the thing, no verb, no colon." },
  { id: "question", instruction: "A question, phrased the way someone would actually ask it." },
  { id: "without-pain", instruction: "An outcome achieved without the usual cost: 'X without Y'." },
  { id: "reading-artifact", instruction: "Reading or interpreting a specific artifact." },
  { id: "what-taught-me", instruction: "What a specific quantity of experience changed about a belief." },
  { id: "the-one-thing", instruction: "The single detail that decides the outcome." },
  { id: "imperative", instruction: "A direct instruction, imperative mood, no hedging." },
  { id: "before-after", instruction: "A transition stated as a measurement or a state change." },
];

export const HEADING_STYLES: { id: string; instruction: string }[] = [
  { id: "questions", instruction: "Headings are questions the section answers." },
  { id: "imperatives", instruction: "Headings are imperatives: the action the section describes." },
  { id: "noun-phrases", instruction: "Headings are short noun phrases. No verbs." },
  { id: "numbered-steps", instruction: "Headings are numbered steps or stages." },
  { id: "statements", instruction: "Headings are short declarative statements that could stand alone as the point." },
];

export const RHYTHMS: { id: string; instruction: string }[] = [
  { id: "staccato", instruction: "Short sentences. Rarely over 12 words. Let fragments carry weight where they earn it." },
  { id: "mixed", instruction: "Vary sentence length deliberately: a long one that does real work, then a short one that lands it." },
  { id: "measured", instruction: "Longer, carefully built sentences. Still active voice, still no filler, but let the reasoning run." },
];

export const PERSONS: { id: string; instruction: string }[] = [
  { id: "first-singular", instruction: "First person singular. 'I shipped', 'I was wrong about'." },
  { id: "second", instruction: "Second person. Address the reader directly as the one doing the work." },
  { id: "first-plural-team", instruction: "First person plural, meaning your team on a real project. Never the royal we." },
];

export const CTA_SHAPES: { id: string; instruction: string }[] = [
  { id: "question", instruction: "End on a specific question about the reader's own setup." },
  { id: "next-action", instruction: "End on the one thing to go check in their codebase right now." },
  { id: "caveat", instruction: "End on the case where this advice does not apply." },
  { id: "none", instruction: "End on the last substantive point. No call to action at all." },
];

/* ---------------------------------------------------------------- */
/* Texture                                                          */
/* ---------------------------------------------------------------- */

export type StyleCard = { id: string; label: string; rules: string[] };

export const STYLEBOOKS: StyleCard[] = [
  {
    id: "terse-operator",
    label: "Terse operator",
    rules: [
      "No sentence over 15 words.",
      "Zero adverbs of degree: very, really, quite, extremely.",
      "Name the tool and the version every time you mention it.",
      "No transition words at the start of a paragraph.",
    ],
  },
  {
    id: "patient-explainer",
    label: "Patient explainer",
    rules: [
      "Define a term the first time you use it, in a clause, not a sentence.",
      "One analogy maximum in the whole piece, and it must be mechanical, not emotional.",
      "Show the wrong version before the right version.",
    ],
  },
  {
    id: "code-review-voice",
    label: "Code review voice",
    rules: [
      "Write as if leaving review comments: direct, specific, no praise padding.",
      "Prefer 'this breaks when' over 'this might not be ideal'.",
      "Quote the code or config you are talking about before commenting on it.",
    ],
  },
  {
    id: "numbers-forward",
    label: "Numbers forward",
    rules: [
      "Every claim that can carry a number carries one.",
      "No adjective where a measurement would do.",
      "State the measurement method whenever you state a measurement.",
    ],
  },
  {
    id: "dry-contrarian",
    label: "Dry contrarian",
    rules: [
      "Take the position most of the audience disagrees with, and defend it honestly.",
      "Concede the strongest counter-point early, not at the end.",
      "No rhetorical questions.",
    ],
  },
  {
    id: "field-notes",
    label: "Field notes",
    rules: [
      "Present tense for what the system does, past tense for what you did.",
      "Short paragraphs, two or three sentences.",
      "At least one thing you have not figured out yet, named plainly.",
    ],
  },
  {
    id: "teacher-at-whiteboard",
    label: "Teacher at the whiteboard",
    rules: [
      "Build the idea in order: each paragraph only uses what the previous ones established.",
      "One worked example carried all the way through, not three partial ones.",
      "No forward references to later sections.",
    ],
  },
  {
    id: "incident-channel",
    label: "Incident channel",
    rules: [
      "Lead every section with the conclusion, then the supporting detail.",
      "Timestamps and ordering matter: say what happened before what.",
      "Separate what you knew at the time from what you know now.",
    ],
  },
  {
    id: "senior-skeptic",
    label: "Senior skeptic",
    rules: [
      "For every recommendation, state the condition under which it is wrong.",
      "No absolute words: always, never, every, nothing, guaranteed.",
      "Prefer 'in the systems I have seen' over a universal claim.",
    ],
  },
  {
    id: "plain-trade",
    label: "Plain trade",
    rules: [
      "No jargon that a competent engineer outside this stack would not know, unless defined.",
      "Short Anglo-Saxon words over Latinate ones: use, not utilize; start, not initiate.",
      "No stacked noun phrases of more than three words.",
    ],
  },
  {
    id: "cost-conscious",
    label: "Cost conscious",
    rules: [
      "Frame every technical choice in terms of what it costs to run and to maintain.",
      "Name the person-hours or the monthly bill where you can.",
      "No architecture recommendation without its operational price.",
    ],
  },
  {
    id: "narrow-and-deep",
    label: "Narrow and deep",
    rules: [
      "Cover one narrow thing completely rather than a broad thing partially.",
      "Explicitly state what this piece does not cover, in one line, early.",
      "Go one level deeper than the obvious explanation at least once.",
    ],
  },
  {
    id: "before-after-eyes",
    label: "Before and after eyes",
    rules: [
      "Every point is made by contrast: the old way, then the new way.",
      "Show both versions of the artifact, never describe a diff in prose.",
      "Quantify the difference where a number exists.",
    ],
  },
  {
    id: "handover-doc",
    label: "Handover doc",
    rules: [
      "Write as if the reader will own this system on Monday.",
      "Name the failure modes and what to do about each.",
      "No background that does not change an action they will take.",
    ],
  },
];

export const QUIRKS: string[] = [
  "Use exactly one parenthetical aside in the whole piece.",
  "End the piece on a question, not a summary.",
  "Include at least one sentence of three words or fewer.",
  "Name a specific version number at least twice.",
  "Use no adverbs at all in the first paragraph.",
  "Admit one thing you are uncertain about, in plain words.",
  "Put a number in the first two lines.",
  "Use no bulleted list anywhere in the piece.",
  "Start one section with the word 'But'.",
  "Mention what you tried first and abandoned.",
  "Include one sentence that a junior engineer would find surprising.",
  "Name the specific file or function where this usually lives.",
  "Refuse to recommend anything in one section; just describe.",
  "Use the word 'cost' at least twice, meaning two different kinds of cost.",
  "Include one aside about what this looks like at a much larger scale.",
  "Reference a decision you would make differently today.",
  "Keep every paragraph in one section to a single sentence.",
  "State the simplest possible solution before the real one, and say why it is not enough.",
  "Use no headings in the final third of the piece.",
  "Close on a concrete next action rather than a reflection.",
];

/** Rotated so the model is not always steered away from the same shapes. */
export const BANNED_OPENER_SETS: string[][] = [
  [
    "Most posts about X are just...",
    "Let us talk about...",
    "Here is the thing about...",
  ],
  [
    "X is out. Here is what...",
    "In today's ... world",
    "We have all been there...",
  ],
  [
    "If you are a developer, you know...",
    "Picture this:",
    "It was a normal Tuesday...",
  ],
  [
    "There are two kinds of...",
    "Everyone talks about X, but nobody...",
    "Spoiler:",
  ],
];

/* ---------------------------------------------------------------- */
/* Angle (the combinatorial multiplier)                             */
/* ---------------------------------------------------------------- */

export const ANGLE_LENSES: { id: string; instruction: string }[] = [
  { id: "cost", instruction: "Judge everything by what it costs to run and to maintain." },
  { id: "risk", instruction: "Judge everything by what breaks and how badly when it does." },
  { id: "speed", instruction: "Judge everything by time to ship and time to recover." },
  { id: "maintainability", instruction: "Judge everything by what the next engineer has to understand." },
  { id: "hiring", instruction: "Judge everything by who you can hire to run it." },
  { id: "client-trust", instruction: "Judge everything by what it does to the client's confidence." },
  { id: "security", instruction: "Judge everything by the attack surface it adds or removes." },
  { id: "developer-experience", instruction: "Judge everything by what it does to the daily loop of the people working on it." },
  { id: "lock-in", instruction: "Judge everything by how hard it is to reverse the decision later." },
  { id: "deadline", instruction: "Judge everything from inside a deadline that is already too close." },
];

export const AUDIENCES: { id: string; instruction: string }[] = [
  { id: "solo-founder", instruction: "A solo technical founder before product-market fit, optimizing for survival." },
  { id: "startup-cto", instruction: "A CTO at a 20-person startup who has to defend this decision to a board." },
  { id: "agency-owner", instruction: "An agency owner who will have to deliver this across several client projects." },
  { id: "saas-owner-scaling", instruction: "A bootstrapped SaaS owner with paying customers whose app is getting slow or fragile, deciding whether to bring in outside help." },
  { id: "head-of-product", instruction: "A head of product who owns the roadmap and the budget and has to choose between building, buying, or hiring." },
  { id: "non-technical-founder", instruction: "A non-technical founder deciding whether to approve the work. Explain the stakes, not the syntax." },
];

export const STAKES: { id: string; instruction: string }[] = [
  { id: "money", instruction: "The stake is money leaking: a bill, a wasted retainer, a refund." },
  { id: "pager", instruction: "The stake is being woken up at 2am, repeatedly." },
  { id: "audit", instruction: "The stake is failing a review, an audit, or a security questionnaire." },
  { id: "churn", instruction: "The stake is a client or customer quietly leaving." },
  { id: "launch", instruction: "The stake is a launch date that cannot move." },
  { id: "blocked-release", instruction: "The stake is a release that cannot ship until this is resolved." },
  { id: "reputation", instruction: "The stake is being the engineer who shipped the thing that broke." },
];

/* ---------------------------------------------------------------- */
/* Images                                                           */
/* ---------------------------------------------------------------- */

export type ImageMedium = "photo" | "diagram";

/**
 * Inline visual kinds. Most are documentary photos: AI diagrams full of small
 * text come out garbled and read as machine-made, while a believable photo of
 * real work reads as a real engineer's blog. The diagram kinds that remain are
 * the low-text ones, where a picture genuinely explains structure.
 */
export const INLINE_IMAGE_KINDS: { id: string; prompt: string; medium: ImageMedium }[] = [
  { id: "workspace-photo", medium: "photo", prompt: "realistic photo of a developer workspace that fits the topic: laptop, external monitor, notebook, coffee; screen content soft and unreadable" },
  { id: "over-shoulder-photo", medium: "photo", prompt: "over-the-shoulder photo of an engineer working on a laptop, face not visible, screen slightly out of focus" },
  { id: "whiteboard-photo", medium: "photo", prompt: "photo of a whiteboard covered in hand-drawn boxes, arrows and sticky notes from a planning session, shot at an angle, handwriting not legible" },
  { id: "meeting-photo", medium: "photo", prompt: "candid photo of two or three people in a small modern office discussing a project around a laptop, shot from the side or behind" },
  { id: "desk-detail-photo", medium: "photo", prompt: "close-up detail photo with shallow depth of field: hands on a keyboard, a notebook with sketches, or a phone on the desk, background softly blurred" },
  { id: "infrastructure-photo", medium: "photo", prompt: "real-world photo of infrastructure that fits the topic: a server rack, network cabling, or a laptop terminal in a dim room" },
  { id: "video-call-photo", medium: "photo", prompt: "photo of a laptop on a desk during a client video call, call window blurred, notebook and pen beside it, warm home-office light" },
  { id: "flow-diagram", medium: "diagram", prompt: "simple architecture or data-flow diagram, four to six boxes with one or two word labels and arrows" },
  { id: "sequence", medium: "diagram", prompt: "sequence diagram showing ordered calls between two or three participants, very short labels" },
  { id: "before-after", medium: "diagram", prompt: "before and after comparison, two panels, one short label each" },
  { id: "decision-tree", medium: "diagram", prompt: "decision tree with three or four branches, one or two words at each branch" },
  { id: "layered-architecture", medium: "diagram", prompt: "layered architecture stack, three or four horizontal layers with one-word labels" },
];

export const IMAGE_ASPECTS: { id: string; size: string; weight: number }[] = [
  { id: "16x9", size: "1280x720", weight: 50 },
  { id: "4x3", size: "1200x900", weight: 20 },
  { id: "1x1", size: "1080x1080", weight: 15 },
  { id: "3x2", size: "1200x800", weight: 15 },
];

/**
 * Photographic looks: light, lens and framing. Crossed with the scene kinds
 * these keep the archive from looking like one shoot, without drifting into
 * illustration styles that read as generated.
 */
export const RENDER_MODIFIERS: { id: string; prompt: string }[] = [
  { id: "window-light", prompt: "Soft natural window light from the side, true-to-life colors, gentle shadows." },
  { id: "overcast-office", prompt: "Even overcast daylight in a real office, neutral white balance, muted tones." },
  { id: "late-afternoon", prompt: "Warm late afternoon light through blinds, long soft shadows." },
  { id: "evening-desk", prompt: "Evening scene lit by a desk lamp and monitor glow, low light with natural sensor grain." },
  { id: "shallow-50mm", prompt: "50mm lens at f/1.8, shallow depth of field, subject sharp, background softly blurred." },
  { id: "environmental-35mm", prompt: "35mm lens at f/4, environmental framing that shows the room around the subject." },
  { id: "top-down", prompt: "Top-down shot from directly above the desk, even soft light, items slightly imperfectly arranged." },
  { id: "film-look", prompt: "Subtle 35mm film look: fine grain, slightly lifted blacks, natural color." },
  { id: "handheld-candid", prompt: "Handheld candid framing, slightly off-center, like a real behind-the-scenes photo." },
  { id: "cool-morning", prompt: "Cool early morning light, calm and quiet, soft contrast." },
];

export const OG_LAYOUTS: { id: string; titlePosition: "top" | "center" | "bottom"; showCategory: boolean; showRule: boolean; typeScale: "large" | "regular" }[] = [
  { id: "top-chip-rule", titlePosition: "top", showCategory: true, showRule: true, typeScale: "regular" },
  { id: "center-bare", titlePosition: "center", showCategory: false, showRule: false, typeScale: "large" },
  { id: "bottom-chip", titlePosition: "bottom", showCategory: true, showRule: false, typeScale: "regular" },
  { id: "top-large", titlePosition: "top", showCategory: false, showRule: true, typeScale: "large" },
  { id: "center-chip-rule", titlePosition: "center", showCategory: true, showRule: true, typeScale: "regular" },
  { id: "bottom-large-bare", titlePosition: "bottom", showCategory: false, showRule: false, typeScale: "large" },
];

/* ---------------------------------------------------------------- */
/* Social                                                           */
/* ---------------------------------------------------------------- */

export const LINKEDIN_SHAPES: { id: string; instruction: string }[] = [
  {
    id: "micro-story",
    instruction:
      "A short true story in sequence: the situation, the thing that went wrong, what you did, what you learned. Four to six short lines.",
  },
  {
    id: "three-line-punch",
    instruction:
      "Three lines total. A claim, the proof, the consequence. Nothing else. No list, no sections.",
  },
  {
    id: "list-of-five",
    instruction:
      "A tight list of five items, each one line, each independently useful. One line of framing above it, one below.",
  },
  {
    id: "contrarian-claim",
    instruction:
      "State an unpopular position in line one, defend it in three or four lines, concede the real counter-point at the end.",
  },
  {
    id: "question-only",
    instruction:
      "Build the whole post around one genuine question, with just enough context for it to be answerable. End on the question itself.",
  },
  {
    id: "receipt-caption",
    instruction:
      "Describe a specific artifact: a bill, a query plan, a log line, a diff. Say what it shows and what you changed. Read like a caption, not an essay.",
  },
  {
    id: "i-was-wrong",
    instruction:
      "Open by naming something you believed and no longer do. Explain what changed your mind, specifically.",
  },
  {
    id: "before-after-snippet",
    instruction:
      "Two states, side by side in prose: how it was, how it is now, and the one change that moved it. Name the measurement.",
  },
];

export const LINKEDIN_LENGTH_BANDS = [
  { id: "short", min: 300, max: 520, weight: 25 },
  { id: "mid", min: 700, max: 1300, weight: 55 },
  { id: "long", min: 1700, max: 2500, weight: 20 },
];
