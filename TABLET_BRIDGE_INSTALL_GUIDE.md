# MenuCA Tablet Bridge Installation Guide

## What This Does
Replaces your text2pay service with a direct MenuCA → Samsung Tablet → NETUM printer integration.

**Flow:** Customer Order → MenuCA Success Page → HTTP to Tablet → Bridge App → Bluetooth → NETUM NT-1809DD

## Step 1: Build the Android APK

### Option A: Build Yourself (if you have Android Studio)
1. Download Android Studio
2. Import the `menuca-printer-bridge` project 
3. Build → Generate Signed Bundle/APK
4. Choose APK, sign with debug key
5. Get `app-debug.apk` from `app/build/outputs/apk/debug/`

### Option B: Use Online Build Service
1. Zip the `menuca-printer-bridge` folder
2. Upload to Android build service (like AppGyver, Thunkable, or similar)
3. Download the generated APK

### Option C: I Build It For You
- I can build the APK and provide download link
- Requires setting up build environment on my end

## Step 2: Install APK on Samsung Tablets

1. **Enable Unknown Sources:**
   - Settings → Security → Unknown Sources → Enable
   - Or Settings → Apps → Special Access → Install Unknown Apps

2. **Transfer APK to Tablet:**
   - Email the APK file to yourself
   - Download on Samsung tablet
   - Or use USB transfer from computer

3. **Install APK:**
   - Tap the APK file in Downloads
   - Tap "Install" 
   - Tap "Open" when installation completes

## Step 3: Configure Bridge App

1. **Pair NETUM Printer:**
   - Settings → Bluetooth → Pair new device
   - Find your NETUM NT-1809DD printer
   - Pair with default PIN (usually 0000 or 1234)

2. **Connect to WiFi:**
   - Connect tablet to restaurant WiFi
   - Note the tablet's IP address (shown in bridge app)

3. **Test Bridge:**
   - Open MenuCA Printer Bridge app
   - Should show "✅ HTTP Server running on port 8080"
   - Should show tablet IP address (e.g., 192.168.1.100)

## Step 4: Configure MenuCA Web App

Update the tablet IP addresses in the success page code:

```javascript
const tabletIPs = [
  '192.168.1.100', // Your tablet IP here
  // Add more tablets for multiple locations
];
```

## Step 5: Test End-to-End

1. **Place Test Order:**
   - Go through complete order process
   - Make payment (use test Stripe cards)
   - Reach success page

2. **Watch Bridge App:**
   - Should show "Received POST request to /print"
   - Should show "📡 Connecting to printer: NETUM-XXXX"  
   - Should show "✅ Receipt sent to printer successfully"

3. **Check Printer:**
   - Receipt should print automatically
   - Should include order details, totals, and cut paper

## Troubleshooting

### Bridge App Shows "❌ Bluetooth not available"
- Enable Bluetooth in Android settings
- Re-pair NETUM printer
- Restart bridge app

### Success Page Shows "❌ Tablet unreachable"
- Check tablet is on same WiFi network
- Verify IP address in MenuCA code matches tablet IP
- Test tablet IP: `http://TABLET_IP:8080/status` should return JSON

### Receipt Not Printing
- Check NETUM printer is powered on and has paper
- Verify Bluetooth pairing (unpair and re-pair if needed)
- Check printer name contains "NETUM"

### Print Quality Issues
- Check paper width (should be 58mm)
- Verify commands are formatted for 42 characters per line
- Test with different paper or printer settings

## Production Deployment

### Multiple Restaurants
Each restaurant needs:
1. Samsung tablet with bridge app installed
2. NETUM printer paired via Bluetooth  
3. Tablet IP configured in MenuCA admin panel
4. Restaurant WiFi network configured

### Auto-Start Configuration
Bridge app includes auto-start on boot:
- App will restart automatically when tablet reboots
- HTTP server starts immediately 
- Ready to receive print jobs

### Monitoring
Bridge app logs show:
- All received print requests
- Bluetooth connection status
- Print success/failure status
- Network connectivity issues

## Files Included

- `MainActivity.java` - Main bridge app code
- `activity_main.xml` - App UI layout
- `AndroidManifest.xml` - App permissions and configuration
- `build.gradle` - Build dependencies

## Next Steps

Once installed and working:
1. Configure tablet IP addresses for each location
2. Test with real orders from customers
3. Monitor bridge app logs for any issues
4. Scale to additional restaurants as needed

**This completely replaces text2pay - customers order directly through MenuCA and receipts print automatically at your restaurant locations.**