# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Memory Bank Reference

**IMPORTANT**: Always refer to the MCP muscle memory bank for project context, previous decisions, and ongoing work status. The memory bank contains our comprehensive project history and should be consulted before making any significant decisions or recommendations.

## Deployment Architecture - SUPABASE + VERCEL STACK

**CRITICAL WARNING**: This project uses SUPABASE + VERCEL deployment stack ONLY. Railway is NOT used in this project and should never be configured.

### Deployment Stack
- **Database**: Supabase PostgreSQL (https://fsjodpnptdbwaigzkmfl.supabase.co)
- **Frontend/Backend**: Vercel with Next.js
- **Configuration Files**: 
  - `vercel.json` - Vercel deployment configuration
  - `next.config.js` - Next.js configuration
  - `lib/supabase.ts` - Supabase client configuration

### Git Repository Status
- **Repository**: `Work-Local-Inc/menuca-rebuild`
- **Main Branch**: `main` 
- **Deployment**: Automatic deployment to Vercel on push to main branch
- **Database**: Supabase handles database hosting and management

### Deployment Commands
```bash
# Deploy to Vercel (automatic on git push)
git status && git add . && git commit -m "Deploy update" && git push origin main

# Manual Vercel deployment (if needed)
vercel --prod

# Check Supabase connection
npx supabase status
```

### Common Deployment Issues
- Ensure environment variables are set in Vercel dashboard
- Verify Supabase connection string in environment variables
- Check build logs in Vercel dashboard for deployment failures

## Project Overview

This is the MenuCA rebuild project - a multi-tenant SaaS platform for restaurant management. The codebase is currently in the planning/specification phase, containing structured requirements and design documents rather than implementation code.

## Architecture & Structure

### Document Organization
The project follows a structured requirement specification approach:

- **BRD/**: Business Requirement Documents (BRD01-BRD15) - Core business logic and requirements
- **PRD/**: Product Requirement Documents - Both base specifications (PRD01-base.json) and feature details (PRD01-feature.json)
- **NFR/**: Non-Functional Requirements (NFR01-NFR15) - Performance, security, scalability requirements  
- **UIR/**: User Interface Requirements (UIR01-UIR15) - UI/UX specifications
- **docs/**: Human-readable documentation (currently contains PRD05.md)
- **specifications/**: Additional specification files
- **DBA01-DBA06.md**: Database Architecture Documents - Comprehensive database design, security, performance, and operations specifications

### Key Components Being Planned

Based on the requirements documents, the system will include:

1. **Multi-tenant SaaS Architecture** (PRD05): Core platform infrastructure with tenant isolation, authentication, and APIs
2. **Commission Tracking System** (PRD01): Revenue tracking and payment processing integration
3. **Restaurant Management Features**: Order processing, menu management, customer management
4. **Role-based Access Control**: Different user types (customers, restaurant staff, platform admins)

## Development Workflow

### Current Phase: Specification & Planning
This project is in the requirements gathering phase. The JSON specifications contain structured data about:
- User stories and acceptance criteria
- Technical tasks and implementation details
- Business requirements and constraints
- UI/UX requirements

### Working with Specifications
- **BRD files**: Reference these for understanding business logic requirements
- **PRD files**: Contains both high-level product requirements (-base.json) and detailed feature specs (-feature.json)
- **NFR files**: Critical for understanding performance, security, and scalability requirements
- **UIR files**: Essential for UI/UX implementation guidance

### Document Linking
Many specifications reference each other via `linkedBRDIds` fields. Always check cross-references when working on features to understand dependencies.

## File Formats

All specification files use JSON format with consistent schemas containing:
- `title`: Descriptive name
- `requirement`: Detailed requirement description
- `linkedBRDIds`: Array of related BRD document IDs (where applicable)

The project uses a hybrid approach with both JSON specifications and Markdown documentation for different audiences.

## Database Architecture

### Technology Stack
- **Primary Database**: PostgreSQL 15+ with Row Level Security (RLS) for multi-tenant isolation
- **Caching Layer**: Redis 7+ for session management, real-time data, and performance optimization
- **Connection Management**: PgBouncer connection pooling with read replica support

### Database Documentation
The database architecture is fully documented in the DBA series:

- **DBA01**: Technology architecture and infrastructure requirements
- **DBA02**: Multi-tenant design with shared schema and RLS policies
- **DBA03**: Complete data model with entities, relationships, and schemas
- **DBA04**: Security architecture including encryption, compliance, and access control
- **DBA05**: Performance and scalability design with caching and optimization strategies
- **DBA06**: Data management operations including backup, monitoring, and maintenance

### Key Database Features
- **Multi-tenant Architecture**: Shared schema with PostgreSQL RLS for tenant isolation
- **Comprehensive Schema**: 8 core entity types with full relationships and constraints
- **Security Compliance**: GDPR and PCI DSS compliant with encryption and audit logging
- **Performance Optimization**: Sub-2 second response times with caching and read replicas
- **High Availability**: 99.9% uptime with automated backup and disaster recovery

### Task Integration
The database architecture supports all 418 technical tasks found in the PRD feature files, providing the foundation for:
- Commission tracking and revenue management
- Multi-device customer experience
- Payment processing with Stripe integration  
- Role-based access control and security
- Real-time analytics and reporting