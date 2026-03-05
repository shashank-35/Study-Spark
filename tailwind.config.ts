import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '1rem',
				sm: '1.5rem',
				lg: '2rem',
			},
			screens: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1400px',
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				focus: {
					DEFAULT: 'hsl(var(--focus))',
					foreground: 'hsl(var(--focus-foreground))'
				},
				// Direct brand color references
				brand: {
					purple:   '#A294F9',
					lilac:    '#CDC1FF',
					lavender: '#E5D9F2',
					pale:     '#F5EFFF',
					dark:     '#222C3C',
					muted:    '#6B7A99',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
			},
			fontSize: {
				'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
			},
			boxShadow: {
				'card':      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
				'card-hover':'0 8px 30px rgba(162,148,249,0.15), 0 2px 8px rgba(0,0,0,0.06)',
				'glow':      '0 0 30px rgba(162,148,249,0.35), 0 0 60px rgba(162,148,249,0.1)',
				'glow-sm':   '0 0 12px rgba(162,148,249,0.25)',
				'glass':     '0 4px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
				'glass-lg':  '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
				'premium':   '0 20px 60px rgba(162,148,249,0.15), 0 8px 20px rgba(0,0,0,0.06)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to:   { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to:   { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to:   { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					from: { opacity: '0', transform: 'translateY(16px)' },
					to:   { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to:   { opacity: '1', transform: 'scale(1)' }
				},
				'shimmer': {
					'0%':   { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 8px rgba(162,148,249,0.3)' },
					'50%':      { boxShadow: '0 0 20px rgba(162,148,249,0.6)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%':      { transform: 'translateY(-12px)' }
				},
				'float-slow': {
					'0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
					'50%':      { transform: 'translateY(-8px) rotate(2deg)' }
				},
				'gradient-shift': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%':      { backgroundPosition: '100% 50%' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up':   'accordion-up 0.2s ease-out',
				'fade-in':        'fade-in 0.3s ease-out',
				'slide-up':       'slide-up 0.4s ease-out',
				'scale-in':       'scale-in 0.2s ease-out',
				'shimmer':        'shimmer 1.2s infinite',
				'pulse-glow':     'pulse-glow 2s ease-in-out infinite',
				'float':          'float 4s ease-in-out infinite',
				'float-slow':     'float-slow 6s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
			},
			spacing: {
				'18': '4.5rem',
				'22': '5.5rem',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
