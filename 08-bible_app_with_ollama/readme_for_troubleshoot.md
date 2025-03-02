# Bible App Ollama Troubleshooting Guide

This guide helps you troubleshoot connection issues between the Bible App and Ollama API.

## Common Error Messages

If you see timeout errors like:

```
Error type: FetchError
Error code: undefined
Error message: network timeout at: http://127.0.0.1:11434/api/chat
```

Follow the steps below to diagnose and fix the issue.

## Step 1: Check if Ollama is Running

First, check if Ollama is actually running:

```bash
# On macOS/Linux
ps aux | grep ollama

# On Windows
tasklist | findstr ollama
```

## Step 2: Check What's Using Port 11434

If Ollama is supposed to be running but you get connection errors:

```bash
# On macOS/Linux
lsof -i :11434

# On Windows
netstat -ano | findstr 11434
```

This will show you the process ID (PID) using the port.

## Step 3: Restart Ollama

If Ollama is running but not responding properly, restart it:

```bash
# Kill the existing Ollama process (replace PID with the process ID from step 2)
kill -9 PID

# Start Ollama again
ollama serve
```

Keep this terminal window open with Ollama running.

## Step 4: Verify Available Models

Open a new terminal and check which models are available:

```bash
ollama list
```

Make sure the model name in your `server.js` file matches exactly what's listed here.

## Step 5: Test Ollama API Directly

Test if Ollama is responding to basic queries:

```bash
curl http://127.0.0.1:11434/api/tags
```

Or test a simple chat completion:

```bash
curl -X POST http://127.0.0.1:11434/api/chat -d '{"model": "llama3", "messages": [{"role": "user", "content": "Hello"}]}'
```

## Step 6: Increase Request Timeout

If Ollama responds to simple queries but times out on larger ones, modify your `server.js` file to increase the timeout:

```javascript
// Find this in your server.js code
timeout: 10000

// Change it to a larger value (60 seconds)
timeout: 60000
```

## Step 7: Test the App's Connection

Your Bible app includes a built-in test endpoint that sends a simple message to Ollama. Visit it in your browser:

```
http://localhost:3001/api/test-ollama
```

If this works but regular queries don't, the issue is likely related to the complexity of your queries.

## Common Solutions

1. **Restart Ollama completely** (most common fix)
2. **Increase timeout values** for complex queries
3. **Use correct model names** exactly as shown in `ollama list`
4. **Reduce context length** in your prompts if possible
5. **Check Ollama logs** for errors while processing requests

## Application-Specific Tips

- The `/api/test-ollama` endpoint uses a simple query that works faster
- Regular Bible queries include more context and might take longer to process
- Consider adding more visible loading states to the UI
- On slower machines, first interaction with a model might take much longer

## When All Else Fails

If you continue having issues:

1. Check Ollama GitHub issues for similar problems
2. Try downgrading/upgrading Ollama version
3. Test with smaller models first
4. Consider using the official Ollama Node.js client instead of raw fetch calls
