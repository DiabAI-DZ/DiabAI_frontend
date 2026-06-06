// Generic API envelope types. These describe the shapes returned by the backend so
// services/hooks can stay fully typed (no `any`). Concrete per-feature response types
// live alongside each feature (added as each screen is refactored).

/** Standard single-resource envelope: `{ data: T }`. */
export interface ApiResponse<T> {
  data: T;
}

/** Laravel-style pagination metadata. */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** Paginated list envelope: `{ data: T[], meta: PaginationMeta }`. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** A generic message-only response (e.g. for mutations that return `{ message }`). */
export interface MessageResponse {
  message: string;
}
