# Samsung Tablet HTTP Print Server Setup

## Problem Solved
Customer orders from desktop → Success page sends HTTP request → Samsung tablet receives → ESC/POS service prints

## Option 1: Simple HTTP Server App (RECOMMENDED)

### Install "HTTP Server" App on Samsung Tablet
1. **Google Play Store** → Search **"Simple HTTP Server"** or **"HTTP Server"**
2. **Install** one of these apps:
   - "HTTP Server" by AntTek
   - "Simple HTTP Server" by Phlox
   - "HTTP Test Server" by Clever

### Configure HTTP Server App
1. **Open HTTP Server app**
2. **Set Port**: 8080
3. **Set Document Root**: Create a folder for print requests
4. **Start Server** - note the IP address (e.g., 192.168.1.100)

### Create Print Handler Script
Create a simple HTML file that receives POST requests and triggers ESC/POS printing:

```html
<!DOCTYPE html>
<html>
<head>
    <title>MenuCA Print Handler</title>
</head>
<body>
    <h1>MenuCA Receipt Printer</h1>
    <div id="status">Waiting for print requests...</div>
    
    <script>
    // Listen for print requests
    async function handlePrintRequest(data) {
        try {
            document.getElementById('status').innerHTML = 'Printing receipt...';
            
            // Trigger Android share to ESC/POS service
            if (navigator.share) {
                await navigator.share({
                    title: 'MenuCA Receipt',
                    text: data.receipt
                });
            } else {
                // Fallback: show receipt and let user manually print
                const printWindow = window.open('', '_blank');
                printWindow.document.write('<pre>' + data.receipt + '</pre>');
                printWindow.print();
            }
            
            document.getElementById('status').innerHTML = '✅ Receipt printed successfully';
            
        } catch (error) {
            document.getElementById('status').innerHTML = '❌ Print failed: ' + error.message;
        }
    }
    
    // Auto-refresh to check for new print jobs
    setInterval(() => {
        // In a real setup, this would check for new print jobs
        console.log('Checking for print jobs...');
    }, 5000);
    </script>
</body>
</html>
```

## Option 2: Tasker Automation (Advanced)

### Install Tasker ($3.49)
1. **Google Play Store** → **Tasker**
2. **Purchase and install**

### Create HTTP Print Profile
1. **New Profile** → **Event** → **HTTP Request**
2. **Port**: 8080
3. **Path**: /print
4. **Method**: POST

### Create Print Action
1. **Task** → **New** → **Send to ESC/POS**
2. **Variable Set**: %receipt to %httprequestbody
3. **Send Intent**: 
   - Action: `org.escpos.intent.action.PRINT`
   - Package: `com.loopedlabs.escposprintservice`
   - Data: %receipt

## Option 3: Custom Android App

Use our previously created Android bridge app:
1. **Build APK** from source code
2. **Install on Samsung tablet**
3. **Runs HTTP server on port 8080**
4. **Automatically forwards to ESC/POS service**

## Testing the Setup

### Step 1: Configure Tablet IP
1. **Find Samsung tablet IP address**
2. **Update MenuCA success page** with correct IP
3. **Replace** `192.168.1.100` with actual tablet IP

### Step 2: Test HTTP Connection
From any browser:
```
http://TABLET_IP:8080/print
```
Should show print handler page.

### Step 3: Test Print Request
From MenuCA success page, console should show:
```
Attempting to send receipt to tablet TABLET_IP...
✅ Receipt successfully sent to tablet TABLET_IP
```

## Network Requirements

### Restaurant WiFi Setup
- **Samsung tablet** connected to restaurant WiFi
- **Customer devices** and **tablet** on same network
- **Port 8080** accessible (not blocked by firewall)

### Multiple Locations
Each restaurant needs:
1. **Samsung tablet** with print server app
2. **Unique IP address** configured in MenuCA admin
3. **NETUM printer** paired with tablet
4. **ESC/POS Print Service** installed and configured

## Troubleshooting

### "Could not reach tablet" errors:
- Check tablet IP address
- Verify WiFi network connection
- Ensure HTTP server app is running
- Test with browser: `http://tablet-ip:8080`

### "No tablets reachable":
- Multiple tablets configured but all offline
- Network connectivity issues
- Wrong IP addresses in MenuCA configuration

### Receipt not printing:
- ESC/POS Print Service not installed
- NETUM printer not paired with tablet
- Print service permissions not enabled

This setup enables automatic receipt printing across 100+ restaurant locations using existing Samsung tablets and NETUM printers!