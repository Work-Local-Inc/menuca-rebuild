#!/bin/bash

echo "🕵️‍♂️ A19 TABLET CREDENTIAL EXTRACTOR"
echo "====================================="
echo ""
echo "This script will extract the REAL authentication cookies from your A19 tablet"
echo "that the MenuCA app uses to connect to tablet.menu.ca"
echo ""

# Check if ADB is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No ADB devices connected!"
    echo ""
    echo "To connect your A19 tablet:"
    echo "1. Enable Developer Options: Settings → About → Tap Build Number 7 times"
    echo "2. Enable USB Debugging: Settings → Developer Options → USB Debugging"
    echo "3. Connect USB cable and allow debugging"
    echo "4. Or enable Wireless Debugging and connect via IP"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

echo "✅ ADB connected to device:"
adb devices | grep "device$"
echo ""

echo "🔍 EXTRACTING MENUCA RESTAURANT CREDENTIALS"
echo "==========================================="

# Extract the secrets.xml file that contains authentication cookies
echo "📋 Getting SharedPreferences secrets..."
SECRETS=$(adb shell "run-as com.cojotech.commission.menu.restotool cat /data/data/com.cojotech.commission.menu.restotool/shared_prefs/secrets.xml" 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$SECRETS" ]; then
    echo "🎉 FOUND RESTAURANT CREDENTIALS!"
    echo "================================="
    echo "$SECRETS"
    echo ""
    
    # Extract cookies from the XML
    COOKIES=$(echo "$SECRETS" | grep -o 'name="cookies".*value="[^"]*"' | sed 's/.*value="\([^"]*\)".*/\1/')
    
    if [ ! -z "$COOKIES" ]; then
        echo "🍪 AUTHENTICATION COOKIES:"
        echo "=========================="
        echo "$COOKIES"
        echo ""
        
        # Parse rt_key and rt_designator from cookies
        RT_KEY=$(echo "$COOKIES" | grep -o 'rt_key=[^;]*' | cut -d'=' -f2)
        RT_DESIGNATOR=$(echo "$COOKIES" | grep -o 'rt_designator=[^;]*' | cut -d'=' -f2)
        
        if [ ! -z "$RT_KEY" ] && [ ! -z "$RT_DESIGNATOR" ]; then
            echo "🎯 RESTAURANT CREDENTIALS FOUND:"
            echo "==============================="
            echo "Restaurant ID: $RT_DESIGNATOR"  
            echo "RT Key: $RT_KEY"
            echo ""
            echo "✅ SUCCESS! These are your A19 tablet's REAL credentials!"
            echo ""
            echo "Now I can send orders directly to your tablet using:"
            echo "- Restaurant ID: $RT_DESIGNATOR"
            echo "- Authentication Key: $RT_KEY"
            echo ""
            
            # Save to file for integration
            echo "# A19 Tablet Restaurant Credentials" > a19-credentials.txt
            echo "RT_DESIGNATOR=$RT_DESIGNATOR" >> a19-credentials.txt
            echo "RT_KEY=$RT_KEY" >> a19-credentials.txt
            echo "COOKIES=$COOKIES" >> a19-credentials.txt
            
            echo "📄 Credentials saved to: a19-credentials.txt"
            
        else
            echo "⚠️ Cookies found but could not parse rt_key/rt_designator"
            echo "Raw cookies: $COOKIES"
        fi
        
    else
        echo "⚠️ SharedPreferences found but no cookies detected"
        echo "Raw secrets data:"
        echo "$SECRETS"
    fi
    
else
    echo "❌ Could not access MenuCA app data"
    echo ""
    echo "This could mean:"
    echo "1. App is not installed or package name is different"
    echo "2. App data is protected (need root access)"
    echo "3. Different authentication method"
    echo ""
    echo "Let's try alternative approaches..."
    
    # Try to list all MenuCA-related packages
    echo "🔍 Looking for MenuCA packages..."
    adb shell "pm list packages | grep -i menu"
    
    echo ""
    echo "🔍 Looking for restaurant/order apps..."  
    adb shell "pm list packages | grep -i resto"
    adb shell "pm list packages | grep -i order"
    adb shell "pm list packages | grep -i restaurant"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "If credentials were found above, I can now:"
echo "1. Update the integration with your REAL A19 credentials"
echo "2. Send test orders directly to your tablet"
echo "3. Verify orders appear and trigger NETUM printer"
echo ""
echo "If no credentials found, we may need to:"
echo "1. Check if the app uses different authentication"
echo "2. Monitor network traffic while app is running"
echo "3. Try alternative credential extraction methods"