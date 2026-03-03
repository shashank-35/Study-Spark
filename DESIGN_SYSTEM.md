# Study Spark - Design System & UI/UX Documentation

## 📚 Project Overview

**Study Spark** is a comprehensive AI-powered learning platform designed specifically for BCA (Bachelor of Computer Applications) students. It combines intelligent study assistance, interactive learning tools, and progress tracking to create a modern educational ecosystem that helps students master their coursework effectively.

### Target Audience
- BCA students seeking personalized study support
- Educators and administrators managing course materials
- Learners who benefit from AI-powered Q&A and quiz generation
- Students building practical coding skills across multiple domains

### Core Value Propositions
- **AI-Powered Assistance**: Intelligent chatbot using Google Gemini for contextual learning
- **Smart Content Management**: Upload and automatically process PDFs, DOCs, and text files
- **Adaptive Learning**: AI-generated quizzes and personalized study plans
- **Progress Tracking**: Visual dashboards showing learning metrics and achievements
- **Real-Time Collaboration**: Synchronized materials and materials via Supabase
- **Role-Based Access**: Secure authentication with Clerk supporting students and admins

---

## ✨ Key Features

### 1. **AI Study Assistant Chatbot**
- Interactive chat interface powered by Google Gemini 2.5 Flash
- Context-aware responses based on uploaded study materials
- Real-time message streaming with visual thinking indicators
- Quick action buttons (Summarize, Explain, Practice, Plan Study)
- File upload integration for contextual learning

### 2. **File Upload & Smart Processing**
- Multi-format support: PDF, DOCX, DOC, TXT, and more
- Automatic text extraction from PDFs and documents
- Content indexing for quick retrieval
- Organized file library with preview and management

### 3. **Quiz Generation**
- Automatic quiz creation from uploaded materials
- Multiple question types (multiple choice, short answer)
- Performance tracking and instant feedback
- Topic-specific assessments

### 4. **Study Planning & Personalization**
- AI-generated custom study plans based on goals
- Subject-wise learning roadmaps
- Time-based study schedules (daily/weekly/monthly)
- Adaptive difficulty progression

### 5. **Progress Dashboard**
- Real-time learning metrics and statistics
- Subject-wise performance visualization
- Achievement badges and milestone tracking
- Completion percentages and success rates

### 6. **Admin Material Management**
- Centralized dashboard for content management
- File upload and deletion controls
- User activity monitoring
- Material analytics and usage reports

### 7. **Authentication & Role-Based Access**
- Secure Clerk authentication
- Student and admin role separation
- Profile management and preferences
- Persistent settings and learning history

---

## 🎨 Design Philosophy

### Core Principles

**1. Clarity & Accessibility**
- Clean, professional interface suitable for academic contexts
- High contrast ratios for readability
- Logical visual hierarchy prioritizing learning content
- Clear call-to-action buttons and navigation paths

**2. Modern & Approachable**
- Contemporary design language with educational undertones
- Friendly yet professional tone
- Welcoming color palette balancing seriousness with approachability
- Encouraging visual feedback (badges, progress indicators)

**3. Responsive & Adaptive**
- Mobile-first responsive design (single column on mobile → multi-column grids on desktop)
- Touch-friendly button sizes (minimum 44x44px)
- Flexible layouts that adapt to content volume
- Optimized performance with lazy loading

**4. Component-Driven Architecture**
- Consistent UI patterns across all pages
- Extensive use of shadcn/ui components ensuring uniformity
- Reusable component library for rapid development
- Predictable user interactions

**5. Dark Mode Support**
- Full dark theme with carefully selected color contrast
- CSS variable-based theming for easy customization
- Reduces eye strain during extended study sessions
- User preference persistence

**6. Interactive & Feedback-Rich**
- Toast notifications for user actions
- Loading states and skeleton screens
- Progress indicators and visual feedback
- Smooth transitions and animations

---

## 🌈 Visual Design - How It Looks & Feels

### Overall Aesthetic

