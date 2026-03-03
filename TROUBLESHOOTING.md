# Troubleshooting Guide

## Chatbot Not Responding

If your chatbot is not responding, follow these steps to diagnose and fix the issue:

### Step 1: Check Server Status

1. **Start the server:**
   ```bash
   npm run api
   ```

2. **Verify server is running:**
   - You should see: `[api] listening on http://localhost:8787`
   - You should see: `[api] Gemini API integration enabled`
   - You should see: `🔑 Gemini API Key: AIzaSyB8iv...`

### Step 2: Test API Endpoints

1. **Test health endpoint:**
   ```bash
   curl http://localhost:8787/api/health
   ```
   Should return: `{"ok":true}`

2. **Test Gemini API:**
   ```bash
   curl http://localhost:8787/api/test-gemini
   ```
   Should return a successful response with AI-generated content.

3. **Test chat endpoint:**
   ```bash
   curl -X POST http://localhost:8787/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}]}'
   ```

### Step 3: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try sending a message in the chatbot
4. Look for error messages or API calls

### Step 4: Common Issues and Solutions

#### Issue: "Cannot connect to server"
**Solution:** Make sure the server is running with `npm run api`

#### Issue: "Gemini API error: 400"
**Solution:** Check if your API key is valid and has proper permissions

#### Issue: "No content received from server"
**Solution:** Check server console for Gemini API errors

#### Issue: CORS errors
**Solution:** The server should handle CORS automatically, but check if your browser is blocking requests

### Step 5: Run Test Scripts

1. **Test Gemini integration:**
   ```bash
   node test-gemini.js
   ```

2. **Test upload functionality:**
   ```bash
   node test-upload.js
   ```

### Step 6: Verify API Key

1. **Check your Gemini API key:**
   - Go to: https://makersuite.google.com/app/apikey
   - Verify the key is active and has proper permissions
   - Make sure you're using the correct model (gemini-1.5-flash)

2. **Test API key directly:**
   ```bash
   curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}'
   ```

### Step 7: Check File Permissions

Make sure the server can create and write to:
- `server/uploads/` directory
- `server/data/` directory
- `server/data/texts/` directory

### Step 8: Debug Mode

Enable debug logging by checking the server console for:
- Upload requests
- Chat requests
- Gemini API calls
- Error messages

### Still Not Working?

If none of the above solutions work:

1. **Check server logs** for specific error messages
2. **Verify network connectivity** to Google's APIs
3. **Try a different API key** if available
4. **Check if the Gemini API is available** in your region
5. **Verify Node.js version** (requires 18+ for fetch support)

### Quick Fix Commands

```bash
# Stop any running servers
Ctrl+C

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Start server with debug logging
npm run api

# In another terminal, test the API
node test-gemini.js
```

### Support

If you're still having issues, check:
1. Server console output for error messages
2. Browser console for client-side errors
3. Network tab in browser DevTools for failed requests
4. Make sure all dependencies are installed correctly
