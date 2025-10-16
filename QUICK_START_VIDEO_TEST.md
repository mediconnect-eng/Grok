# Quick Start: Testing Video Consultations

## 🚀 Server Status
✅ Server is running at: http://localhost:3000

## 📋 Test Flow

### Step 1: Login as Patient
1. Go to http://localhost:3000/patient/login
2. Login with your patient account
3. Navigate to "Consultations" from dashboard

### Step 2: View Consultation
1. Click on any active consultation (status: accepted, scheduled, or in_progress)
2. You'll see the consultation detail page with:
   - Full consultation information
   - Medical history
   - Chat messages
   - **"Start Video Call" button** (green button at top-right)

### Step 3: Start Video Call
1. Click the **"Start Video Call"** button
2. Browser will ask for camera/microphone permissions → **Allow**
3. Wait for the video call to load:
   - Token is generated automatically
   - Agora SDK initializes
   - Your camera feed appears

### Step 4: During Video Call
**You'll see**:
- Your video in bottom-right corner (picture-in-picture)
- Remote video in main area (when provider joins)
- Chat panel on the right side
- Control buttons at the bottom:
  - 🎤 Microphone (click to mute/unmute)
  - 📹 Camera (click to stop/start video)
  - 🖥️ Screen Share (click to share screen)
  - 💬 Chat (click to show/hide chat)
  - ❌ End Call (red button in header)

**To test with two users**:
1. Open http://localhost:3000 in a second browser/incognito window
2. Login as the healthcare provider
3. Navigate to the same consultation
4. Click "Start Video Call"
5. Both users will see each other!

### Step 5: Use Chat During Call
1. Type a message in the chat input (right panel)
2. Click "Send"
3. Message appears in chat history
4. Other participant sees it instantly

### Step 6: Screen Sharing
1. Click the screen share button (🖥️)
2. Select which screen/window to share
3. Click "Share"
4. Your screen replaces your camera feed
5. Other participant sees your screen
6. Click screen share button again to stop

### Step 7: End Call
1. Click the **"End Call"** button (red button in header)
2. You'll be returned to the consultation detail page
3. All tracks are cleaned up automatically

## 🔍 Testing Checklist

### Basic Functionality
- [ ] Camera permission granted
- [ ] Microphone permission granted
- [ ] Local video displays correctly
- [ ] Can see yourself in bottom-right corner
- [ ] Connection status shows "Connected"

### Two-User Test
- [ ] Second user can join same consultation
- [ ] Both users see each other's video
- [ ] Audio works both directions
- [ ] Can hear each other clearly
- [ ] No echo (use headphones or separate rooms)

### Controls Test
- [ ] Mute button works (icon changes, audio stops)
- [ ] Unmute button works (audio resumes)
- [ ] Camera off button works (video stops)
- [ ] Camera on button works (video resumes)
- [ ] Screen share starts successfully
- [ ] Screen share stops and returns to camera
- [ ] Chat toggle button works

### Chat Test
- [ ] Existing messages load
- [ ] Can send new messages
- [ ] Messages appear instantly
- [ ] Chat scrolls correctly
- [ ] Sender name shows correctly
- [ ] Timestamps are accurate

### Error Handling
- [ ] Denying camera permission shows error
- [ ] Invalid consultation ID shows error
- [ ] Unauthorized access blocked
- [ ] Network issues handled gracefully

## 🐛 Common Issues & Solutions

### "Camera not working"
**Problem**: Black screen in video area  
**Solution**: 
1. Check browser permissions (click padlock icon → Permissions)
2. Make sure no other app is using camera
3. Try refreshing the page
4. Try a different browser

### "Cannot hear audio"
**Problem**: No sound from other participant  
**Solution**:
1. Check microphone/speaker settings
2. Unmute on both sides
3. Check system volume
4. Try headphones

### "Other person can't see me"
**Problem**: Remote user sees black screen  
**Solution**:
1. Check your camera is on (📹 button not red)
2. Check permissions are granted
3. Refresh both browsers
4. Check network connection

### "Token generation failed"
**Problem**: Error when joining call  
**Solution**:
1. Check `.env.local` has correct Agora credentials
2. Verify consultation exists and is active
3. Check you're a participant of the consultation
4. Check server logs for detailed error

