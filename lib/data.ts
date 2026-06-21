import { Code2, Server, Cloud, Smartphone, Layout, Database, Cpu } from "lucide-react";
import { getBlogListings } from "./data/blog";

export const services = [
    {
        title: "Full Stack Development",
        description: "Transforming complex ideas into scalable web applications using Next.js, Laravel, and modern microservices.",
        icon: Code2,
    },
    {
        title: "Enterprise Architecture",
        description: "Designing robust, long-term technical frameworks and database systems that handle millions of requests.",
        icon: Server,
    },
    {
        title: "AI & Automation",
        description: "Integrating LLMs, custom RAG pipelines, and automated workflows to revolutionize business operations.",
        icon: Cpu,
    },
    {
        title: "Cloud & DevOps",
        description: "Optimizing AWS/DigitalOcean infrastructure with automated CI/CD and zero-downtime deployment pipelines.",
        icon: Cloud,
    },
    {
        title: "API Intelligence",
        description: "Seamlessly connecting high-performance third-party services like Stripe, OpenAI, and internal enterprise systems.",
        icon: Database,
    },
    {
        title: "Mobile App Sprints",
        description: "Developing fast, cross-platform mobile experiences with specialized backends for iOS & Android.",
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
        company: "Twixr Solutions",
        location: "Pakistan",
        role: "Founder & Lead Engineer",
        period: "January 2023 - Present",
        description: "Leading Twixr Solutions, a premium digital agency specializing in high-performance web applications and AI-driven automation. I manage end-to-end delivery of complex projects for global clients.",
        categories: ["AI", "Websites", "Automation"],
        technologies: ["Next.js", "Node.js", "Laravel", "OpenAI", "AWS"],
        logo: "logos:nextjs-icon",
        link: "https://twixrsolutions.com",
        color: "indigo",
        glow: "rgba(79, 70, 229, 0.15)",
        projects: [
            { title: "AI Proposal Engine", image: "/projects/upalerts-1.png" },
            { title: "Custom SaaS Platform", image: "/projects/upalerts-2.png" },
            { title: "Enterprise Dashboard", image: "/projects/upalerts-3.png" },
        ]
    },
    {
        company: "DevLabs",
        location: "Remote",
        role: "Senior Full Stack Developer",
        period: "January 2020 - December 2022",
        description: "Developed and maintained full-stack web applications using Laravel and React. Optimized database performance and implemented advanced search features.",
        categories: ["Websites", "E-commerce"],
        technologies: ["React", "Laravel", "PostgreSQL", "Redis"],
        logo: "logos:laravel",
        link: "#",
        color: "indigo",
        glow: "rgba(79, 70, 229, 0.15)",
        projects: []
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
        color: "violet",
        glow: "rgba(139, 92, 246, 0.15)",
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
        color: "blue",
        glow: "rgba(59, 130, 246, 0.15)",
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
        color: "purple",
        glow: "rgba(168, 85, 247, 0.15)",
        projects: []
    }
];

export const testimonials = [
    {
        name: "Emily Rodriguez",
        role: "Product Manager",
        company: "GlobalTech",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
        content: "Ali's UI/UX skills are top-notch. He transformed our outdated website into a modern, user-friendly experience.",
        rating: 5,
        platform: "simple-icons:upwork",
    },
    {
        name: "David Kim",
        role: "Founding Engineer",
        company: "LinkedIn",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        content: "Professional, reliable, and delivers quality work on time. Highly recommend for any web development project.",
        rating: 5,
        platform: "logos:linkedin-icon",
    },
    {
        name: "Sarah Johnson",
        role: "Director of Marketing",
        company: "Innova",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        content: "Ali delivered exceptional work on our e-commerce platform. His attention to detail and technical expertise made our project a huge success.",
        rating: 5,
        platform: "simple-icons:upwork",
    },
    {
        name: "Michael Chen",
        role: "CEO",
        company: "Fiverr",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
        content: "Outstanding React developer! Built our entire frontend from scratch with beautiful animations and perfect responsiveness.",
        rating: 5,
        platform: "simple-icons:fiverr",
    },
    {
        name: "James Wilson",
        role: "Technical Lead",
        company: "Facebook",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        content: "Best developer I've worked with! Clean code, modern design, and excellent project management skills.",
        rating: 5,
        platform: "logos:facebook",
    },
    {
        name: "Lisa Thompson",
        role: "Project Manager",
        company: "Fiverr",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
        content: "Amazing work on our mobile app! The performance optimizations and smooth animations exceeded our expectations.",
        rating: 5,
        platform: "simple-icons:fiverr",
    },
    {
        name: "Alex Parker",
        role: "Founder",
        company: "Stark Ltd",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        content: "Ali's full-stack expertise saved us time and money. He handled both frontend and backend perfectly.",
        rating: 5,
        platform: "simple-icons:upwork",
    },
    {
        name: "Maria Garcia",
        role: "Creative Director",
        company: "Google",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
        content: "Incredible attention to detail and communication throughout the project. I will definitely work with him again!",
        rating: 5,
        platform: "logos:google-icon",
    },
];

