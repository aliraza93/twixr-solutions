export const services = [
  {
    title: "Full Stack Development",
    description:
      "Transforming complex ideas into scalable web applications using Next.js, Laravel, and modern microservices.",
    icon: "Code2",
  },
  {
    title: "Enterprise Architecture",
    description:
      "Designing robust, long-term technical frameworks and database systems that handle millions of requests.",
    icon: "Server",
  },
  {
    title: "AI & Automation",
    description:
      "Integrating LLMs, custom RAG pipelines, and automated workflows to revolutionize business operations.",
    icon: "Cpu",
  },
  {
    title: "Cloud & DevOps",
    description:
      "Optimizing AWS/DigitalOcean infrastructure with automated CI/CD and zero-downtime deployment pipelines.",
    icon: "Cloud",
  },
  {
    title: "API Intelligence",
    description:
      "Seamlessly connecting high-performance third-party services like Stripe, OpenAI, and internal enterprise systems.",
    icon: "Database",
  },
  {
    title: "Mobile App Sprints",
    description:
      "Developing fast, cross-platform mobile experiences with specialized backends for iOS & Android.",
    icon: "Smartphone",
  },
] as const;

export const skills = {
  backend: ["PHP", "Laravel", "Python", "Node.js", "WordPress"],
  frontend: ["React.js", "Vue.js", "Next.js", "Tailwind CSS", "TypeScript"],
  devops: ["AWS", "DigitalOcean", "Docker", "CI/CD", "GitHub Actions"],
  database: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
} as const;

export const offerings = services;
