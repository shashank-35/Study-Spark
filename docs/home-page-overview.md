# StudySpark Home Experience

> Redesigned with a modern, minimal academic SaaS aesthetic — fully dynamic Supabase data, Framer Motion animations, and a clean productivity-focused layout.

## Architecture

| Layer | File | Purpose |
|-------|------|---------|
| Page | `src/pages/Index.tsx` | Dashboard layout, view router, all home sections |
| Hook | `src/hooks/useDashboard.ts` | Fetches stats, subjects, progress, achievements & activity from Supabase with real-time subscriptions |
| Service | `src/lib/dashboardService.ts` | Supabase queries — `fetchDashboardStats`, `fetchAchievements`, `fetchActivityFeed`, `subscribeToDashboard` |
| Navbar | `src/components/EnhancedHeader.tsx` | Minimal sticky glassmorphism header |
| Footer | `src/components/EnhancedFooter.tsx` | Lightweight 3-column footer |

## Home Page (`Index.tsx`)

### Data flow
- `useDashboard(userId)` returns `{ stats, subjects, progress, achievements, activity, loading, error, refetch }`.
- All numbers (streak, progress %, minutes studied, quizzes completed) come from Supabase.
- Real-time subscriptions on `student_progress`, `study_sessions`, `study_goals`, `study_todos` auto-refresh data.

### Sections (top → bottom)

1. **Hero Banner** — gradient card with user name, semester, streak message, circular SVG progress ring (animated via `AnimatedNumber` counter), and CTA buttons (Continue Learning, Start Quiz, Coding Lab).
2. **Quick Stats** — 4-card grid: Progress %, Day Streak, Minutes Studied, Quizzes Done. Skeleton loaders while `loading === true`.
3. **Quick Actions** — 6 professional cards with hover lift (`motion.button` + `whileHover`): Subjects, Quiz, Coding Lab, Planner, Analytics, Careers.
4. **Curriculum Progress** — Horizontal scrolling carousel of subject cards. Animated progress bars (`motion.div` + `whileInView`), per-subject status badges (Not Started / In Progress / Completed). Empty state with CTA when no subjects exist.
5. **Achievements** — Horizontal scrolling carousel of glassmorphism cards with emoji icons, title, description, and earned date. Empty state when none unlocked.
6. **Activity Feed** — Timeline of recent study sessions, quizzes, and achievements from Supabase. Type-based icons, date stamps. Max 8 items shown.
7. **Study Tips** — 2×2 grid of tips relevant to BCA students.
8. **Profile & Admin** — Profile button + conditional Admin Panel button for admin email.

### Animations
- `fadeUp` variant with cubic-bezier easing applied via Framer Motion `custom` prop for staggered delays.
- `Section` wrapper component uses `useInView` for scroll-triggered reveal.
- `stagger` parent variant staggers children by 70ms.
- `AnimatedNumber` component counts up with eased requestAnimationFrame loop.

### View Router
`currentView` state switches between: `dashboard`, `subjects`, `coding`, `planner`, `quiz`, `progress`, `career`, `profile`. Each module receives `onBackToDesktop` callback.

## Navbar (`EnhancedHeader.tsx`)
- Sticky with `backdrop-blur-md` glassmorphism; gains shadow on scroll via `useEffect` scroll listener.
- Controls: theme toggle, AI chatbot launch, notifications, Clerk user avatar dropdown.
- Framer Motion `AnimatePresence` for search dropdown and mobile menu slide.
- No clutter — removed PDF upload, badge components, static notification data.

## Footer (`EnhancedFooter.tsx`)
- Minimal 3-column layout: Brand + tagline, Quick Links, Support (email + social icons).
- `motion.footer` with `whileInView` fade-in animation.
- Legal links row with dynamic year.
- No newsletter, no stats row, no heavy gradients.
