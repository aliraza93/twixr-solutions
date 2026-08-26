# Code-card style - for short "code tip" posts

A recognized post format: a small, specific Laravel / NestJS / JS tip that lands
better shown as code than described. Same native rendering as the diagrams  - 
HTML/SVG to PNG, no connector.

## The post (keep it SHORT - the image carries the detail)
- Hook: name the annoyance.
- 2-4 lines explaining the tip in plain terms.
- One-line takeaway.
- Light CTA + 3-4 hashtags.
- Target ~60-80 words total.

## The card (render natively, export PNG)
- Dark background (#0d1117 or #1e1e2e). Monospace font.
- **Each code block is a macOS-style window**: rounded top corners, a title
  bar (~44px) with three traffic-light dots (red #ff5f56, yellow #ffbd2e,
  green #27c93f, left-aligned with padding) and a centered filename/label
  (e.g. `Before.php`, `After.php`) in the muted comment color. Code sits
  below the title bar with its own padding - don't let text touch the dots.
- Two stacked windows labelled by title bar text ("Before" / "After"), with
  a gap or divider between them.
- Syntax highlighting: keywords one accent, strings another, comments muted,
  class/method names a third. Readable, not rainbow.
- Real, correct, MINIMAL code - 6-12 lines total. If it doesn't fit clean, the
  tip is too big for this format; make it a standard post.
- Bottom-right watermark: **twixrsolutions.com**. Never use another mark.
- Square, ~1080x1080, readable on a phone.
- Save to drafts/ named to the post (e.g. mon-code-card.png).

## When to use it
Best for Laravel, NestJS, API design, refactoring. Not for opinion, story,
freelancing, positioning, or news posts - those stay text or use a Canva card.