export const blogPosts = getBlogListings();

export const faqs = [
    {
        question: "Do you develop mobile apps as well as web applications?",
        answer: "Yes, I specialize in cross-platform mobile development using Flutter and React Native, alongside full-stack web development with Next.js and Node.js.",
        icon: "lucide:smartphone"
    },
    {
        question: "Can you build AI-powered chatbots and automation systems?",
        answer: "Absolutely. I have extensive experience integrating LLMs like GPT-4, building custom RAG pipelines, and automating workflows using LangChain and n8n.",
        icon: "lucide:bot"
    },
    {
        question: "Do you offer training or educational consultancy?",
        answer: "Yes, I offer specialized training for engineering teams and individual consultancy for architects looking to upscale their stack.",
        icon: "lucide:video"
    },
    {
        question: "What payment systems and e-commerce solutions do you implement?",
        answer: "I primarily work with Stripe and PayPal for global payments, and I've built custom e-commerce engines as well as Shopify integrations.",
        icon: "lucide:credit-card"
    },
    {
        question: "Which cloud platforms and databases do you work with?",
        answer: "I'm proficient with AWS, DigitalOcean, and Vercel for hosting. For databases, I prefer PostgreSQL, MySQL, and MongoDB depending on the project requirements.",
        icon: "lucide:cloud"
    },
    {
        question: "What is your experience level and track record on freelancing platforms?",
        answer: "I am a Top-Rated Plus developer on Upwork with a 100% Job Success Score and over 10 years of professional engineering experience.",
        icon: "lucide:award"
    },
    {
        question: "Do you provide full-stack development or just frontend/backend?",
        answer: "I provide end-to-end full-stack development, covering everything from UI/UX design and frontend implementation to backend architecture and DevOps.",
        icon: "lucide:globe"
    },
    {
        question: "Can you help with technical mentoring or code reviews?",
        answer: "Yes, I offer consultancy services for teams and individuals looking to optimize their codebase, improve performance, or adopt new technologies.",
        icon: "lucide:users"
    }
];

export const footerData = {
    platforms: [
        { name: "YouTube Channel", href: "#" },
        { name: "Official Website", href: "#" },
        { name: "Trainings", href: "/courses" },
        { name: "Newsletter", href: "#newsletter" },
        { name: "Schedule Meeting", href: "/schedule" },
    ],
    freelance: [
        { name: "Upwork", href: "https://upwork.com" },
        { name: "Fiverr", href: "https://fiver.com" },
    ],
    community: [
        { name: "Facebook Group", href: "#" },
        { name: "WhatsApp Channel", href: "#" },
        { name: "Skool Community", href: "#" },
    ],
    socials: [
        { name: "YouTube", icon: "logos:youtube-icon", href: "#" },
        { name: "LinkedIn", icon: "logos:linkedin-icon", href: "#" },
        { name: "Facebook", icon: "logos:facebook", href: "#" },
        { name: "Instagram", icon: "logos:instagram-icon", href: "#" },
        { name: "X", icon: "logos:twitter", href: "#" },
        { name: "TikTok", icon: "logos:tiktok-icon", href: "#" },
    ]
};

export const approachSteps = [
    {
        title: "Strategy & Discovery",
        description: "We dive deep into your business goals, user needs, and technical requirements to define a clear roadmap for success.",
        icon: "lucide:eye",
        color: "indigo"
    },
    {
        title: "Precision Architecture",
        description: "Designing scalable database schemas, high-performance APIs, and intuitive UI/UX frameworks built for long-term growth.",
        icon: "lucide:map",
        color: "violet"
    },
    {
        title: "High-Velocity Dev",
        description: "Agile sprints focused on building core features using modern stacks like Next.js, Laravel, and AI-powered automation.",
        icon: "lucide:layout",
        color: "fuchsia"
    },
    {
        title: "Rigorous QA & Test",
        description: "Comprehensive testing for security, performance, and cross-device compatibility to ensure a flawless user experience.",
        icon: "lucide:cpu",
        color: "purple"
    },
    {
        title: "Global Launch & Scale",
        description: "Seamless deployment with automated CI/CD pipelines, SEO optimization, and proactive maintenance for sustained impact.",
        icon: "lucide:rocket",
        color: "indigo"
    }
];





