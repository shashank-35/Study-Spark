# Startup Checklist for Study Spark Learning Platform

## ✅ Pre-Startup Checklist

- [ ] Node.js 18+ is installed (`node --version`)
- [ ] All dependencies are installed (`npm install`)
- [ ] Gemini API key is valid and active
- [ ] Port 8787 is available
- [ ] Port 5173 is available (for frontend)

## 🚀 Startup Steps

### Step 1: Start the Backend Server
```bash
npm run api
```

**Expected Output:**
```
[api] listening on http://localhost:8787
[api] Gemini API integration enabled
🔑 Gemini API Key: AIzaSyB8iv...
🌐 Gemini API URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

### Step 2: Test Backend Health
```bash
curl http://localhost:8787/api/health
```

**Expected Output:**
```json
{"ok":true}
```

### Step 3: Test Gemini API
```bash
curl http://localhost:8787/api/test-gemini
```

**Expected Output:**
```json
{
  "success": true,
  "response": "C programming is a general-purpose...",
  "message": "Gemini API is working correctly"
}
```

### Step 4: Start Frontend (in new terminal)
```bash
npm run dev
```

**Expected Output:**
```
  VITE v5.4.1  ready in 1000 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 5: Test Frontend
1. Open http://localhost:5173/ in your browser
2. Click on the chatbot icon
3. Send a test message: "Hello"
4. Check browser console for any errors

## 🔍 Troubleshooting Quick Checks

### If Backend Won't Start:
- Check if port 8787 is in use
- Verify Node.js version
- Check for syntax errors in server code

### If Gemini API Fails:
- Verify API key is correct
- Check API key permissions
- Verify internet connectivity

### If Frontend Won't Start:
- Check if port 5173 is in use
- Verify all dependencies are installed
- Check for TypeScript compilation errors

### If Chatbot Not Responding:
- Check backend server is running
- Check browser console for errors
- Verify API endpoints are accessible
- Run test scripts to isolate issues

## 🧪 Test Scripts

### Test Gemini Integration:
```bash
node test-gemini.js
```

### Test Upload Functionality:
```bash
node test-upload.js
```

## 📱 Final Verification

- [ ] Backend server running on port 8787
- [ ] Frontend running on port 5173
- [ ] Gemini API test successful
- [ ] Chatbot responds to messages
- [ ] File upload works
- [ ] No errors in browser console
- [ ] No errors in server console

## 🆘 If Something's Still Not Working

1. **Check the troubleshooting guide:** `TROUBLESHOOTING.md`
2. **Run test scripts** to isolate the issue
3. **Check server logs** for specific error messages
4. **Verify API key** is working with direct curl commands
5. **Check browser console** for client-side errors

## 🎯 Common Success Indicators

- Server shows "Gemini API integration enabled"
- API test returns successful response
- Chatbot responds with AI-generated content
- File uploads are processed successfully
- No CORS errors in browser console
- All test scripts pass successfully