Study Spark presents a **modern, professional educational interface** with:
- **Clean Card-Based Layouts**: Content organized into distinct, scannable cards
- **Strategic Visual Hierarchy**: Large headings, mid-sized section titles, descriptive text
- **Icon-Rich Interface**: 462+ Lucide React icons for quick visual scanning
- **Gradient Accents**: Subtle gradients in hero sections and CTAs for visual interest
- **Progressive Disclosure**: Advanced features hidden in popovers/dropdowns, keeping interface uncluttered

### Layout Patterns

#### **Hero Section** (Home Page)
- Full-width gradient background (purple to blue gradient)
- Large heading: "Unlock Your Learning Potential"
- Subheading with value proposition
- Prominent CTA button for getting started
- Animated illustration or gradient backdrop

#### **Subject Cards**
- 3-column grid on desktop, responsive down to single column
- Each card represents a learning subject (C, Java, Database, Web Dev, DSA, Networks, SE, OS)
- Color-coded left border matching subject theme
- Shows progress percentage, lesson count, and last accessed date
- Hover effects: subtle shadow expansion and color intensity increase
- CTA buttons for "Start Learning" or "Continue"

#### **Stat Blocks** (Social Proof)
- 3-4 prominent statistics highlighting platform credibility
  - "25,000+ Active Students"
  - "500,000+ Questions Solved"
  - "98% Success Rate"
  - "10,000+ Study Materials"
- Large numbers in primary color, labels in muted text
- Positioned in footer or above fold on landing page

#### **Achievement Badges**
- Circular badges with icons (trophy, fire, star)
- Color-coded by achievement tier (gold for platinum, silver for advanced, bronze for beginner)
- Labels underneath: "30-Day Streak", "Quiz Master", "Consistency Champion"
- Displayed on profile and dashboard

#### **Chatbot Interface**
- Message history scrollable area with left-align for user, right-align for AI
- User messages: light background with rounded corners
- AI messages: slightly darker background with thinking indicator
- File upload zone: dashed border drop area with upload icon
- Input field with expanding textarea (grows with text)
- Quick action buttons: horizontal scrollable list below input

#### **Progress Visualization**
- Horizontal progress bars (green for completion, gray for remainder)
- Circular progress indicators for subject mastery (0-100%)
- Line charts for learning trends over time (using Recharts)
- Bar charts for comparative performance across subjects
- Tooltip on hover showing precise values

#### **Navigation Sidebar** (Admin Panel)
- Vertical navigation with subject/section items
- Active state: highlighted background and left accent border
- Icons + text labels for clarity
- Collapsible on mobile (hamburger menu)
- Semi-transparent dark overlay on mobile when open

### Typography & Spacing

**Font Hierarchy**
- **Headings (H1)**: 28-32px, bold, primary foreground color
- **Section Titles (H2)**: 20-24px, semi-bold, primary foreground color
- **Subsections (H3)**: 16-18px, medium, primary foreground color
- **Body Text**: 14-16px regular, muted foreground color
- **Small Text/Labels**: 12-14px regular, muted foreground color
- **Captions**: 11-13px regular, lighter muted color

**Spacing System**
- Base unit: 8px (multiples: 8, 16, 24, 32, 48, 64)
- Container padding: 32px (desktop) / 16px (mobile)
- Card padding: 20-24px
- Section gaps: 24px (vertical) / 16px (horizontal)
- Component gap: 8-12px within grouped elements

**Border Radius**
- Base: 8px (cards, buttons, inputs, small chips)
- Large: 12px (modals, large sections)
- Extra Large: 16px (hero sections)

### Interactive Elements

**Buttons**
- Primary: Solid background (education blue, hsl(210, 85%, 58%)), white text
- Secondary: Outlined style, primary color border and text
- Destructive: Solid red background for delete/warning actions
- Disabled: Muted gray, reduced opacity
- Hover state: Subtle shadow lift, color intensity adjustment
- Active state: Darker shade, slight scale down

