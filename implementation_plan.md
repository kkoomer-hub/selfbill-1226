# Strict Login Enforcement on Landing Page

The user requires that the landing page (`/`) always serves as a login page, even if the user has a cached session. To proceed, the user must explicitly log in again. We need to distinguish between a "cached session visit" (which should be logged out) and a "return from OAuth provider" (which should be logged in).

## Proposed Changes

### [Frontend Routing]

#### [MODIFY] [src/pages/index.jsx](file:///e:/0.OzcodingSchool/AI%20%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%20code/self-bill-1226/src/pages/index.jsx)

- Update `PagesContent` component:
  - Detect `INITIAL_SESSION` event from `base44.supabase.auth.onAuthStateChange`.
  - Check `window.location` for OAuth callback parameters (`access_token`, `code`, `type=recovery`) to identify a fresh login attempt.
  - **Logic**:
    - If `INITIAL_SESSION` has a session AND **NO** callback params: Execute `base44.supabase.auth.signOut()` to clear cache and stay on Login page.
    - If `SIGNED_IN` (or `INITIAL_SESSION` with callback params): Navigate to `/Onboarding` (only if currently on `/` or `/Login`).
    - Logic for `SIGNED_OUT`: Remain on/Navigate to `/Login`.

## Verification Plan

### Manual Verification

1.  **Test Cached Login (The Fix)**:
    - Log in successfully.
    - Close the tab or browser.
    - Open a new tab and navigate to `http://localhost:5173/`.
    - **Expectation**: User stays on the Login page (session is cleared). Do NOT auto-redirect to `/Onboarding`.
2.  **Test Fresh Login**:
    - Click "Sign in with Google" on the Login page.
    - Complete Google Auth.
    - **Expectation**: Redirect back to app, then auto-redirect to `/Onboarding`.
3.  **Test Navigation**:
    - Once logged in, refresh the page on `/Onboarding`.
    - **Expectation**: Stay on `/Onboarding` (since the path is not `/` or `/Login`).
