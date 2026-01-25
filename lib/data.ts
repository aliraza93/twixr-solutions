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

export const experiences = [
    {
        company: "UpAlerts",
        location: "Pakistan",
        role: "Founder",
        period: "January 2023 - Present (1 year 1 month)",
        description: "Spearheaded the establishment of UpAlerts, a revolutionary platform empowering freelancers and agencies to craft superior proposals utilizing Generative AI. Developed real-time job notifications from Upwork to mobile apps, websites, and WhatsApp. Successfully garnered over 20,000 active users within 6 months.",
        categories: ["AI", "Websites", "Mobile Apps"],
        technologies: ["Next.js", "Node.js", "Flutter", "OpenAI", "LangChain"],
        logo: "logos:upwork-icon",
        link: "https://upalerts.com",
        color: "teal",
        glow: "rgba(20, 184, 166, 0.15)",
        projects: [
            { title: "LinkedIn Post AI Writer", image: "/projects/upalerts-1.png" },
            { title: "EvyAI Subscription Plans", image: "/projects/upalerts-2.png" },
            { title: "UpAlerts Platform", image: "/projects/upalerts-3.png" },
        ]
    },
    {
        company: "LWS Academy",
        location: "Remote",
        role: "Founder",
        period: "January 2022 - Present (2 years 1 month)",
        description: "Building an educational platform focusing on modern tech stacks and career development in software engineering.",
        categories: ["Websites", "Trainings"],
        technologies: ["React", "Next.js", "Tailwind CSS", "Node.js", "PostgreSQL"],
        logo: "logos:react",
        link: "#",
        color: "indigo",
        glow: "rgba(79, 70, 229, 0.15)",
        projects: [
            { title: "Learning Dashboard", image: "/projects/lws-1.png" },
            { title: "Course Catalog", image: "/projects/lws-2.png" },
        ]
    },
    {
        company: "Smonte Technologies",
        location: "Lahore",
        role: "Jr Software Engineer",
        period: "January 2014 - August 2014 (7 months)",
        description: "Gained valuable experience working on software development projects. Collaborated with experienced team members in delivering quality solutions.",
        categories: ["Websites"],
        technologies: ["PHP", "MySQL", "JavaScript", "HTML/CSS"],
        logo: "logos:php",
        link: "#",
        color: "blue",
        glow: "rgba(59, 130, 246, 0.15)",
        projects: []
    },
    {
        company: "Reliance College",
        location: "Faisalabad",
        role: "Android Trainer",
        period: "October 2013 - December 2013 (2 months)",
        description: "Provided Android Application Development Training to a class of 10 students. Taught mobile development fundamentals and best practices.",
        categories: ["Trainings", "Mobile Apps"],
        technologies: ["Android", "Java", "Mobile Development"],
        logo: "logos:android-icon",
        link: "#",
        color: "amber",
        glow: "rgba(245, 158, 11, 0.15)",
        projects: []
    },
    {
        company: "Beacon Impex (Pvt) Ltd",
        location: "Faisalabad",
        role: "Intern Android Developer",
        period: "July 2013 - October 2013 (3 months)",
        description: "Android Database Development using SQLite, Android UI Design, Social Networking Integration with Android Apps.",
        categories: ["Mobile Apps"],
        technologies: ["Android", "SQLite", "Java", "Social Media Integration"],
        logo: "logos:android-icon",
        link: "#",
        color: "rose",
        glow: "rgba(244, 63, 94, 0.15)",
        projects: []
    }
];
