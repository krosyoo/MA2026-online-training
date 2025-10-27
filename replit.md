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

**API Pattern**: RESTful API design with routes prefixed under `/api`. Currently uses an in-memory storage implementation (MemStorage class) with an abstraction layer (IStorage interface) designed to be replaced with database operations.

**Session Management**: Prepared for session-based authentication using connect-pg-simple for PostgreSQL session storage.

**Build Process**: 
- Client built with Vite to `dist/public`
- Server bundled with esbuild to `dist/index.js`
- Development uses tsx for TypeScript execution

### Data Architecture

**Schema Design**: Uses Drizzle ORM with PostgreSQL dialect. Current schema includes a users table with UUID primary keys. The schema is designed to be extended with tables for courses, enrollments, and progress tracking.

**Type System**: Shared TypeScript types between client and server in the `/shared` directory, including:
- Course and Semester data structures
- User authentication types
- Zod schemas for validation via drizzle-zod

**Data Flow**: Currently uses mock data (INITIAL_SEMESTERS in shared/data.ts) stored in React Context. Designed to transition to API-driven data fetching with TanStack Query.

### Authentication & Authorization

**Authentication Strategy**: Session-based authentication pattern (not fully implemented). Uses password-based login with role-based access control (student/admin roles).

**Authorization Levels**:
- Public: Landing page, course browsing
- Student: Course enrollment, progress tracking
- Admin: Content management, user administration

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