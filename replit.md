# MindWell - Mental Health Companion

## Overview

MindWell is a comprehensive mental health tracking application designed to help users monitor their wellbeing through multiple dimensions. The application provides tools for tracking mood, sleep patterns, medication adherence, and journaling. Built as a full-stack web application, it features a modern React frontend with a clean, accessible interface and an Express.js backend with PostgreSQL database storage.

The application follows a dashboard-centric approach where users can view aggregated insights from all tracking categories, with dedicated pages for detailed management of each health metric. The design emphasizes simplicity and ease of use to encourage consistent daily tracking habits.

**App Store Compatibility**: The application has been configured as a Progressive Web App (PWA) with service worker caching, app manifest, and mobile optimization for potential App Store distribution through platforms like Capacitor or Expo.

## User Preferences

Preferred communication style: Simple, everyday language.
App name preference: "MindWell" (updated from "MindFlow")

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Client-side routing implemented with Wouter for lightweight navigation
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design system
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Charts**: Chart.js integration for data visualization (sleep patterns, mood trends)
- **Responsive Design**: Mobile-first approach with dedicated mobile navigation component

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **API Design**: RESTful API endpoints following resource-based URL patterns
- **Session Storage**: PostgreSQL session store using connect-pg-simple
- **Development Setup**: Hot reload with Vite middleware integration in development mode
- **Build Process**: ESBuild for server bundling and Vite for client bundling

### Database Schema Design
The application uses a PostgreSQL database with the following core entities:
- **Users**: Replit Auth integration with email, names, profile images, and timestamps
- **Sessions**: Secure session storage table for Replit Auth token management
- **Mood Entries**: Categorical mood tracking with notes and timestamps
- **Sleep Entries**: Comprehensive sleep data including bedtime, wake time, duration, and quality ratings
- **Medications**: User medication management with dosage and scheduling information
- **Medication Taken**: Adherence tracking for scheduled medications
- **Journal Entries**: Free-form text entries with optional titles and timestamps

### Data Storage Strategy
- **Primary Database**: PostgreSQL via Neon serverless for scalable cloud hosting
- **ORM Layer**: Drizzle ORM provides type-safe database operations and migrations
- **Schema Management**: Database schema defined in shared TypeScript files for consistency
- **Migration System**: Drizzle Kit handles database schema versioning and migrations

### Authentication & Session Management
- **Authentication Provider**: Replit Auth (OpenID Connect) for secure user authentication
- **Session Strategy**: PostgreSQL session storage using connect-pg-simple for production reliability
- **User Management**: Complete user upsert system supporting Replit user claims (email, name, profile image)
- **Authorization**: JWT token refresh and protected API endpoints with middleware
- **Security**: Production-ready authentication with proper session expiration and token management

### Development & Build Pipeline
- **Development Server**: Vite development server with HMR for client, tsx for server hot reload
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Build Output**: Separate client (static files) and server (Node.js) bundle generation
- **Path Aliases**: Configured for clean imports using @ for client code and @shared for common types

### Component Architecture
- **Design System**: shadcn/ui provides consistent, accessible components
- **Authentication Flow**: Landing page for unauthenticated users, home dashboard for authenticated users
- **Layout Strategy**: Conditional rendering based on auth state - full landing page or app with header/mobile nav
- **Protected Routes**: All main features require authentication via Replit Auth
- **Modal Management**: Radix UI primitives for accessible dialogs and overlays
- **Form Components**: Reusable form components with integrated validation feedback
- **Data Visualization**: Custom chart components wrapping Chart.js for sleep and mood trends

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching layer
- **wouter**: Lightweight client-side routing solution
- **react-hook-form**: Form state management with performance optimization
- **@hookform/resolvers**: Validation resolver integration for Zod schemas

### UI and Design System
- **@radix-ui/***: Comprehensive set of accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework for responsive design
- **class-variance-authority**: Component variant management for design system
- **lucide-react**: Consistent icon library for interface elements

### Database and Backend
- **drizzle-orm**: Type-safe ORM for PostgreSQL database operations
- **drizzle-kit**: Database migration and schema management tooling
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **connect-pg-simple**: PostgreSQL session store for Express.js sessions

### Development and Build Tools
- **vite**: Modern build tool with fast development server and HMR
- **tsx**: TypeScript execution for server-side development
- **esbuild**: Fast bundler for server-side code production builds
- **@replit/vite-plugin-runtime-error-modal**: Development error handling integration

### Data Validation and Utilities
- **zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities
- **clsx & tailwind-merge**: Conditional CSS class name utilities for component styling