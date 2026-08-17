export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  company: string;
  platform: string;
  avatar: string;
  rating: number;
  content: string;
  role: string;
  image: string;
};

function item(
  quote: string,
  name: string,
  title: string,
  company: string,
  platform: string,
  seed: string,
  rating = 5
): Testimonial {
  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
  return {
    quote,
    name,
    title,
    company,
    platform,
    avatar,
    rating,
    content: quote,
    role: title || company || "Client",
    image: avatar,
  };
}

export const testimonialsCopy = {
  eyebrow: "Client Success",
  headingBefore: "Trusted",
  headingEmphasis: "Client",
  headingAfter: "Feedback",
  intro: "Real results from clients across global platforms.",
} as const;

export const testimonials: Testimonial[] = [
  item(
    "Ali is the best developer I've ever worked with. The quality of his work and his experience are insane. On top of that, his pricing is very competitive for the value — a hidden gem of Upwork.",
    "Verified Upwork client",
    "",
    "Upwork",
    "simple-icons:upwork",
    "Upwork"
  ),
];
