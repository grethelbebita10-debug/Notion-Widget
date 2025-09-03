# Notion Image Gallery Widget

## Overview

This is a Flask-based web application that creates an interactive image gallery widget powered by Notion database integration. The application fetches data from a configured Notion database and displays it as a responsive gallery with filtering capabilities. Users can browse images, filter by platform, and view them in a modal interface with navigation controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single-page application** using vanilla JavaScript with no frontend frameworks
- **Bootstrap 5** for responsive grid system and UI components
- **Font Awesome** for consistent iconography
- **Modal-based image viewer** with keyboard navigation and click-outside-to-close functionality
- **Dynamic filtering system** with platform-based categorization
- **Progressive loading states** with spinner, error, and empty state handling

### Backend Architecture
- **Flask web framework** serving as a lightweight REST API server
- **Template-based rendering** using Jinja2 for the main HTML page
- **RESTful API endpoints** (`/api/data`, `/api/platforms`) for data retrieval
- **Proxy middleware** (ProxyFix) for deployment behind reverse proxies
- **Environment-based configuration** for secrets and database IDs
- **Comprehensive error handling** with logging at DEBUG level

### Data Integration
- **Notion Client SDK** for direct database queries
- **Real-time data fetching** without local caching or persistence
- **Dynamic schema discovery** for platform options extraction
- **JSON-based API responses** for frontend consumption

### Security & Configuration
- **Environment variable management** for sensitive credentials (Notion tokens, database IDs)
- **Session secret configuration** with fallback defaults
- **CORS-ready architecture** for potential cross-origin deployment

## External Dependencies

### Third-Party Services
- **Notion API** - Primary data source requiring integration token and database ID
- **Notion Database** - Must be properly configured with image and platform properties

### JavaScript Libraries
- **Bootstrap 5.3.0** (CDN) - UI framework and responsive grid system
- **Font Awesome 6.0.0** (CDN) - Icon library for UI elements

### Python Dependencies
- **Flask** - Web framework and template engine
- **notion-client** - Official Notion API client library
- **Werkzeug ProxyFix** - Middleware for deployment behind proxies

### Infrastructure Requirements
- **Environment variables**: `NOTION_INTEGRATION_SECRET`, `NOTION_DATABASE_ID`, `SESSION_SECRET` (optional)
- **Web server compatibility** with WSGI applications (Gunicorn, uWSGI)
- **Internet connectivity** for Notion API calls and CDN resources