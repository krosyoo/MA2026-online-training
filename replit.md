# Mahanaim Online Training System

## Overview

The Mahanaim Online Training System is a Korean-language educational platform for faith-based training. It provides a structured 4-semester curriculum (믿음반, 성장반, 제자훈련반, 리더반) with video courses, reading materials, and progress tracking. The platform features student enrollment, course management, and administrative capabilities for managing curriculum content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Client-side routing implemented with Wouter (lightweight alternative to React Router).

**UI Component Library**: Shadcn UI components built on Radix UI primitives with Tailwind CSS for styling. The design system follows a Korean-optimized aesthetic with the Noto Sans KR font family and a custom brand color palette (blue-themed: #0D47A1 primary, #1976D2 secondary, #42A5F5 accent).

**State Management**: 
- React Context API for global state (AuthContext for authentication, DataContext for curriculum data)
- TanStack Query (React Query) for server state management
- Local component state with React hooks

**Styling Approach**: Tailwind CSS with custom design tokens defined in the configuration. Uses a consistent spacing system and responsive grid layouts (mobile-first approach).

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js.

**API Pattern**: RESTful API under `/api`, defined once in `server/routes.ts` and backed by Postgres through `server/storage.ts`. Requests that fall through the router get a JSON 404 so the client never receives HTML where it expects JSON.

**Deployment Targets**: The same Express app runs in two shapes:
- `server/index.ts` — long-running process serving API + client (local, Replit)
- `api/[...path].ts` — Vercel serverless function serving the API only; the client is served from Vercel's CDN

`server/app.ts` builds the app both share. See `DEPLOY.md` for the Vercel setup.

**Session Management**: Stateless JWT in an httpOnly, SameSite=Lax cookie (`server/auth.ts`). Memory-backed sessions cannot work on serverless, where each request may hit a different instance.

**Build Process**:
- Client built with Vite to `dist/public`
- Server bundled with esbuild to `dist/index.js` (non-Vercel deploys only)
- Development uses tsx for TypeScript execution; `.env` is loaded via `server/env.ts`

### Data Architecture

**Schema Design**: Drizzle ORM with PostgreSQL. Tables: `users`, `semesters`, `courses`, `books`, `enrollments`. Curriculum ids are fixed values from `shared/data.ts` rather than sequences, so seeding is reproducible.

**Database Driver**: `server/db.ts` selects the driver from the connection string — Neon's HTTP driver for `*.neon.tech` (stateless, safe across serverless cold starts), node-postgres for any other Postgres. Neither uses interactive transactions, so every write is a single statement.

**Type System**: Shared TypeScript types between client and server in `/shared`:
- `shared/types.ts` — client-facing shapes (the `User` type deliberately has no password field)
- `shared/schema.ts` — Drizzle tables plus the Zod schemas that validate every request body

**Data Flow**: The curriculum and session both come from the API via TanStack Query (`DataContext`, `AuthContext`). `shared/data.ts` is now seed input only and is no longer bundled into the client.

### Authentication & Authorization

**Authentication Strategy**: Password login with scrypt-hashed passwords (`node:crypto`), JWT session cookie, and role-based access control (student/admin).

**Authorization Levels**:
- Public: Landing page, course browsing, `GET /api/semesters`
- Student: Course enrollment, progress tracking
- Admin: Content management via `PUT /api/semesters`

Admin role is re-read from the database on every privileged request, so revoking an account's role takes effect immediately even if its cookie is still valid.

### Key Design Patterns

**Component Architecture**: Atomic design with reusable UI components (Button, Card, Input) composed into feature components (CourseCard, BookCard) and page-level components.

**Form Handling**: React Hook Form with Zod schema validation using @hookform/resolvers.

**Error Handling**: Custom error overlay in development (Replit-specific plugins), toast notifications for user feedback.

**Responsive Design**: Mobile-first approach with Tailwind breakpoints (sm, md, lg) and hamburger menu for mobile navigation.

## External Dependencies

### Core Framework Dependencies
- **React 18**: UI library
- **Express.js**: Backend server framework
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type safety across the stack

### Database & ORM
- **Drizzle ORM**: Type-safe database toolkit
- **@neondatabase/serverless**: PostgreSQL database driver (Neon serverless)
- **drizzle-kit**: Schema migrations and management
- **connect-pg-simple**: PostgreSQL session store

### UI Component Libraries
- **Radix UI**: Headless UI primitives (20+ components including Dialog, Dropdown, Popover, etc.)
- **Shadcn UI**: Pre-styled component layer on top of Radix
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### State Management
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight routing

### Video Integration
- **YouTube Embed API**: Course videos hosted on YouTube, embedded via iframe

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production
- **Replit-specific plugins**: Development tooling for the Replit environment

### Font Resources
- **Google Fonts CDN**: Noto Sans KR for Korean language support