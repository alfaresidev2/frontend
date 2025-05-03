# JWT Authentication System

This project implements a complete JWT-based authentication system for a React/Next.js application.

## Key Components


1. **AuthContext** (`src/context/AuthContext.tsx`)
   - Provides global authentication state
   - Handles login/logout functionality
   - Maintains user session
   - Stores JWT in both cookies (for server-side auth) and localStorage (for client-side fallback)

2. **ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
   - Client-side route protection
   - Wraps protected content in admin routes
   - Redirects unauthenticated users to the signin page

3. **Middleware** (`src/middleware.ts`)
   - Server-side route protection using Next.js middleware
   - Checks for JWT token in cookies
   - Redirects based on authentication status and requested route

4. **SignInForm** (`src/components/auth/SignInForm.tsx`)
   - Handles user login form
   - Communicates with backend API for authentication
   - Shows error messages
   - Redirects to home page after successful login

5. **UserDropdown** (`src/components/header/UserDropdown.tsx`)
   - Provides logout functionality
   - Displays user information from auth context

## Authentication Flow

1. **Login Process**:
   - User enters credentials in SignInForm
   - Form submits to backend API
   - On success, JWT token is received
   - Token is stored in both cookies and localStorage
   - User is redirected to home page

2. **Session Persistence**:
   - On app load, AuthContext checks for valid token
   - If found, user remains authenticated
   - If missing or invalid, user is redirected to signin

3. **Route Protection**:
   - Middleware checks token on server-side requests
   - ProtectedRoute component provides additional client-side protection
   - Unauthenticated users are redirected to signin

4. **Logout Process**:
   - User clicks logout in UserDropdown
   - Token is removed from cookies and localStorage
   - User is redirected to signin page

## Additional Notes

- The cookie-based approach allows for server-side authentication checks
- localStorage is used as a fallback for client-side state
- The middleware provides security at the route level
- The ProtectedRoute component provides an additional layer of protection

## Dependencies

- js-cookie: For cookie management
- next/navigation: For programmatic routing
- react-context: For global state management 