**Input Fields**
- Border: subtle gray (hsl(210, 20%, 88%)) in light mode
- Focus state: Primary blue border (3px) with subtle glow
- Placeholder: muted gray text
- Error state: red border with error icon and message
- Disabled: light gray background, strikethrough text

**Cards**
- White background (light mode) / dark background (dark mode)
- Subtle border: 1px light gray
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover shadow: 0 4px 12px rgba(0,0,0,0.15) (slight elevation)
- Padding: 20-24px consistent

**Tabs**
- Inactive tab: text in muted color
- Active tab: text in primary color with underline (accent color, 2px thickness)
- Background: none (transparent)
- Hover: text color slightly darker

**Dropdowns & Menus**
- Arrow icon indicating state
- Smooth slide-down animation
- Shadow beneath (elevation effect)
- Padding around menu items: 8px vertical, 12px horizontal

**Progress Indicators**
- Linear progress bars: green fill on gray background
- Height: 4-8px
- Percentage text: right-aligned above bar
- Circular progress: 2px stroke width, smooth CSS transitions

**Toast Notifications**
- Bottom-right corner positioning
- 4px left-colored accent border (green for success, red for error, blue for info, orange for warning)
- Dark background in both themes
- Auto-dismiss after 4 seconds
- Close button (X icon) on right

### Animations & Transitions

**Page Transitions**
- Fade in on mount (200ms)
- Slide from bottom for modals (300ms)
- Smooth height transitions for expanding sections

**Component Animations**
- Button hover: subtle scale (1.02) + shadow change (100ms)
- Input focus: border color transition + shadow glow (150ms)
- Dropdown open: slide-down + opacity fade (200ms)
- Progress bar: smooth width transition (600ms per update)
- Badge pop-in: scale from 0 to 1 + spring effect (300ms)

**Loading States**
- Skeleton screens: animated gradient (shimmer effect) 800ms duration
- Spinner: rotating icon (linear animation, 1s duration)
- Progress dots: sequential pulse effect (600ms per cycle)

---

## 🎯 Color Palette

All colors in Study Spark use **HSL (Hue, Saturation, Lightness)** format with CSS variables for dynamic theming and dark mode support.

### Core Color System

#### **Light Mode Colors**

| Color Name | HSL Value | HEX Value | RGB Value | Use Case |
|-----------|----------|----------|----------|----------|
| **Primary (Education Blue)** | hsl(210, 85%, 58%) | #0E7FE0 | rgb(14, 127, 224) | Main CTAs, links, primary buttons, headers |
| **Secondary (Teal)** | hsl(195, 65%, 55%) | #1BA3A3 | rgb(27, 163, 163) | Secondary buttons, alternative CTAs, accent elements |
| **Accent (Focus Purple)** | hsl(250, 75%, 65%) | #9D4EDD | rgb(157, 78, 221) | Highlights, active tabs, focus states, premium features |
| **Success (Achievement Green)** | hsl(160, 70%, 50%) | #00C878 | rgb(0, 200, 120) | Checkmarks, success messages, completion indicators |
| **Destructive (Alert Red)** | hsl(0, 75%, 60%) | #FF4444 | rgb(255, 68, 68) | Delete buttons, warning messages, error states |
| **Focus/Caution (Gold)** | hsl(35, 85%, 65%) | #FFB84D | rgb(255, 184, 77) | Attention-drawing elements, important notices |
| **Background** | hsl(210, 25%, 98%) | #F8FAFB | rgb(248, 250, 251) | Main page background |
| **Foreground (Text)** | hsl(210, 15%, 15%) | #222C3C | rgb(34, 44, 60) | Primary text, headings, body content |
| **Muted (Secondary Text)** | hsl(210, 20%, 96%) | #F0F4F8 | rgb(240, 244, 248) | Disabled states, secondary text, backgrounds |
| **Border** | hsl(210, 20%, 88%) | #D4DFE8 | rgb(212, 223, 232) | Card borders, input borders, divider lines |

#### **Dark Mode Colors**

