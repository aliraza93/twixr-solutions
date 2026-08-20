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

// All quotes below are REAL, verbatim reviews from Ali's Upwork profile
// (upwork.com/freelancers/~01e1dd4667ee1975e6). Do not edit the wording or
// invent names — clients are shown as first name + initial, exactly as Upwork displays them.
export const testimonials: Testimonial[] = [
  item(
    "Ali is the best developer I've ever worked with. The quality of his work and his experience in developing are insane. On top of all that, his pricing is very competitive for the value you are getting. Hidden GEM of Upwork.",
    "Verified Upwork client",
    "E-commerce / Gaming platform",
    "Upwork",
    "simple-icons:upwork",
    "Gaming"
  ),
  item(
    "Ali developed our platform for more than two years and delivered an amazing end product. He has outstanding skills and is one of the best developers we worked with.",
    "Verified Upwork client",
    "Real-estate SaaS (2-year engagement)",
    "Upwork",
    "simple-icons:upwork",
    "RealEstate"
  ),
  item(
    "Fantastic working with Ali, very clear communication and a subject matter expert. We'll be continuing to partner with him on projects.",
    "Danyon L.",
    "SaaS product (Laravel + Inertia)",
    "Upwork",
    "simple-icons:upwork",
    "Danyon L"
  ),
  item(
    "Mr. Raza is very professional and delivers his work quickly. I can highly recommend him to anyone who needs support with PHP.",
    "Roger G.",
    "PHP / API integration",
    "Upwork",
    "simple-icons:upwork",
    "Roger G"
  ),
  item(
    "Ali Raza was once again great, started instantly and got the job done even though it was technically challenging! Thanks once again.",
    "Verified Upwork client",
    "Automation software add-on",
    "Upwork",
    "simple-icons:upwork",
    "Automation"
  ),
  item(
    "Very good service, I'm satisfied and highly recommended.",
    "Austin M.",
    "Web development & hosting",
    "Upwork",
    "simple-icons:upwork",
    "Austin M"
  ),
];
