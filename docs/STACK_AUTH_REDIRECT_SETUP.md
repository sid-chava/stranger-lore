# Stack Auth Redirect URL Setup

## For Development

Add these redirect URLs in your Stack Auth dashboard:

### Option 1: Use localhost.local (Easiest)
```
http://localhost.local:5173
http://localhost.local:5173/
```

**Then access your app at:** `http://localhost.local:5173`

### Option 2: Use 127.0.0.1.local
```
http://127.0.0.1.local:5173
http://127.0.0.1.local:5173/
```

**Then access your app at:** `http://127.0.0.1.local:5173`

### Option 3: Set up custom local domain

1. Edit `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
   ```
   127.0.0.1 dev.local
   ```

2. Add to Stack Auth:
   ```
   http://dev.local:5173
   http://dev.local:5173/
   ```

3. Access your app at: `http://dev.local:5173`

## How Stack Auth Uses These URLs

Your code uses relative paths:
- `afterSignIn: '/'` → Stack Auth redirects to `http://localhost.local:5173/`
- `afterSignUp: '/'` → Stack Auth redirects to `http://localhost.local:5173/`
- `signIn: '/auth/sign-in'` → Stack Auth redirects to `http://localhost.local:5173/auth/sign-in`

Stack Auth automatically constructs the full URL by combining the redirect domain with these paths.

## Important Notes

1. **Match the domain**: Whatever domain you add to Stack Auth, you must access your app using that same domain
2. **Include trailing slash**: Some Stack Auth configs require both with and without trailing slash
3. **Protocol matters**: Use `http://` for local development, `https://` for production
4. **Port matters**: Include the port (`:5173`) if your dev server uses a port

## Quick Checklist

- [ ] Added redirect URL to Stack Auth dashboard (e.g., `http://localhost.local:5173`)
- [ ] Updated browser to access app at the new domain (e.g., `http://localhost.local:5173`)
- [ ] Verified the domain works (page loads)
- [ ] Tested login flow

## Production Setup

When deploying, add your production domain:
```
https://yourdomain.com
https://yourdomain.com/
```

Update your Stack Auth configuration to use the production domain for callbacks.