| Color Name | HSL Value | HEX Value | RGB Value | Use Case |
|-----------|----------|----------|----------|----------|
| **Background** | hsl(210, 25%, 8%) | #0F1419 | rgb(15, 20, 25) | Main dark background |
| **Foreground (Text)** | hsl(210, 20%, 95%) | #E8EDF5 | rgb(232, 237, 245) | Primary light text |
| **Primary** | hsl(210, 85%, 65%) | #25B0F5 | rgb(37, 176, 245) | Lighter education blue for contrast |
| **Muted** | hsl(210, 25%, 15%) | #1E272E | rgb(30, 39, 46) | Dark gray for secondary elements |
| **Border** | hsl(210, 20%, 25%) | #3A4B5C | rgb(58, 75, 92) | Dark borders and dividers |
| **Secondary** | hsl(195, 65%, 55%) | #1BA3A3 | rgb(27, 163, 163) | Teal remains consistent |
| **Accent** | hsl(250, 75%, 65%) | #9D4EDD | rgb(157, 78, 221) | Purple remains consistent |
| **Success** | hsl(160, 70%, 50%) | #00C878 | rgb(0, 200, 120) | Green remains consistent |
| **Destructive** | hsl(0, 75%, 60%) | #FF4444 | rgb(255, 68, 68) | Red remains consistent |

#### **Sidebar Theme Colors**

- **Background**: hsl(240, 5.9%, 10%) — #1A1A2E (very dark)
- **Foreground**: hsl(0, 0%, 98%) — #FAFAFA (near white)
- **Accent**: hsl(240, 4.8%, 95.9%) — #F3F3F5 (light gray for active items)
- **Primary**: Same as main primary blue

### Subject-Specific Colors

Each BCA subject is color-coded for visual distinction:

| Subject | Primary Color | Secondary Color | Use Case |
|---------|-----------|----------|----------|
| **C Programming** | Blue (hsl(210, 85%, 58%)) | Blue-100 | Subject cards, tabs, badges |
| **Java** | Orange (hsl(39, 89%, 49%)) | Orange-100 | Subject cards, tabs, badges |
| **Database** | Green (hsl(160, 70%, 50%)) | Green-100 | Subject cards, tabs, badges |
| **Web Development** | Pink (hsl(280, 75%, 60%)) | Pink-100 | Subject cards, tabs, badges |
| **Data Structures** | Purple (hsl(250, 75%, 65%)) | Purple-100 | Subject cards, tabs, badges |
| **Networks** | Indigo (hsl(210, 70%, 55%)) | Indigo-100 | Subject cards, tabs, badges |
| **Software Eng.** | Red (hsl(0, 75%, 60%)) | Red-100 | Subject cards, tabs, badges |
| **Operating Systems** | Cyan (hsl(195, 100%, 50%)) | Cyan-100 | Subject cards, tabs, badges |

### Color Usage Guidelines

**Text**
- **Primary Heading**: Foreground (hsl(210, 15%, 15%)) on light background
- **Body Text**: Foreground (hsl(210, 15%, 15%)) with reduced opacity (85%)
- **Secondary/Muted Text**: Muted color (hsl(210, 20%, 96%))
- **Links**: Primary color (hsl(210, 85%, 58%)) with underline
- **Link Hover**: Primary color darker shade with underline emphasis

**Components**
- **Primary Button**: Primary color background, white text
- **Secondary Button**: Transparent background, Primary color border and text
- **Danger Button**: Destructive color background, white text
- **Success Badge**: Success color background, white text
- **Subject Card Border**: Subject-specific color (left 4px border)
- **Progress Bar**: Success color for filled portion, Muted for background
- **Form Inputs**: Border default to Border color, Primary on focus
- **Alerts**: 
  - Success: Background tinted green, text dark green
  - Error: Background tinted red, text dark red
  - Warning: Background tinted orange, text dark orange
  - Info: Background tinted blue, text dark blue

**Accessibility Considerations**
- All text meets WCAG AA contrast ratio requirements (4.5:1 minimum)
- Color is never the only indicator of information
- High saturation colors used sparingly to avoid visual fatigue
- Links are always underlined in addition to color differentiation

