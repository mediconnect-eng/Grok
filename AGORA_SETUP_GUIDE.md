# 🎥 Agora Video & Chat Integration Guide

## 📋 Overview

This guide walks you through integrating Agora.io for video consultations and real-time chat in Health Hub.

---

## 🚀 Step 1: Create Agora Account (5 minutes)

### 1.1 Sign Up

1. Go to: **https://console.agora.io/**
2. Click **"Sign Up"**
3. Choose sign-up method:
   - Email + Password
   - OR Google Account (recommended)
4. Verify your email
5. Complete profile setup

### 1.2 Create Project

1. After login, click **"Project Management"** in left sidebar
2. Click **"Create"** button
3. Fill in details:
   ```
   Project Name: Health Hub
   Use Case: Healthcare / Telemedicine
   ```
4. Click **"Submit"**

### 1.3 Get Credentials

1. Find your project in the list
2. Click the **"eye" icon** next to App ID to reveal it
3. Copy **App ID** (looks like: `a1b2c3d4e5f6g7h8i9j0`)
4. Click **"Edit"** → **"Generate"** next to App Certificate
5. Copy **App Certificate** (looks like: `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`)

**Important:** Keep these credentials secret! Never commit to Git.

---

## 📦 Step 2: Install Packages (2 minutes)

Run these commands in your project root:

```bash
# Install Agora SDK for React/Next.js
npm install agora-rtc-sdk-ng

# Install Agora token builder (for server-side)
npm install agora-token

# Install Agora React UI Kit (optional, easier integration)
npm install agora-rtc-react

# TypeScript types
npm install --save-dev @types/agora-rtc-sdk-ng
```

**Estimated time:** 1-2 minutes

---

## 🔐 Step 3: Add Environment Variables (1 minute)

### 3.1 Update `.env.local`

Add these lines to your `.env.local` file:

```bash
# Agora Configuration
AGORA_APP_ID=your-app-id-here
AGORA_APP_CERTIFICATE=your-app-certificate-here

# Optional: For cloud recording (Agora Enterprise feature)
# AGORA_CUSTOMER_ID=your-customer-id
# AGORA_CUSTOMER_SECRET=your-customer-secret
```

### 3.2 Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   Name: AGORA_APP_ID
   Value: (paste your App ID)
   Environments: Production, Preview, Development
   ```
3. Add:
   ```
   Name: AGORA_APP_CERTIFICATE
   Value: (paste your App Certificate)
   Environments: Production, Preview, Development
   ```
4. Click **"Save"**
5. **Redeploy** your application

---

## 🛠️ Step 4: Verify Setup (2 minutes)

### 4.1 Test Token Generation API

```bash
# Start your development server
npm run dev

# In another terminal, test the API:
curl -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{
    "consultationId": "test-123",
    "channelName": "test-channel"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "007eJxTYBBb...",
  "appId": "a1b2c3d4e5f6g7h8i9j0",
  "channelName": "test-channel",
  "uid": 0,
  "expiresAt": "2025-10-17T12:34:56.789Z"
}
```

---

## 📁 Project Structure

After setup, your project structure will include:

```
src/
├── app/
│   └── api/
│       ├── video/
│       │   └── token/
│       │       └── route.ts          ✅ Token generation (DONE)
│       └── consultations/
│           └── [id]/
│               └── messages/
│                   └── route.ts      ✅ Chat messages (DONE)
├── components/
│   └── video/
│       ├── VideoCall.tsx             ⏳ Next (to create)
│       ├── ChatPanel.tsx             ⏳ Next (to create)
│       └── CallControls.tsx          ⏳ Next (to create)
└── app/
    └── consultations/
        └── [id]/
            └── call/
                └── page.tsx          ⏳ Next (to create)
```

---

## 🎯 Implementation Roadmap

### ✅ Phase 1: Backend (COMPLETED)
- [x] Messages API (`/api/consultations/[id]/messages`)
- [x] Video token API (`/api/video/token`)
- [x] Database schema (consultations, messages)

### ⏳ Phase 2: Video Components (NEXT)
- [ ] VideoCall component (main video interface)
- [ ] ChatPanel component (side chat during call)
- [ ] CallControls component (mute, camera, end call)
- [ ] Video call page

### ⏳ Phase 3: Integration
- [ ] Connect video to consultations
- [ ] Add "Start Call" button in consultation details
- [ ] Handle call events (join, leave, disconnect)
- [ ] Add recording (optional)

### ⏳ Phase 4: Polish & Testing
- [ ] UI/UX refinements
- [ ] Error handling
- [ ] Network quality indicators
- [ ] Mobile responsive design
- [ ] End-to-end testing

---

## 🧪 Testing Checklist

### Backend APIs:
- [ ] Token generation works
- [ ] Returns valid Agora token
- [ ] Token expires in 24 hours
- [ ] Unauthorized users are blocked
- [ ] Consultation validation works

### Messages API:
- [ ] Can send messages
- [ ] Can fetch messages
- [ ] Messages marked as read
- [ ] Notifications sent
- [ ] Attachments supported

### Video Call:
- [ ] Can join video call
- [ ] Video/audio works
- [ ] Can mute/unmute
- [ ] Can toggle camera
- [ ] Can share screen
- [ ] Chat works during call
- [ ] Can end call properly

---

## 📊 Agora Free Tier Limits

**What you get for FREE:**
```
✅ 10,000 minutes/month forever
✅ HD video (up to 1080p)
✅ Unlimited channels
✅ Unlimited users
✅ Real-time messaging
✅ Screen sharing
✅ Audio mixing
✅ Network quality monitoring

