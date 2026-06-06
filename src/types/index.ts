// Single import surface for app types. New code should `import type { LogEntry } from '../types'`.
//
// Domain types currently live in `services/types.ts` (well-typed already); this barrel
// re-exports them so the canonical location is `types/` going forward, without moving the
// file (which would break ~20 existing imports). Per-feature response types are added here
// as each screen is refactored against its real service.
export * from './api';
export * from '../services/types';