---

## 🏗️ Theme & Component System

### Design System Architecture

Study Spark is built on **shadcn/ui**, a modern component library built with **Radix UI** primitives and **Tailwind CSS**. This ensures consistency, accessibility (WCAG compliance), and rapid development.

### Component Categories

#### **1. Form Elements**
- **Input**: Text, email, password fields with focus rings
- **Button**: Primary, secondary, outline, ghost, destructive variants
- **Checkbox**: Custom styled checkboxes with hover effects
- **Radio Group**: Mutually exclusive option selector
- **Select**: Dropdown selector with search capability
- **Textarea**: Multi-line text input with auto-expand
- **Toggle**: Switch between two states (on/off)
- **Toggle Group**: Multiple toggles in a group
- **Input OTP**: Specialized for one-time passwords

#### **2. Layout & Structure**
- **Card**: Container with padding, border, and shadow
- **Container**: Max-width wrapper for responsive layout
- **Sidebar**: Collapsible vertical navigation panel
- **Drawer**: Slide-out panel from screen edge (mobile-friendly)
- **Tabs**: Horizontal tab switching with content areas
- **Accordion**: Expandable/collapsible sections
- **Separator**: Visual divider between sections
- **Resizable**: Adjustable panel sizes

#### **3. Navigation**
- **Navigation Menu**: Horizontal top navigation with dropdowns
- **Breadcrumb**: Page hierarchy (Home > Subject > Topic)
- **Pagination**: Multi-page content navigation
- **Menubar**: Desktop applications-style menu
- **Dropdown Menu**: Context-specific action menus

#### **4. Dialog & Feedback**
- **Dialog**: Modal overlay for critical information
- **Alert Dialog**: Confirmation dialogs for destructive actions
- **Alert**: Inline status messages (success, error, warning, info)
- **Toast**: Temporary notifications (bottom-right corner)
- **Popover**: Floating content triggered by button
- **Hover Card**: Reveal additional info on hover
- **Tooltip**: Brief help text on hover

#### **5. Data Display**
- **Table**: Organized data in rows and columns
- **Badge**: Small labels and tags
- **Avatar**: User profile images with fallback
- **Progress**: Linear progress indicator with percentage
- **Skeleton**: Loading placeholder (shimmer animation)
- **Carousel**: Slide-based carousel (using Embla)
- **Chart**: Data visualization (using Recharts)

#### **6. Utilities & Interactive**
- **Aspect Ratio**: Maintain fixed width/height ratios
- **Collapsible**: Expandable content sections
- **Command Palette**: Quick action search interface
- **Context Menu**: Right-click action menu
- **Scroll Area**: Custom styled scrollbars

### Custom Components

#### **1. StudySparkChatbot.tsx**
- **Layout**: Split-screen design (chat history left, input area bottom)
- **Features**: 
  - Message history with user/AI differentiation
  - File upload drop zone with drag-and-drop
  - Quick action buttons (Summarize, Explain, Practice, Plan Study)
  - Real-time thinking indicator and streaming responses
  - Clear history and export options
- **Color Scheme**: Primary blue for input actions, success green for upload feedback
- **Accessibility**: Proper ARIA labels, keyboard navigation support

#### **2. QuizGenerator.tsx**
- **Layout**: Question display area with answer options
- **Features**:
  - Multiple-choice, short-answer, and fill-blank question types
  - Instant feedback (correct/incorrect with explanation)
  - Progress tracking across quiz
  - Score summary with detailed breakdown
  - Retry/Continue options
- **Visual Feedback**: 
  - Success green for correct answers
  - Destructive red for incorrect answers
  - Neutral gray for not-yet-answered
- **Animation**: Smooth fade-in for new questions, pop-in effects for feedback

#### **3. ProgressDashboard.tsx**
- **Layout**: Multi-card grid with charts and stats
- **Features**:
  - Line chart for learning trends (7-day, 30-day view)
  - Bar chart comparing performance across subjects
  - Circular progress for subject mastery (0-100%)
  - Stat cards: Total Hours Studied, Quizzes Completed, Success Rate, Current Streak
  - Achievement badges section
