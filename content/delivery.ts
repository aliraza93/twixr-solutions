import { extendedTeam } from "./services";

export const delivery = {
  eyebrow: "How we work together",
  headingLine1: "A senior engineer",
  headingLine2: "who embeds like a partner.",
  lead: extendedTeam.body,
  tiles: [
    { label: "You", sublabel: "Product", icon: "user" },
    { label: "Senior engineering", sublabel: "Architecture", icon: "code" },
    { label: "A partner who ships", sublabel: "Embedded", icon: "users" },
  ] as const,
  pills: extendedTeam.chips,
} as const;
