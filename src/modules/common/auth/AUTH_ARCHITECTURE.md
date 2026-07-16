# Authentication & Session Management (Production Blueprint)

## Scalable Folder Structure

```text
src/
  modules/
    ecommerce/
      auth/
        api/
          axios.ts
        context/
          AuthContext.tsx
        screens/
          SplashScreen.tsx
          LoginScreen.tsx
          RegisterScreen.tsx
          VerifyEmailScreen.tsx
        AUTH_ARCHITECTURE.md
      navigation/
        MainTabs.tsx
  navigation/
    RootNavigator.tsx
    types.ts
```

## Session Lifecycle Diagram

```mermaid
flowchart TD
  A[App Launch] --> B[SplashScreen]
  B --> C{Refresh token in SecureStore?}
  C -- No --> D[PublicStack]
  C -- Yes --> E[POST /auth/refresh]
  E -- Fail --> F[Clear secure token + PublicStack]
  E -- Success --> G[Set accessToken in memory]
  G --> H[GET /auth/user-info]
  H -- Success --> I[ProtectedStack]
  H -- Fail --> F

  J[Login] --> K[POST /auth/login]
  K --> L[accessToken memory + refreshToken secure]
  L --> H

  M[API 401] --> N[Axios interceptor refresh flow]
  N --> O{Refresh success?}
  O -- Yes --> P[Retry failed request queue]
  O -- No --> Q[Logout + clear session]

  R[Logout] --> S[POST /auth/logout]
  S --> T[Delete refresh token + reset auth state]
  T --> D
```