- **Visual Elements**: Recharts for data visualization, color-coded by subject

#### **4. EnhancedHeader.tsx**
- **Layout**: Horizontal navigation bar with logo, nav links, right-side controls
- **Features**:
  - Logo with app name
  - Navigation links (Home, Subjects, Dashboard, Admin)
  - Search bar (prominent search icon)
  - File upload button
  - Theme toggle (light/dark mode switch)
  - User profile dropdown
  - Notification bell with badge
- **Styling**: 
  - Background: light gray or dark background
  - Shadow beneath for depth
  - Icons from Lucide React
- **Responsive**: Hamburger menu on mobile, full menu on desktop

#### **5. SubjectCard.tsx**
- **Layout**: Vertical card with color-coded left border
- **Features**:
  - Subject name (h3 heading)
  - Progress bar (0-100%)
  - Lesson count and last accessed date
  - Hover overlay with CTA button
  - Subject icon (from Lucide)
- **Color Styling**: Left border matches subject color (blue for C, orange for Java, etc.)
- **Interaction**: Hover elevation effect, click navigates to subject detail

#### **6. StudyPlanner.tsx**
- **Layout**: Week view with daily study plans
- **Features**:
  - Daily plan cards with time slots
  - Topic breakdown per day
  - AI-generated recommendations
  - Checkbox for completion tracking
  - Edit/modify individual plan items
- **Visual**: Color-coded by subject, progress indicators

#### **7. AdminPanel.tsx**
- **Layout**: Sidebar navigation + main content area
- **Features**:
  - Material management (upload, delete, edit)
  - User analytics and activity logs
  - Quiz performance overview
  - File library browser
- **Access Control**: Restricted to admin users via Clerk roles
- **Visual**: Table-based layout with action buttons (Edit, Delete, Download)

#### **8. ProfileSection.tsx**
- **Layout**: User info card + settings
- **Features**:
  - User avatar and name
  - Email and role display
  - Preferences (theme, notifications)
  - Logout button
  - Edit profile (redirect to Clerk)

### Theming Implementation

**CSS Variable Architecture**
```css
:root {
  --primary: hsl(210, 85%, 58%);
  --secondary: hsl(195, 65%, 55%);
  --accent: hsl(250, 75%, 65%);
  --success: hsl(160, 70%, 50%);
  --destructive: hsl(0, 75%, 60%);
  --background: hsl(210, 25%, 98%);
  --foreground: hsl(210, 15%, 15%);
  --muted: hsl(210, 20%, 96%);
  --border: hsl(210, 20%, 88%);
}

[data-theme="dark"] {
  --background: hsl(210, 25%, 8%);
  --foreground: hsl(210, 20%, 95%);
  --primary: hsl(210, 85%, 65%);
  --muted: hsl(210, 25%, 15%);
  --border: hsl(210, 20%, 25%);
}
```

**Theme Toggle Mechanism**
- Uses `next-themes` library for persistent theme preference
- Toggle button in header (moon/sun icons from Lucide)
- Auto-detection of system preference if no user setting
- Smooth transition between light and dark modes (200ms CSS transition)

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 18.3.1 + TypeScript | Modern UI library with type safety |
| **Build Tool** | Vite 5 | Lightning-fast development and production builds |
| **Styling** | Tailwind CSS 3.4.11 | Utility-first CSS for rapid UI development |
| **Component Library** | shadcn/ui (Radix UI + Tailwind) | 40+ accessible, customizable components |
| **Authentication** | Clerk | Secure user authentication with role-based access |
| **Database** | Supabase (PostgreSQL) | Real-time database with instant updates |
| **Backend** | Express 4.21.2 + Node.js | RESTful API server |
| **AI Integration** | Google Generative AI (@google/generative-ai) | Gemini 2.5 Flash for chatbot |
| **File Upload** | Multer + pdf-parse | Handle file uploads and PDF text extraction |
| **Icons** | Lucide React (462+ icons) | Consistent, scalable SVG icons |
| **Forms** | React Hook Form + Zod | Type-safe form handling and validation |
| **Router** | React Router DOM | Client-side navigation and routing |
| **Data Fetching** | React Query | Server state management and caching |
| **Notifications** | Sonner (Toaster) | Toast notifications for user feedback |
| **Charts** | Recharts | Data visualization and analytics |
| **Carousel** | Embla Carousel | Responsive slider component |
| **Utilities** | CORS, dotenv, node-fetch | Cross-origin support, environment configs |

