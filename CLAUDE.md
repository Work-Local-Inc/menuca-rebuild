# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Memory Bank Reference

**IMPORTANT**: Always refer to the MCP muscle memory bank for project context, previous decisions, and ongoing work status. The memory bank contains our comprehensive project history and should be consulted before making any significant decisions or recommendations.

## Railway & Git Connection Management

### Railway API Authentication
- **API Token**: `21a38a60-6f6d-4fff-9c2f-1cf0ee4c1754`
- **GraphQL Endpoint**: `https://backboard.railway.com/graphql/v2`
- **Team ID**: `433071a5-f830-42f0-a259-d4bbff4b46db`
- **Project ID**: `131e1e50-fced-49f2-8ad7-668828ab33f1` (pacific-light)
- **Service ID**: `ddafc9ac-0dac-409a-af11-ddaebced486c` (mode)
- **Production URL**: `https://mode-production.up.railway.app`

### Git Repository Status
- **Repository**: `Work-Local-Inc/menuca-rebuild`
- **Main Branch**: `main` 
- **Issue**: Railway auto-deploy may not be configured - commits don't trigger new deployments
- **Last Successful Deploy**: `e046cf99-2faf-40b2-bfcd-553528b4232d` (2025-07-30T03:18:03.159Z)

### Connection Commands
```bash
# Railway API Check
curl -H "Authorization: Bearer 21a38a60-6f6d-4fff-9c2f-1cf0ee4c1754" https://backboard.railway.com/graphql/v2 -d '{"query":"query { me { name email } }"}' -H "Content-Type: application/json"

# Check Latest Deployments
curl -H "Authorization: Bearer 21a38a60-6f6d-4fff-9c2f-1cf0ee4c1754" https://backboard.railway.com/graphql/v2 -d '{"query":"query { project(id: \"131e1e50-fced-49f2-8ad7-668828ab33f1\") { services { edges { node { name deployments(first: 3) { edges { node { id status createdAt } } } } } } } }"}' -H "Content-Type: application/json"

# Git Status and Clean Push
git status && git add . && git commit -m "Deploy update" && git push origin main
```

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