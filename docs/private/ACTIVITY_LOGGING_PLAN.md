# Future Plan: Comprehensive User Activity Logging

## Overview
We need to implement a comprehensive activity logging system to track all user actions across the platform. This will provide an audit trail for security, support, and analytics purposes. The system should track activities for all user roles (client, provider, admin, enterprise) and store these logs persistently.

## Activities to Track
The system must log the following events at a minimum:
- **Authentication**: Login time, logout time, failed login attempts.
- **Account & Profile**: Changes to account settings, profile section edits, password resets, 2FA setup/changes.
- **Wallet & Transactions**: Wallet top-ups, deductions for job executions, credit payouts for providers.
- **Core Functionality**: Job submissions, job cancellations, GPU registrations, GPU status changes.
- **Admin Actions**: Toggling user statuses, modifying system settings, uploading new agent releases.

## Log Schema
Each activity log entry should capture:
- `timestamp`: Exact UTC time of the event.
- `user_id`: The ID of the user performing the action.
- `role`: The role of the user (client, admin, etc.) at the time.
- `event_type`: Categorized string (e.g., `AUTH_LOGIN`, `PROFILE_UPDATE`, `WALLET_TRANSACTION`).
- `description`: Human-readable summary of the action.
- `metadata`: JSON payload containing context (e.g., old vs. new values, transaction amount, related job/GPU ID).
- `ip_address`: (Optional) User's IP address.
- `user_agent`: (Optional) Client device/browser info.

## Storage Strategy
1. **File-Based Logging**: Write all activity logs to a structured log file (e.g., `logs/activity.log` in JSON Lines format) for permanent archiving and easy ingestion into log management tools (like ELK stack or Datadog).
2. **Database Logging**: Create a `user_activities` table in the PostgreSQL database to allow easy querying and display within the Admin Dashboard or User Profile pages.

## Implementation Steps
1. **Backend Model**: Create a `UserActivity` SQLAlchemy model and corresponding Pydantic schemas.
2. **Logging Utility**: Implement a backend utility or dependency (e.g., `log_user_activity(user, event_type, metadata)`) that writes to both the database and the file system.
3. **Integration**: Inject this utility into existing FastAPI endpoints (auth, wallet, jobs, admin, etc.).
4. **Admin Dashboard**: Add a new "Audit Logs" or "Activity" tab in the Admin Panel to display and filter these records.
5. **User Profile**: Add a "Recent Activity" section for users to view their own history (e.g., login history, recent changes).
