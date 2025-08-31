# Admin System Setup

## Overview

The admin system allows designated users to view and manage reported posts. Admins can:

- View all reported posts with filtering and pagination
- Mark reports as reviewed
- Dismiss reports (with notes)
- Block posts (delete them) if they violate community guidelines

## Setup

### 1. Make a User an Admin

Run the following command to make an existing user an admin:

```bash
node scripts/makeAdmin.mjs <user-email>
```

Example:

```bash
node scripts/makeAdmin.mjs john@example.com
```

### 2. Access Admin Dashboard

Once a user is an admin:

1. Log in to the application
2. Navigate to the left sidebar menu
3. You'll see an "Admin Reports" link with a shield icon
4. Click to access the admin dashboard at `/admin/reports`

## Admin Actions

### Viewing Reports

- **Pending**: Reports that need admin review
- **Reviewed**: Reports that have been marked as reviewed
- **Dismissed**: Reports that were dismissed as invalid
- **Post Blocked**: Reports that resulted in the post being deleted

### Taking Action on Reports

For each pending report, admins can:

1. **Mark Reviewed**: Simply mark as reviewed (no further action)
2. **Dismiss**: Dismiss the report with optional admin notes
3. **Block Post**: Delete the post and add admin notes explaining why

### Admin Notes

- Required when dismissing reports or blocking posts
- Visible to other admins for transparency
- Helps maintain consistency in moderation decisions

## Database Schema

The system adds:

- `User.role` field (USER/ADMIN)
- `PostReport` model with admin tracking
- Admin action history and notes

## Security

- Only users with `role: 'ADMIN'` can access admin endpoints
- Admin actions are logged with timestamps
- All admin operations require authentication

## API Endpoints

- `GET /api/admin/reports` - List all reports (admin only)
- `PATCH /api/admin/reports/[reportId]` - Take action on a report (admin only)

## Components

- `AdminReportsDashboard` - Main admin interface
- `useAdminReportsQuery` - Hook for fetching reports
- `useAdminReportActionsMutation` - Hook for admin actions
