# Supabase Migration Verification Guide

Now that the application code has been updated to use the real Supabase tables, follow these steps to verify functionality.

## Prerequisites

- Ensure your Supabase project has all 11 tables created.
- Ensure your local development server is running (`npm run dev`).

## Verification Steps

### 1. Building Registration (Representative)

1.  **Login**: Sign in with your Google account.
2.  **Dashboard**: Navigate to the Dashboard. You might see an empty list or a prompt to register a building.
3.  **Register**: Click "새 건물 등록하기" (Register New Building).
4.  **Fill Form**: Enter test data (e.g., "Supabase Test Building").
5.  **Submit**: Complete the wizard.
6.  **Verify in DB**:
    - Go to Supabase Dashboard > Table Editor > `buildings`.
    - Confirm a new row exists with the name "Supabase Test Building".
    - Check `building_members` table to see if your user is linked as 'representative'.

### 2. Member Invitation (Optional)

1.  **Invite**: In the dashboard, go to "Member Management" or "Invite".
2.  **Send Invite**: Enter a phone number to invite.
3.  **Verify**: Check `invitations` table in Supabase.

## troubleshooting

- **"Unknown entity" error**: Console check if an entity name in code matches `TABLE_MAP` in `base44Client.js`.
- **Permission Denied**: If RLS (Row Level Security) is enabled on Supabase, you might need to add policies. (Currently RLS is disabled by default unless you turned it on).
- **Network Errors**: Check the Browser Console (F12) Network tab for red requests to Supabase.
