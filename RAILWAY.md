# Railway Deployment Guide

## Quick Deploy

1. **Go to Railway**: https://railway.app
2. **Sign in** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: `ayushsaklani-min/Linera_oracle`
5. **Configure**:
   - Root Directory: `/` (leave empty)
   - Builder: Dockerfile
   - Start Command: `bash /build/run.bash`

## Environment Variables

Railway will auto-detect these from your code, but you can set them manually:

```
PORT=3001
WS_PORT=8090
NODE_ENV=production
FRONTEND_PORT=5173
```

## Resource Requirements

**Minimum:**
- RAM: 4GB (8GB recommended)
- CPU: 2 vCPU
- Disk: 10GB

**Railway Free Tier:**
- 8GB RAM ✅
- $5 credit/month
- 500 hours/month

## Deployment Steps

### 1. Create Railway Project

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Login
railway login

# Link project
railway link
```

### 2. Deploy

Railway will automatically:
1. Detect Dockerfile
2. Build the image (15-20 minutes first time)
3. Start the container
4. Expose ports

### 3. Get Your URLs

Railway provides:
- **Backend**: `https://your-app.railway.app` (port 3001)
- **Frontend**: `https://your-app.railway.app` (port 5173)
- **WebSocket**: `wss://your-app.railway.app` (port 8090)

### 4. Update Frontend Config

Update `frontend-v2/.env.production`:

```env
VITE_API_URL=https://your-app.railway.app
VITE_WS_URL=wss://your-app.railway.app:8090
```

Redeploy to apply changes.

## Monitoring

### Check Logs

```bash
railway logs
```

Or in Railway dashboard: **Deployments** → **View Logs**

### Health Check

```bash
curl https://your-app.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "stats": {...},
  "oracles": ["chainlink", "pyth", "coingecko"]
}
```

## Troubleshooting

### Build Fails

**Issue**: Out of memory during Rust compilation

**Solution**: 
- Railway free tier has 8GB RAM (should work)
- If still failing, upgrade to Pro plan ($20/month, 32GB RAM)

### Container Crashes

**Issue**: `run.bash` fails

**Solution**:
```bash
# Check logs
railway logs --tail 100

# Common issues:
# 1. Linera compilation timeout → Wait longer (first build takes 15-20 min)
# 2. Port conflicts → Railway auto-assigns ports, should work
# 3. Network issues → Retry deployment
```

### Frontend Not Loading

**Issue**: Frontend shows blank page

**Solution**:
1. Check if build completed: `railway logs | grep "Frontend built"`
2. Verify dist folder exists: `railway run ls frontend-v2/dist`
3. Check http-server is running: `railway logs | grep "http-server"`

### WebSocket Not Connecting

**Issue**: Real-time updates not working

**Solution**:
1. Railway supports WebSocket by default
2. Check WS_PORT is 8090
3. Update frontend to use `wss://` (not `ws://`)

## Scaling

### Horizontal Scaling

Railway doesn't support multiple instances for free tier. For production:
1. Upgrade to Pro plan
2. Enable replicas in settings
3. Use Railway's load balancer

### Vertical Scaling

Increase resources:
1. Go to **Settings** → **Resources**
2. Increase RAM/CPU
3. Redeploy

## Cost Estimate

**Free Tier:**
- $5 credit/month
- ~500 hours runtime
- Good for buildathon demo

**Pro Plan ($20/month):**
- $0.000231/GB-hour RAM
- $0.000463/vCPU-hour
- Estimated: $30-50/month for 24/7 operation

## Custom Domain

1. Go to **Settings** → **Domains**
2. Add custom domain: `oracle.yourdomain.com`
3. Update DNS records (Railway provides instructions)
4. SSL auto-configured

## Backup Strategy

Railway doesn't persist data between deployments. For production:

1. **Use external database** (PostgreSQL/MongoDB)
2. **Store chain data** in Railway volumes
3. **Backup wallet files** to S3/GCS

## CI/CD

Railway auto-deploys on git push:

1. Push to `main` branch
2. Railway detects changes
3. Rebuilds Docker image
4. Deploys automatically

Disable auto-deploy:
- **Settings** → **Deployments** → Toggle off

## Support

- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- Status: https://status.railway.app

---

**Ready to deploy?** Just push to GitHub and connect Railway! 🚀