---

## 🎬 Visual Walkthrough

### **1. Home Page / Landing Page**

**Header Area**
- Navigation bar: Logo on left, nav links (Home, Subjects, Dashboard, Admin) in center, right-side: Search, File Upload, Theme Toggle, Profile
- Background: Light background with subtle gradient

**Hero Section**
- Large heading: "Unlock Your Learning Potential with Study Spark"
- Subheading: "AI-powered learning platform for BCA students"
- CTA Button: "Get Started Now" (primary blue button)
- Hero image/illustration: Abstract gradient backdrop or animated SVG

**Social Proof Section**
- 4 stat blocks in a grid:
  - "25K+" | "Active Students"
  - "500K+" | "Questions Solved"
  - "98%" | "Success Rate"
  - "10K+" | "Study Materials"

**Subject Grid Section**
- Heading: "Explore Your Subjects"
- 3-column grid of subject cards (C, Java, Database, Web Dev, DSA, Networks, SE, OS)
- Each card: Color-coded border, subject icon, title, lesson count, progress bar, "Start Learning" button

**Features Section**
- Heading: "Why Study Spark?"
- 4 feature cards with icons:
  - 🤖 AI Chatbot
  - 📚 Smart Quiz
  - 📊 Progress Dashboard
  - 📝 Study Plans

**Latest Materials Section**
- Heading: "Recently Added"
- Carousel of recently uploaded materials with thumbnails, titles, upload dates

**Footer**
- Logo and tagline
- Quick links (About, Contact, Privacy)
- Social media links
- Newsletter signup form
- Copyright information

### **2. Chatbot Interface (Main Learning Area)**

**Left Sidebar** (Optional on Desktop, Expanded on Mobile)
- "Study Materials" heading
- List of uploaded files (thumbnails + titles)
- File icons indicating type (PDF, DOC, TXT)
- Search box for files
- Upload new file button

**Main Chat Area**
- Message history with scrolling
- User messages: Right-aligned, light blue background, rounded corners
- AI messages: Left-aligned, light gray background, always include thinking indicator
- Thinking indicator: "Thinking..." with loading dots
- Streaming response visual feedback

**Input Area** (Fixed at Bottom)
- Expandable textarea (grows with text, max height 200px)
- Placeholder: "Ask anything about your studies..."
- Buttons next to input:
  - Quick Actions (Summarize, Explain, Practice, Plan Study)
  - Emoji/attachment buttons (optional)

**File Upload Zone**
- Dashed box with upload icon
- "Drag files here or click to select" text
- Supported formats displayed
- Recent uploads shown below

### **3. Progress Dashboard**

**Header**
- Heading: "Your Learning Progress"
- Date range selector (Week, Month, Year)
- Export button (PDF/CSV)

**Stat Cards Grid** (Top Row)
- 4 cards:
  - Total Hours Studied: Large number, description
  - Quizzes Completed: Large number, description
  - Success Rate: Percentage with trend indicator (📈)
  - Current Streak: Days with fire icon

**Charts Section**
- **Line Chart**: Learning trend over time (7-day moving average)
  - X-axis: Days, Y-axis: Hours/Score
  - Multiple lines for different metrics
  - Tooltip on hover with exact values

- **Bar Chart**: Performance by subject
  - X-axis: Subject names, Y-axis: Performance score
  - Color-coded by subject
  - Comparison view

**Subject Progress Grid**
- Heading: "Subject-Wise Progress"
- 3-column grid of subject cards:
  - Subject icon and name
  - Circular progress (0-100%) with percentage text
  - Progress bar below
  - "Continue Learning" button

