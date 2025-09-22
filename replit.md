# Overview

This is a modern flight search application called "FlightAI" that helps users find affordable flights with strategic stopovers. The application specializes in intelligent flight search with multi-day layovers, allowing travelers to explore new cities while saving money. Built with React, TypeScript, and modern web technologies, it provides an intuitive interface for complex flight search scenarios.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a modern React-based Single Page Application (SPA) architecture built with Vite for fast development and build processes. The frontend is structured using:

- **React 18** with TypeScript for type safety and modern React features
- **React Router** for client-side routing with dedicated pages for search and results
- **Tailwind CSS** with shadcn/ui components for consistent, modern UI design
- **TanStack Query** for efficient server state management and caching
- **React Hook Form** with Zod validation for form handling

The component structure follows a modular approach with separate directories for UI components, search functionality, and results display. The application uses a custom design system with aviation-inspired colors and theming.

## Backend Architecture

The backend is built as an Express.js server with integrated Vite development support:

- **Express.js** server handling API routes and serving static assets
- **Development/Production modes** with Vite integration for development and static file serving for production
- **RESTful API design** with dedicated flight search endpoints
- **Error handling and timeout management** for external API calls

## Data Storage Solutions

The application uses a PostgreSQL database accessed through:

- **Neon Database** as the cloud PostgreSQL provider
- **Drizzle ORM** for type-safe database operations and schema management
- **Connection pooling** for efficient database connections
- **Schema migration support** with automatic table creation on startup

The database schema includes tables for users, flight searches, and search analytics, allowing for future features like user accounts and search history.

## Authentication and Authorization

Currently, the application operates without authentication, focusing on anonymous flight searches. The database schema includes a users table prepared for future authentication implementation.

## External Service Integrations

The application integrates with external flight data providers:

- **Amadeus API** for real-time flight data and search capabilities
- **Test/Production environments** with proper API key management
- **OAuth2 token management** for API authentication
- **Rate limiting and error handling** for external API calls

The search functionality supports complex multi-city searches with flexibility options for dates and routing preferences.

# External Dependencies

## Core Framework Dependencies
- **React 18** - Frontend framework with hooks and modern features
- **Vite** - Build tool and development server
- **TypeScript** - Type safety and enhanced developer experience
- **Express.js** - Backend server framework

## UI and Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components for accessibility
- **shadcn/ui** - Pre-built component library
- **Lucide React** - Icon library

## State Management and Data Fetching
- **TanStack React Query** - Server state management and caching
- **React Hook Form** - Form state management
- **React Router DOM** - Client-side routing

## Database and ORM
- **Neon Database** - Cloud PostgreSQL database
- **Drizzle ORM** - Type-safe database toolkit
- **@neondatabase/serverless** - Serverless database driver

## External APIs
- **Amadeus API** - Flight search and booking data
- **WebSocket support** - For real-time database connections

## Development Tools
- **ESLint** - Code linting and style enforcement
- **PostCSS** - CSS processing and autoprefixing
- **date-fns** - Date manipulation and formatting
- **CORS** - Cross-origin resource sharing middleware