Calculation:
10,000 mins ÷ 15 mins/consultation = 666 consultations/month FREE
```

**This covers your first 6-12 months!** 🎉

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module 'agora-token'"

**Solution:**
```bash
npm install agora-token agora-rtc-sdk-ng
```

### Issue 2: "AGORA_NOT_CONFIGURED" error

**Solution:**
- Check `.env.local` has `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`
- Restart development server: `npm run dev`
- Verify no typos in variable names

### Issue 3: Token generation fails

**Solution:**
- Verify App Certificate is correct
- Check if certificate is enabled in Agora Console
- Ensure consultation exists in database

### Issue 4: "Failed to join channel" in frontend

**Solution:**
- Check App ID matches exactly
- Verify token hasn't expired
- Check browser permissions (camera/microphone)
- Try in incognito mode (extensions can block)

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Generate tokens server-side (never expose App Certificate)
- ✅ Validate user permissions before generating tokens
- ✅ Set token expiration (24 hours is good)
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on token endpoint

### ❌ DON'T:
- ❌ Don't commit credentials to Git
- ❌ Don't expose App Certificate in frontend
- ❌ Don't allow token generation without authentication
- ❌ Don't use the same channel name for multiple calls
- ❌ Don't skip consultation validation

---

## 📈 Monitoring & Analytics

### Agora Console Features:
1. **Real-time Monitoring**
   - Active calls
   - Network quality
   - Call duration
   - User count

2. **Analytics Dashboard**
   - Usage statistics
   - Peak hours
   - Quality metrics
   - Error rates

3. **Call Investigation**
   - Search by channel name
   - View call details
   - Diagnose quality issues
   - Review call logs

**Access:** https://console.agora.io/ → Your Project → Analytics

---

## 💰 Cost Tracking

### Free Tier Usage:
```
Month 1-6: 0-5,000 mins/month = $0
Month 7-12: 5,000-10,000 mins/month = $0
```

### When You Exceed Free Tier:
```
10,000-100,000 mins: $0.99 per 1,000 mins
100,000+ mins: $0.79 per 1,000 mins

Example at 30,000 mins/month:
- Free: 10,000 mins = $0
- Paid: 20,000 mins × $0.99 = $19.80/month
```

**Set up billing alerts in Agora Console to track usage!**

---

## 🚨 Troubleshooting

### Debug Mode:
Enable Agora debug logs:
```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

// Enable debug logs
AgoraRTC.setLogLevel(4); // 0=NONE, 1=ERROR, 2=WARNING, 3=INFO, 4=DEBUG
```

### Network Quality Check:
```typescript
client.on("network-quality", (stats) => {
  console.log("Downlink Quality:", stats.downlinkNetworkQuality);
  console.log("Uplink Quality:", stats.uplinkNetworkQuality);
  // 0=Unknown, 1=Excellent, 2=Good, 3=Poor, 4=Bad, 5=VBad, 6=Down
});
```

### Call Quality Metrics:
```typescript
client.on("exception", (event) => {
  console.warn("Exception:", event);
});
```

---

## 📚 Additional Resources

### Official Documentation:
- **Agora Docs:** https://docs.agora.io/
- **React Quickstart:** https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=react-js
- **API Reference:** https://api-ref.agora.io/en/video-sdk/web/4.x/

### Useful Links:
- **Agora Console:** https://console.agora.io/
- **Community Forum:** https://www.agora.io/en/community/
- **Sample Projects:** https://github.com/AgoraIO-Community
- **GitHub Issues:** https://github.com/AgoraIO/AgoraWebSDK-NG/issues

---

## ✅ Setup Complete!

Once you've completed Steps 1-4, you're ready to build the video UI!

**Next Steps:**
1. I'll create the VideoCall component
2. Build the chat panel
3. Add call controls
4. Create the video call page
5. Test end-to-end flow

**Estimated time to fully functional video calls:** 2-3 hours

---

## 🆘 Need Help?

**Common Questions:**

**Q: Do I need to pay anything to start?**
A: No! The free tier (10,000 mins/month) is permanent.

**Q: When should I upgrade to Enterprise?**
A: When you need HIPAA compliance or exceed 50,000 mins/month.

**Q: Can I test without a real video call?**
A: Yes! Agora Console has a "Test Your App" feature.

**Q: What if I hit the free tier limit?**
A: Agora will automatically charge for overages. Set billing alerts!

**Q: Can I switch from Agora later?**
A: Yes, but you'll need to rewrite the video integration (1-2 weeks work).

---

**Ready to proceed? Let me know and I'll create the video components!** 🎥
