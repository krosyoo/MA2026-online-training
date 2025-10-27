# Mahanaim Online Training System - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from educational platforms like Coursera, Khan Academy, and religious/spiritual learning platforms, combined with the professional aesthetics of Korean educational sites.

## Brand Identity & Color System
**Primary Color Palette** (Mandatory - Provided by Client):
- `brand-primary`: #0D47A1 (Deep Blue) - Primary buttons, headers, key CTAs
- `brand-secondary`: #1976D2 (Medium Blue) - Secondary actions, links
- `brand-accent`: #42A5F5 (Bright Blue) - Highlights, active states, progress indicators
- `brand-light`: #E3F2FD (Very Light Blue) - Backgrounds, cards, subtle sections
- `brand-dark`: #0B3B84 (Darker Blue) - Text emphasis, footer

**Supporting Neutrals**:
- White (#FFFFFF) for main backgrounds
- Gray scale (50-900) for text hierarchy and borders
- Use brand-light for subtle background differentiation

## Typography System
**Font Stack**: Use Korean-optimized web fonts via Google Fonts CDN
- Primary: 'Noto Sans KR' or 'Spoqa Han Sans Neo' for body text
- Headings: Same font family, varied weights (500-700)

**Hierarchy**:
- Page Titles: text-4xl lg:text-5xl, font-bold
- Section Headers: text-2xl lg:text-3xl, font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base, font-normal
- Captions/Meta: text-sm text-gray-600

## Layout System
**Spacing Units**: Consistent use of Tailwind units - primarily 4, 6, 8, 12, 16, 20, 24 for margins and padding
**Container**: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
**Grid Patterns**: 
- Course listings: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Book cards: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- Admin forms: Single column with max-w-3xl

## Component Library

### Navigation Header
- Fixed top position with white background and subtle shadow
- Logo/brand name on left, navigation links center/right
- Responsive hamburger menu for mobile (show/hide toggle)
- Conditional rendering: Login state shows "나의 수강현황" + "로그아웃", Admin shows additional "관리자" link
- Nav links: hover:text-brand-secondary transition

### Hero Section (Landing Page)
- Full-width banner with gradient background (brand-primary to brand-secondary)
- Large heading + descriptive text in white
- Two prominent CTAs: "강의 둘러보기" (primary) and "회원가입" (secondary outline)
- Height: min-h-[500px] with centered content

### Course Cards
- White background with rounded-lg and shadow-md
- Hover: shadow-xl and subtle scale transform
- Structure: Course title, instructor name, duration badge, description preview
- CTA button in brand-primary at bottom

### Book Cards
- Compact card design with book cover placeholder image (aspect-ratio-[3/4])
- Title, publisher, external link icon
- Hover: slight elevation change
- Grid layout for multiple books per row

### Video Embed Section
- Responsive 16:9 aspect ratio container
- YouTube iframe with rounded corners
- Positioned prominently in course detail page

### Form Elements
- Input fields: border-gray-300, focus:border-brand-primary, focus:ring-brand-accent
- Buttons: bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-dark
- Error messages: text-red-600 text-sm
- Toggle between login/signup: Tab-like interface with active state in brand-primary

### Progress Bars (My Status Page)
- Background: bg-gray-200, Fill: bg-brand-accent
- Height: h-2, rounded-full
- Show percentage text above/beside bar

### Admin Dashboard
- Clean, form-based interface with clear section divisions
- Input groups with labels in font-semibold
- Textarea for descriptions with min-h-[100px]
- "변경사항 저장" button prominently styled in brand-primary

### Footer
- bg-brand-dark text-white
- Centered copyright text, minimal height (py-8)

## Page-Specific Layouts

**Landing Page**: 
- Hero section → Semester sections (each with title, description, 3 book categories in grid)
- Each semester uses alternating subtle backgrounds (white/brand-light)

**Courses Page**: 
- Page title → Semester-grouped course listings
- Each semester section clearly demarcated with headers

**Course Detail Page**:
- Breadcrumb navigation
- Course header (title, instructor, duration)
- Video embed (primary focus, large)
- Enrollment section below with clear CTA
- Download materials section (UI only)

**My Status Page**:
- Welcome message with user name
- Grid of enrolled courses with progress visualization
- "강의실 입장" links to course detail pages

**Auth Page**:
- Centered card design (max-w-md mx-auto)
- Toggle tabs for login/signup
- Form fields with validation states

**Admin Page**:
- Access control check (show error for non-admins)
- Editable form sections for each semester/course
- Clear save button at bottom

## Interaction Patterns
- All interactive elements: hover effects with smooth transitions (transition-all duration-200)
- Buttons: hover:shadow-lg active:scale-95
- Links: underline-offset-4 hover:underline
- Cards: hover:shadow-xl transform hover:-translate-y-1
- No distracting animations - keep UI professional and focused

## Images
**Book Covers**: Use placeholder rectangles with subtle gradients or book icon if no cover provided
**User Avatars**: Simple circular placeholders or initials
**No hero background image needed** - use gradient backgrounds for visual interest instead

## Accessibility
- Semantic HTML throughout
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Sufficient color contrast (all text on backgrounds meets WCAG AA)

## Responsive Breakpoints
- Mobile-first approach
- Key breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Header collapses to hamburger menu below md
- Grid layouts stack to single column on mobile
- Maintain touch-friendly target sizes (min 44x44px) on mobile