# Ralph Loop Prompt — Lunch Project

You are working on the **Lunch** project — an office lunch tracker built as a pnpm monorepo (`apps/api` NestJS, `apps/web` Next.js, `packages/shared`, `packages/api-client`).

## Your Goal

**Complete exactly ONE unchecked task from the specs, then stop.**

## Process

1. **Read the spec files** in `specs/` (phase-1 through phase-7) in order.
2. **Find the first unchecked task** (`- [ ]`) across all phases, respecting phase order. A task is a single `- [ ]` checkbox line (sub-bullets under it are details for that task, not separate tasks).
3. **Check what already exists** — read relevant files to avoid duplicating work. If a task is already done (code exists, config present), mark it `[x]` in the spec and move to the next unchecked task.
4. **Implement the task** fully. Follow the spec details exactly. Don't do half-measures but also don't gold-plate — match what the spec asks for.
5. **Mark the task as done** — edit the spec file to change `- [ ]` to `- [x]` for the completed task.
6. **Run `/e2e-tests`** if you wrote or modified any code (per CLAUDE.md testing rule).
7. **Run `/review`** on your changes. If the review suggests fixes, apply them all — don't ask, just fix. Re-run `/review` until it passes clean.
8. **Commit your work** with a clear message referencing the phase and task (e.g., "phase-1: scaffold Next.js frontend app").
9. **Stop.** Do not continue to the next task. One task per loop iteration.

## Rules

- Tasks within a phase may depend on earlier tasks in the same phase. If a dependency isn't done yet, do it first (it becomes your "one task").
- If a task requires a previous phase to be complete and it isn't, skip to the first unchecked task in the earliest incomplete phase instead.
- If something is ambiguous, make a reasonable decision and move on. Don't ask questions — the loop is unattended.
- Don't refactor or improve things outside the current task's scope.
- If a task fails (e.g., dependency issue, broken test), fix the immediate blocker and complete the task. Don't go on a tangent.
- Respect existing code style and patterns already established in the project.
