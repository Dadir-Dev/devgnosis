# Seed Data Specification

## Overview

Create a seed script (`src/db/seed.ts`) to populate the database with sample data for development and demos. The script uses the Drizzle client in `src/db/index.ts`, runs with `bun run db:seed`, and must be idempotent so it is safe to run repeatedly and on every deploy.

## Requirements

### User

- **Email:** demo@devgnosis.app
- **Name:** Demo User
- **Password:** 12345678 — created through the Better Auth server API (`auth.api.signUpEmail`); never hand-hash or write credentials directly, as Better Auth owns password hashing.
- **Plan:** `free` in `user_profiles`; entitlements derive from `subscriptions` and mirror into `user_profiles`, so the seed does not set a standalone entitlement boolean.
- **emailVerified:** true, so the demo user can sign in immediately.

### System Item Types

| Name    | Icon       | Color   |
| ------- | ---------- | ------- |
| snippet | Code2      | #3B82F6 |
| prompt  | Sparkles   | #8B5CF6 |
| command | Terminal   | #F97316 |
| note    | StickyNote | #FDE047 |
| file    | File       | #6B7280 |
| image   | Image      | #EC4899 |
| link    | Link       | #10B981 |

Icons are Lucide React component names. Each type is seeded with `isSystem: true`, `ownerId: null`, and its `contentKind` (`text`, `url`, or `file`), and is upserted on the partial unique index over `key` where `is_system` is true.

### Collections & Items

#### React Patterns

_Description: Reusable React patterns and hooks_

3 snippets (TypeScript):

- Custom hooks (useDebounce, useLocalStorage, etc.)
- Component patterns (Context providers, compound components)
- Utility functions

#### AI Workflows

_Description: AI prompts and workflow automations_

3 prompts:

- Code review prompts
- Documentation generation
- Refactoring assistance

#### DevOps

_Description: Infrastructure and deployment resources_

- 1 snippet (Docker, CI/CD config)
- 1 command (deployment scripts)
- 2 links (documentation URLs - use real URLs)

#### Terminal Commands

_Description: Useful shell commands for everyday development_

4 commands:

- Git operations
- Docker commands
- Process management
- Package manager utilities

#### Design Resources

_Description: UI/UX resources and references_

4 links (use real URLs):

- CSS/Tailwind references
- Component libraries
- Design systems
- Icon libraries
