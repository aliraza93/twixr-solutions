export type Testimonial = {
  quote: string;
  name: string;
  title: string;
  company: string;
  platform: string;
  avatar: string;
  rating: number;
  /** Aliases for existing carousel / archive components. */
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
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  return {
    quote,
    name,
    title,
    company,
    platform,
    avatar,
    rating,
    content: quote,
    role: title,
    image: avatar,
  };
}

export const testimonials: Testimonial[] = [
  item(
    "Ali's UI/UX skills are top-notch. He transformed our outdated website into a modern, user-friendly experience.",
    "Emily Rodriguez",
    "Product Manager",
    "GlobalTech",
    "simple-icons:upwork",
    "Emily"
  ),
  item(
    "Professional, reliable, and delivers quality work on time. Highly recommend for any web development project.",
    "David Kim",
    "Founding Engineer",
    "LinkedIn",
    "logos:linkedin-icon",
    "David"
  ),
  item(
    "Ali delivered exceptional work on our e-commerce platform. His attention to detail and technical expertise made our project a huge success.",
    "Sarah Johnson",
    "Director of Marketing",
    "Innova",
    "simple-icons:upwork",
    "Sarah"
  ),
  item(
    "Outstanding React developer! Built our entire frontend from scratch with beautiful animations and perfect responsiveness.",
    "Michael Chen",
    "CEO",
    "Fiverr",
    "simple-icons:fiverr",
    "Michael"
  ),
  item(
    "Best developer I've worked with! Clean code, modern design, and excellent project management skills.",
    "James Wilson",
    "Technical Lead",
    "Facebook",
    "logos:facebook",
    "James"
  ),
  item(
    "Amazing work on our mobile app! The performance optimizations and smooth animations exceeded our expectations.",
    "Lisa Thompson",
    "Project Manager",
    "Fiverr",
    "simple-icons:fiverr",
    "Lisa"
  ),
  item(
    "Ali's full-stack expertise saved us time and money. He handled both frontend and backend perfectly.",
    "Alex Parker",
    "Founder",
    "Stark Ltd",
    "simple-icons:upwork",
    "Alex"
  ),
  item(
    "Incredible attention to detail and communication throughout the project. I will definitely work with him again!",
    "Maria Garcia",
    "Creative Director",
    "Google",
    "logos:google-icon",
    "Maria"
  ),
];
