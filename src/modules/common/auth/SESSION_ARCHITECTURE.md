# Authentication & Session Management Architecture

## Final Navigation Shape

```text
RootNavigator
├── SplashScreen (session checking)
├── AuthStack
│   ├── Login
│   ├── Register
│   └── VerifyEmail
└── AppStack (all commerce screens, protected)
    ├── Home
    ├── ProductDetails
    ├── Cart
    ├── Checkout
    ├── Profile
    ├── Orders
    ├── ServiceStack
    └── RewardStack
```

## Session Lifecycle

```mermaid
flowchart TD
  A[App Launch] --> B[SplashScreen]
  B --> C{refreshToken in SecureStore?}

  C -->|Yes| D[POST /v1/auth/refresh]
  D -->|Success| E[Store accessToken in memory]
  E --> F[GET /v1/auth/user-info]
  F --> G[Navigate AppStack]

  C -->|No| H[Navigate AuthStack/Login]
  D -->|Fail| H

  I[Login API Success] --> J[Save refreshToken in SecureStore]
  J --> K[Set accessToken in memory]
  K --> L[Fetch profile]
  L --> G

  M[API 401] --> N[Axios interceptor refresh]
  N -->|Success| O[Retry failed request]
  N -->|Fail| P[Logout + clear session]
  P --> H
```

## State Rules

- In memory only:
  - `user`
  - `accessToken`
  - `isAuthenticated`
- Secure storage only:
  - `refreshToken`
- No guest cart local storage in auth context.
- Cart/checkout stay backend-auth based via `user_id`.
