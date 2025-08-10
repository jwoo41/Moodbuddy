# MoodBuddy - Mental Health Companion

## Overview

MoodBuddy is a comprehensive mental health tracking application designed to help users monitor their wellbeing through multiple dimensions. The application provides tools for tracking mood, sleep patterns, medication adherence, and journaling. Built as a full-stack web application, it features a modern React frontend with a clean, accessible interface and an Express.js backend with PostgreSQL database storage.

The application follows a dashboard-centric approach where users can view aggregated insights from all tracking categories, with dedicated pages for detailed management of each health metric. The design emphasizes simplicity and ease of use to encourage consistent daily tracking habits.

**App Store Compatibility**: The application has been configured as a Progressive Web App (PWA) with service worker caching, app manifest, and mobile optimization for potential App Store distribution through platforms like Capacitor or Expo.

**Recent Updates (August 2025)**: 
- Enhanced mood tracking with optional description field for detailed emotional context
- Added bedtime/wake-up descriptor fields to sleep logging for better sleep quality insights
- Implemented visual pill representation showing 1-3 pills based on medication frequency
- Added personalized header with user's display name and profile management
- Improved medication tracking UI with large thumbs up/down buttons and clear labeling
- Enhanced database schema to support mood descriptions, sleep descriptors, and user display names
- Added comprehensive notification system with medication reminders and optional bedtime notifications
- Implemented exercise tracking widget with yes/no logging and visual feedback (💪/😴 emojis)
- Added weight tracking functionality with lbs/kg unit support and historical tracking
- Enhanced sleep tracking interface with simplified bedtime (🛏️) and wake-up time (⏰) inputs
- **Alert Sharing System**: Users can share health alerts with emergency contacts via email/phone
- **User Onboarding**: Comprehensive setup flow captures contact info, emergency contacts, and alert preferences
- **Health Pattern Monitoring**: Automatic detection of low mood patterns (5+ days) and medication non-compliance (70% adherence over 3 days)
- **Emergency Contact Integration**: Optional alert sharing with trusted contacts for concerning health patterns
- **Crisis Support Resources**: Added 24/7 mental health emergency hotlines (988, Crisis Text Line, international help) to landing page and main app
- **Fixed False Alerts**: Medication adherence alerts now only trigger after medications have been tracked for at least 3 full days, preventing false alerts on first-day usage
- **Mood Trend Visualization**: Implemented beautiful Chart.js-powered mood visualization with soothing color gradients (purple to blue to green scale), showing 14-day trends on mood page and 7-day compact chart on home dashboard
- **Mood Analytics & Insights**: Added comprehensive mood insights component with streak tracking, pattern identification, weekly summaries, and trend analysis (improving/declining/stable)
- **Enhanced Mood Experience**: Full-page mood charts with gradient fills, individual mood-colored data points, accessible tooltips, and reference legend for better emotional pattern understanding
- **Comprehensive Gamification System**: Implemented full streak tracking and achievement system across all tracking categories (mood, sleep, medication, exercise, weight, journal) with:
  - Individual streak counters and longest streak records for each category
  - Achievement system with first entry, streak milestones (3, 7, 14, 30+ days), and total entry milestones
  - Real-time achievement notifications through toast system when users earn new achievements
  - Dedicated Progress page showing streak summaries, active streaks, achievement timeline, and category-based progress
  - Integration with all tracking endpoints to automatically update streaks and award achievements
  - Visual streak indicators in success messages (🔥 streak counter, 🎉 new record indicators)
  - Database schema supporting user streaks and achievements with proper relationships
- **Multi-Step Onboarding Experience**: Created beautiful 4-step onboarding flow matching modern app design patterns:
  - Welcome screen with friendly MoodBuddy introduction and avatar
  - Features overview highlighting mood tracking, sleep analysis, reminders, and AI chat capabilities
  - Optional notification setup with time picker for daily check-ins
  - Interactive first mood check with emoji selection and sample progress indicators
  - Clean design with step progress indicators, smooth navigation, and intuitive user flow
- **Adaptive Background Music/Soundscape System**: Implemented mood-responsive ambient audio feature with:
  - Real-time mood detection from latest mood entries to automatically adapt soundscape
  - Five distinct soundscapes: Uplifting Birds (very happy), Peaceful Garden (happy), Gentle Rain (neutral), Ocean Waves (sad), Forest Embrace (very sad)
  - Web Audio API integration for procedurally generated ambient sounds specific to each mood
  - Volume control with real-time adjustment and visual feedback
  - Play/pause functionality with seamless looping
  - Dynamic color themes that match the current active soundscape
  - Automatic soundscape switching when mood changes while playing
- **Intelligent Context-Aware Chat Memory Retention**: Implemented comprehensive conversation memory system with:
  - PostgreSQL database schema for chat conversations, messages, and user context profiles
  - Automatic message storage with sentiment analysis and topic extraction
  - User context building from recent mood entries, exercise, sleep, and activity data
  - Personalized AI responses based on conversation history and current emotional state
  - Topic detection for mental health themes (anxiety, depression, stress, sleep, work, relationships)
  - Memory panel UI showing stored messages count, recent mood, activities, and conversation topics
  - Conversation continuity across sessions with intelligent context awareness
  - Fallback response system maintaining memory functionality even when OpenAI quota exceeded

## User Preferences

Preferred communication style: Simple, everyday language.
App name preference: "MoodBuddy" (updated from "MindFlow" → "MindWell" → "MoodBuddy")
Home page interface preference: Simple, emoji-focused design with prominent mood tracking
Medication tracking preference: 
- Visual pill display (2 pills for twice daily, 1 pill for once daily medications)
- Large thumbs up/down tracking buttons with "Taken"/"Skip" labels
- Clear schedule display with times shown under each pill
- All medication tracking on home page (not separate screen)
Sleep tracking preference: 
- Quick and easy logging with bedtime and wake-up descriptor fields
- Enhanced sleep form with "How did you feel going to bed?" and "How did you feel waking up?" inputs
Personalization preference: 
- Personalized header with user's display name
- User profile management for setting custom display name
- Mood tracking with optional description field for detailed emotional context

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
- **Users**: Replit Auth integration with email, names, displayName for personalization, profile images, and timestamps
- **Sessions**: Secure session storage table for Replit Auth token management
- **Mood Entries**: Categorical mood tracking with optional description field, notes and timestamps
- **Sleep Entries**: Comprehensive sleep data including bedtime, wake time, duration, quality ratings, bedtime/wakeup descriptors
- **Medications**: User medication management with dosage and scheduling information
- **Medication Taken**: Adherence tracking for scheduled medications
- **Journal Entries**: Free-form text entries with optional titles and timestamps
- **Exercise Entries**: Boolean exercise tracking with optional notes and timestamps
- **Weight Entries**: Weight tracking with unit support (lbs/kg), optional notes, and timestamps

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