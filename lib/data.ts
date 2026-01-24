import { Code2, Server, Cloud, Smartphone, Layout, Database } from "lucide-react";

export const services = [
    {
        title: "Full Stack Development",
        description: "Building scalable web applications from scratch using modern technologies like Next.js, Laravel, and Node.js.",
        icon: Code2,
    },
    {
        title: "Backend Engineering",
        description: "Designing robust APIs, database architectures, and microservices that can handle high traffic loads.",
        icon: Server,
    },
    {
        title: "DevOps & Cloud",
        description: "Automating deployments, setting up CI/CD pipelines, and managing AWS/DigitalOcean infrastructure.",
        icon: Cloud,
    },
    {
        title: "Custom WordPress",
        description: "Developing custom themes and plugins to extend WordPress functionality beyond the basics.",
        icon: Layout,
    },
    {
        title: "API Integration",
        description: "Seamlessly connecting third-party services like Stripe, OpenAI, and internal systems.",
        icon: Database,
    },
    {
        title: "Mobile App Backends",
        description: "Creating secure and fast APIs to power your mobile applications (iOS & Android).",
        icon: Smartphone,
    },
];

export const skills = {
    backend: ["PHP", "Laravel", "Python", "Node.js", "WordPress"],
    frontend: ["React.js", "Vue.js", "Next.js", "Tailwind CSS", "TypeScript"],
    devops: ["AWS", "DigitalOcean", "Docker", "CI/CD", "GitHub Actions"],
    database: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
};
