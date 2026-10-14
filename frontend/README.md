# LearnPath Frontend

React, TypeScript, and Vite course workspace. See the [root setup guide](../README.md) for backend configuration and verification.

```bash
npm ci
npm run dev -- --host 127.0.0.1
npm run lint
npm run build
```

The development server proxies `/api` to `http://127.0.0.1:8000`. Set `LEARNPATH_API_TARGET` to use another local backend.
