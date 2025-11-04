# Stack Auth Troubleshooting

## "Domain must have at least two labels" Error

### What it means:
Stack Auth validates domains and requires at least two labels separated by a dot:
- ✅ Valid: `example.com` (two labels: "example" + "com")
- ✅ Valid: `app.example.com` (three labels)
- ❌ Invalid: `localhost` (only one label)
- ❌ Invalid: `myapp` (only one label)

### Where it occurs:
1. **Stack Auth Dashboard** - When configuring redirect URLs
2. **During login** - When Stack Auth validates the callback URL

### Solutions:

#### Option 1: Use a proper domain format (Recommended for Development)

Instead of:
```
http://localhost:5173
```

Use one of these:
```
http://localhost.local:5173
http://127.0.0.1.local:5173
http://localhost.localdomain:5173
```

Then update your Stack Auth redirect URLs to match.

#### Option 2: Set up a local domain

1. Edit `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
   ```
   127.0.0.1 dev.local
   ```

2. Use `http://dev.local:5173` in Stack Auth dashboard

3. Access your app at `http://dev.local:5173`

#### Option 3: Check Stack Auth Configuration

Some Stack Auth setups allow:
- Development mode that bypasses domain validation
- "Allow localhost" option in settings
- Custom domain validation rules

Check your Stack Auth dashboard → Project Settings → Redirect URLs for these options.

#### Option 4: Update Stack Client Configuration

If the error is coming from the client code, make sure your URLs are relative paths (which is what we're already doing):

```typescript
// ✅ Good - relative paths
urls: {
  signIn: '/auth/sign-in',
  signUp: '/auth/sign-up',
  afterSignIn: '/',
  afterSignUp: '/',
}

// ❌ Bad - absolute URLs with localhost
urls: {
  signIn: 'http://localhost:5173/auth/sign-in',
  // ...
}
```

### Quick Fix for Development:

1. In Stack Auth dashboard, add redirect URL: `http://localhost.local:5173`
2. Access your app at `http://localhost.local:5173` instead of `http://localhost:5173`
3. Or use `127.0.0.1.local:5173`

### Production:

For production, use your actual domain:
```
https://yourdomain.com
https://app.yourdomain.com
```

## Other Common Issues

### "Invalid redirect URL"
- Make sure the redirect URL in your code matches exactly what's configured in Stack Auth dashboard
- Check for trailing slashes, ports, http vs https

### "Project ID not found"
- Verify `VITE_STACK_PROJECT_ID` is set correctly
- Check that the project ID matches your Stack Auth dashboard

### "Unauthorized"
- Check that your redirect URLs are whitelisted in Stack Auth
- Verify CORS settings if calling from a different domain

