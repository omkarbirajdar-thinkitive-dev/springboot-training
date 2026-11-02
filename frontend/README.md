# Workforce frontend

React + TypeScript client for the Spring Boot employee and department API.

## Run locally

Start the Spring Boot API on port 8080, then from this directory run:

```sh
npm install
npm run dev
```

Vite proxies `/api` and `/v3/api-docs` to Spring Boot, so local browser requests remain same-origin. The API's database configuration still needs to be supplied to Spring Boot as described by its application properties.

The sample API seeds `admin` / `admin123` and `user` / `user123`. The admin can make changes; the user has read-only access. The API remains authoritative for permissions.

## API client

`openapi.yaml` is the frontend's checked-in API contract. Orval generates the typed API functions and TanStack Query hooks in `src/api/generated.ts`:

```sh
npm run api:generate
npm run build
```

When backend endpoints or DTOs change, refresh `openapi.yaml` from Springdoc at `/v3/api-docs`, then regenerate. This keeps the frontend build independent of a running database/API. For a deployed setup, serve the API through the same origin or assign `window.__API_BASE_URL__` before the frontend module loads.

Keycloak will require adapting `src/auth.ts` to its login/token lifecycle and role claims. The API request layer already adds the stored access token independently of the login mechanism. Liquibase changes the backend schema/migrations and does not affect this client unless the API contract changes.