**Achievements Section**
- Heading: "Achievements Unlocked"
- Scrollable horizontal list of achievement badges:
  - Trophy icon: "Quiz Master" (completed 10+ quizzes)
  - Fire icon: "7-Day Streak"
  - Star icon: "100% Score"
  - Each with hover tooltip explaining criteria

### **4. Admin Dashboard**

**Sidebar Navigation**
- Dashboard (Overview)
- Materials (File management)
- Users (User list & analytics)
- Analytics (System-wide stats)
- Settings

**Main Content Area**

**Materials Management**
- Table with columns: File Name, Type, Upload Date, Size, Actions
- Each row has buttons: Preview, Edit, Delete
- Bulk actions: Select multiple, Delete all, Export
- Filter dropdown: By type, By subject, By upload date
- Search bar: Find files by name or subject

**User Analytics**
- Total users count
- Active users this month
- User engagement chart
- User list table: Name, Email, Joined Date, Last Active, Role

**System Analytics**
- Storage usage chart (disk space used)
- API usage chart (Gemini API calls)
- Popular materials section (most accessed files)
- System health status

---

## 🔄 Responsive Behavior

### Desktop (1024px+)
- 3-column grid for subject cards
- Full navigation bar with all menu items visible
- Sidebar visible in admin panel
- 2-column layout for dashboard and content

### Tablet (768px - 1023px)
- 2-column grid for subject cards
- Hamburger menu (sidebar collapses)
- Responsive table (horizontal scroll on overflow)
- Stack dashboard cards vertically

### Mobile (< 768px)
- 1-column grid for subject cards
- Full-screen hamburger menu
- Header logo + hamburger + profile
- Bottom navigation tab bar (optional)
- Cards stack vertically
- Larger touch targets (44x44px minimum)
- Simplified chart views

---

## ♿ Accessibility Standards

Study Spark adheres to **WCAG 2.1 AA** standards:

- **Semantic HTML**: Proper heading hierarchy (H1, H2, H3), semantic form elements
- **Keyboard Navigation**: All interactive elements accessible via Tab key, Enter/Space to activate
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **ARIA Labels**: `aria-label`, `aria-describedby` for complex components
- **Focus Indicators**: Visible focus rings (2px primary color) on all focusable elements
- **Alt Text**: All images have descriptive alt text
- **Form Labels**: All inputs have associated labels (not just placeholders)
- **Error Messages**: Clear, meaningful error messages linked to form fields

---

## 📝 Design Tokens & Variables

All design decisions are centralized in CSS variables and Tailwind config:

**Tailwind Configuration** (`tailwind.config.ts`)
```typescript
extend: {
  colors: {
    primary: 'hsl(210 85% 58%)',
    secondary: 'hsl(195 65% 55%)',
    accent: 'hsl(250 75% 65%)',
    success: 'hsl(160 70% 50%)',
    destructive: 'hsl(0 75% 60%)',
    focus: 'hsl(35 85% 65%)',
  },
  borderRadius: {
    sm: '4px',
    base: '8px',
    md: '12px',
    lg: '16px',
  },
  spacing: {
    // Standard 8px grid
  },
}
```

---

## 🚀 Performance & Optimization

- **Code Splitting**: Lazy-loaded components with React.lazy()
- **Image Optimization**: WebP with fallbacks, responsive images
- **Caching**: React Query with smart cache invalidation
- **Bundle Size**: Tree-shaking, minification, gzip compression
- **Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 📚 Additional Resources

- **Component Documentation**: See individual component files in `src/components/`
- **Color Validation**: Check `tailwind.config.ts` for complete color configuration
- **Dark Mode**: Toggle in header to preview all colors in dark mode
- **Responsive Testing**: Use DevTools device emulation or `npx tailwindcss -m` for mobile preview

---

**Last Updated**: February 18, 2026  
**Design System Version**: 1.0.0  
**Maintained By**: Study Spark Design Team