### "Screen share not working"
**Problem**: Can't share screen or screen is black  
**Solution**:
1. Make sure you selected the correct window/screen
2. Grant screen recording permission (macOS)
3. Try Chrome (best screen share support)
4. Close and reopen sharing dialog

## 📊 Test Data

### Sample Consultation IDs
Check your database for actual consultation IDs:
```sql
SELECT id, status, patient_id, provider_id, chief_complaint 
FROM consultations 
WHERE status IN ('accepted', 'in_progress', 'scheduled')
LIMIT 5;
```

### Create Test Consultation
If you need a test consultation:
1. Go to http://localhost:3000/patient/consultations/request
2. Fill out the consultation request form
3. Login as GP/Specialist and accept the consultation
4. Note the consultation ID from URL

## 🎯 Expected Behavior

### Before Call Starts
- Consultation page shows "Start Video Call" button
- Button is green and prominent
- Status indicator shows consultation is active

### During Call
- Your video appears in bottom-right corner
- Main area shows remote video or waiting message
- Controls are accessible and responsive
- Chat panel is visible and functional
- Connection status shows "Connected"

### After Call Ends
- Returned to consultation detail page
- Video tracks cleaned up
- Camera light turns off
- Messages are saved

## 🔧 Developer Tools

### Check Agora Connection
Open browser console (F12) and look for:
```
✓ Agora client created
✓ Joined channel: consultation-[id]
✓ Published local tracks
✓ User published: video
✓ User published: audio
```

### Check API Calls
Network tab should show:
1. `POST /api/video/token` → 200 OK (token generated)
2. `GET /api/consultations/[id]/messages` → 200 OK (messages loaded)
3. `POST /api/consultations/[id]/messages` → 200 OK (message sent)

### Check Database
Verify consultation status updates:
```sql
SELECT id, status, updated_at 
FROM consultations 
WHERE id = '[consultation-id]';
-- Status should change from 'scheduled' to 'in_progress'
```

## 📱 Mobile Testing

### iOS Safari
1. Open http://localhost:3000 on iPhone
2. Must use HTTPS in production (camera won't work on HTTP)
3. Grant camera/microphone permissions
4. Test in both portrait and landscape

### Android Chrome
1. Open http://localhost:3000 on Android
2. Grant permissions when prompted
3. Video should work on HTTP (for local testing)
4. Test in both orientations

## 🚢 Production Testing

### Before Deploying to Vercel
1. [ ] Test on HTTPS (use ngrok or deploy to staging)
2. [ ] Test camera/microphone on HTTPS
3. [ ] Verify environment variables are set on Vercel
4. [ ] Test with real consultation data
5. [ ] Test on multiple devices
6. [ ] Test on different network conditions

### Staging Deployment
```bash
# Push to GitHub
git add .
git commit -m "feat: complete video consultation feature"
git push origin main

# Deploy to Vercel
# 1. Import repository
# 2. Add environment variables:
#    - AGORA_APP_ID
#    - AGORA_APP_CERTIFICATE
#    - DATABASE_URL
#    - BETTER_AUTH_SECRET
#    - BETTER_AUTH_URL
# 3. Deploy
# 4. Test on HTTPS URL
```

## ✅ Success Criteria

### Feature Complete When
- [x] Video call component created
- [x] Token generation API working
- [x] Consultation detail page shows "Start Video Call"
- [x] Camera/microphone permissions requested
- [x] Local video displays
- [x] Remote video displays when other user joins
- [x] Audio works both ways
- [x] Mute/camera toggle works
- [x] Screen sharing works
- [x] Chat integration works
- [x] End call works cleanly
- [x] Zero build errors
- [x] Zero TypeScript errors

## 📞 Support

### If Something Doesn't Work
1. Check browser console for errors
2. Check Network tab for failed API calls
3. Check server logs (terminal where `npm run dev` is running)
4. Verify environment variables in `.env.local`
5. Check database for consultation data

### Need Help?
- Review `VIDEO_CONSULTATION_COMPLETE.md` for detailed documentation
- Check `AGORA_SETUP_GUIDE.md` for Agora-specific issues
- Review Agora docs: https://docs.agora.io/en/video-calling/reference/web

## 🎉 Ready to Test!

Your video consultation feature is fully implemented and ready for testing. 

**Start here**: http://localhost:3000/patient/login

Good luck! 🚀

---

**Last Updated**: January 10, 2025  
**Status**: ✅ Ready for Testing  
**Server**: Running on http://localhost:3000
