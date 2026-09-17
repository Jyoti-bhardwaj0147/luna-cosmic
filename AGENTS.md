# Luna Project Agent Instructions

## Project

Luna is a Next.js App Router lunar-cycle application built with TypeScript and Tailwind CSS.

## MVP constraints

- Use the visitor’s local calendar date.
- Do not implement moonrise or moonset.
- Do not use browser geolocation.
- Do not add a database or backend.
- Do not use external APIs.
- Keep astronomy calculations in pure TypeScript functions.
- Separate calculation logic from React presentation.
- Prefer Server Components.
- Use Client Components only for state, browser APIs, or interaction.
- Use SVG or CSS for Moon visuals.
- Do not add Redux, Zustand, Three.js, or unrelated packages.

## Development rules

- Read `docs/MVP_CONTRACT.md` before making changes.
- Inspect existing code before editing.
- Preserve working code and existing design decisions.
- Do not create features outside the current task.
- Do not modify files outside the task’s stated ownership.
- Use strict TypeScript and avoid `any`.
- Ensure responsive and accessible behaviour.
- Support keyboard navigation and reduced motion.
- Never invent requirements when clarification would materially change the result.
- Run relevant tests after each milestone.
- Before completion, run TypeScript checking, linting, tests, and production build.
- Report files changed, assumptions, verification results, and remaining limitations.

## Approved Development Milestones

The project must be developed in this order:

1. Astronomy types and calculations
2. Astronomy unit tests
3. Cosmic Violet design system
4. Reusable Moon visual
5. Today’s Moon feature
6. Lunar calendar date utilities
7. Interactive calendar
8. Homepage integration
9. Motion and micro-interactions
10. Secondary pages
11. Accessibility SEO and performance
12. Final QA and deployment

## Milestone Control

- Work on only the milestone explicitly requested in the current Codex prompt.
- Do not begin the next milestone automatically.
- Do not implement features belonging to later milestones.
- Inspect and reuse valid existing work instead of creating duplicate implementations.
- Treat completed milestone contracts as stable.
- Do not change a completed milestone’s public contract unless a confirmed defect requires it.
- Report any existing out-of-order work without deleting, reverting, or expanding it.
- Run verification commands before declaring a milestone complete.
- Do not create a Git commit unless the user explicitly requests it.