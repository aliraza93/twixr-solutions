import type { Config } from "tailwindcss"

const config = {
    darkMode: "class",
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
        './hooks/**/*.{ts,tsx}',
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                canvas: "var(--canvas)",
                surface: {
                    DEFAULT: "var(--surface)",
                    2: "var(--surface-2)",
                },
                ink: {
                    DEFAULT: "var(--ink)",
                    soft: "var(--ink-soft)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    2: "var(--muted-2)",
                    foreground: "hsl(var(--muted-foreground))",
                },
                hairline: {
                    DEFAULT: "var(--hairline)",
                    strong: "var(--hairline-strong)",
                },
                pine: {
                    DEFAULT: "var(--pine)",
                    600: "var(--pine-600)",
                    tint: "var(--pine-tint)",
                },
                lime: {
                    DEFAULT: "var(--lime)",
                    ink: "var(--lime-ink)",
                    deep: "var(--lime-deep)",
                },
                d: {
                    bg: "var(--d-bg)",
                    "bg-2": "var(--d-bg-2)",
                    text: "var(--d-text)",
                    muted: "var(--d-muted)",
                    hairline: "var(--d-hairline)",
                    lime: "var(--d-lime)",
                    mint: "var(--d-mint)",
                    glow: "var(--d-glow)",
                },
                accent: {
                    DEFAULT: "hsl(var(--ui-accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                sidebar: {
                    DEFAULT: "var(--sidebar)",
                    foreground: "var(--sidebar-foreground)",
                    primary: "var(--sidebar-primary)",
                    "primary-foreground": "var(--sidebar-primary-foreground)",
                    accent: "var(--sidebar-accent)",
                    "accent-foreground": "var(--sidebar-accent-foreground)",
                    border: "var(--sidebar-border)",
                    ring: "var(--sidebar-ring)",
                },
                success: {
                    DEFAULT: "var(--success)",
                    foreground: "var(--success-foreground, #ffffff)",
                },
                warning: {
                    DEFAULT: "var(--warning)",
                    foreground: "var(--warning-foreground, #0f172a)",
                    soft: "var(--warning-soft, #fef3c7)",
                },
            },
            borderRadius: {
                sm: "var(--r-sm)",
                md: "var(--r-md)",
                lg: "var(--r-lg)",
                xl: "var(--r-xl)",
                pill: "var(--r-pill)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
                lime: "var(--shadow-lime)",
                pine: "var(--shadow-accent)",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
                heading: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
                sora: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
                inter: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
                mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
            },
            transitionTimingFunction: {
                out: "var(--ease-out)",
                inout: "var(--ease-inout)",
            },
            transitionDuration: {
                fast: "var(--dur-fast)",
                DEFAULT: "var(--dur)",
                slow: "var(--dur-slow)",
            },
            spacing: {
                30: "var(--space-30)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
