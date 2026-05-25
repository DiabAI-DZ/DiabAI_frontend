# Seeding Mock Notifications for Frontend Testing

This document describes how to seed mock notification rows in the backend so the frontend can fetch "real" (database-backed) notification data during development and testing.

Note: The backend runs in Docker Compose under `DiabAI_backend`. These commands assume you run them from the workspace root and that Docker is available.

## Quick summary
- Start backend containers (if not running)
- Run the `NotificationSeeder` (safe for local/testing)
- Optionally create more notifications for a specific test user using Tinker
- Login to get a JWT and call the notifications API to verify

## Prerequisites
- Docker & Docker Compose
- Project checkout with `DiabAI_backend` and `DiabAI_frontend` directories available
- `docker compose` should be run from the `DiabAI_backend` directory (or use absolute paths)

## Commands

1) Ensure the backend services are running

```bash
cd DiabAI_backend
docker compose up -d
docker compose ps
```

2) Run the notifications seeder

This runs the project's existing `NotificationSeeder` which is guarded to run only in `local`/`testing` environments.

```bash
cd /home/youcef/Desktop/DiabAI/DiabAI_backend
docker compose exec app php artisan db:seed --class=NotificationSeeder
```

3) (Optional) Create extra notifications for a single test user

If you want to create a handful of notifications owned by the `test@example.com` user, use Tinker:

```bash
cd /home/youcef/Desktop/DiabAI/DiabAI_backend
docker compose exec app php artisan tinker --execute "App\\Models\\Notification::factory()->count(8)->for(App\\Models\\User::where('email','test@example.com')->first())->create();"
```

4) Obtain a JWT for the test user

The seeded `UserSeeder` creates a `test@example.com` user with a known password. Use this to get an access token for API requests:

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Password123@"}' | jq
```

Save the `access_token` from the response and use it in the `Authorization` header for the next steps.

5) Fetch notifications (authenticated)

```bash
curl -s -X GET http://localhost:8000/api/notifications \
  -H "Authorization: Bearer <access_token>" | jq
```

6) Mark a notification as read / mark all as read / delete

```bash
# Mark single notification as read
curl -X PATCH http://localhost:8000/api/notifications/123/read -H "Authorization: Bearer <access_token>"

# Mark all as read
curl -X POST http://localhost:8000/api/notifications/read-all -H "Authorization: Bearer <access_token>"

# Delete a notification
curl -X DELETE http://localhost:8000/api/notifications/123 -H "Authorization: Bearer <access_token>"
```

## Troubleshooting
- If `php` is not available locally, run artisan commands inside the `app` container as shown above.
- If you see no users in the DB, run the `UserSeeder` first:

```bash
docker compose exec app php artisan db:seed --class=UserSeeder
```

- The seeder refuses to run in production. It checks `app()->environment()` and will skip unless the environment is `local` or `testing`.

- If the API returns `401`, ensure you are passing the `access_token` from the login call.

## Notes and safety
- Seeders create test data and are intended for local development only — do not run these against production databases.
- The demo/test credentials are:
  - Email: `test@example.com`
  - Password: `Password123@`

## Where this file lives
This guide is stored in the frontend repo so frontend developers can find it quickly: [DiabAI_frontend/NOTIFICATIONS_SEEDING.md](DiabAI_frontend/NOTIFICATIONS_SEEDING.md)

If you'd like, I can also commit a small Makefile target or an npm script in the frontend repo that triggers the above commands for convenience.
