# NETUM NT-1809DD Hardware Testing Guide

## Step 1: Samsung Tablet Setup

1. **Load Test Page**: 
   - Open `test-tablet-integration.html` on your Samsung tablet browser
   - Or navigate to: `https://menuca-rebuild.vercel.app/test-tablet-integration.html` (after deployment)

2. **Bluetooth Pairing**:
   - Ensure NETUM NT-1809DD is powered on
   - Pair with Samsung tablet via Bluetooth settings
   - Note the printer's Bluetooth address

## Step 2: Test ESC/POS Command Generation

1. **Browser Test**: Click "Generate Test Receipt" on the test page
2. **Copy Commands**: Copy the base64 encoded commands
3. **Bluetooth Print App**: Use any Bluetooth printer app to send raw commands

## Step 3: Test Real Payment Flow

1. **Complete Order**: Place a real order through the app
2. **Success Page**: After payment, success page will automatically attempt to print
3. **Check Print Status**: Look for print status indicators on success page

## Step 4: Network Printer Testing (Alternative)

If you have network-capable printers:

```bash
# Test direct network printing (replace IP with your printer's IP)
curl -X POST https://menuca-rebuild.vercel.app/api/printer/send-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "orderData": {
      "orderNumber": "NET001",
      "restaurantName": "MenuCA Network Test",
      "restaurantPhone": "1-800-MENUCA",
      "items": [{"name": "Test Pizza", "quantity": 1, "price": 15.99, "finalPrice": 15.99}],
      "subtotal": 15.99,
      "tax": 2.08,
      "delivery": 2.99,
      "tip": 0,
      "total": 21.06,
      "paymentMethod": "Card",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    },
    "printerConfig": {
      "method": "network",
      "ipAddress": "192.168.1.100",
      "port": 9100
    }
  }'
```

## Step 5: Integration with Existing Workflow

Since you mentioned replacing text2pay service:

1. **Current**: Order → text2pay → Samsung tablet → NETUM printer
2. **New**: Order → MenuCA API → Samsung tablet → NETUM printer

The Samsung tablet can now receive ESC/POS commands directly from your MenuCA app instead of through text2pay.

## Expected Results

✅ **Success Indicators**:
- ESC/POS commands generate without errors
- Receipt prints with proper formatting (42 characters wide)
- All order details appear correctly
- Paper cuts automatically after printing

❌ **Troubleshooting**:
- No print: Check Bluetooth pairing
- Garbled text: Verify ESC/POS command encoding
- Wrong format: Check paper width settings (58mm)
- No cut: Ensure printer supports auto-cut commands

## Command Structure Example

For your NETUM NT-1809DD, commands look like:
```
[ESC]@ - Initialize printer
[ESC]a[SOH] - Center align 
[ESC]E[SOH] - Bold on
MenuCA Restaurant
[ESC]E[NULL] - Bold off
------------------------------------------
ORDER #TEST001
Jan 08, 2025 2:30 PM
------------------------------------------
ITEMS                              PRICE
1x Large Pizza                    $18.99
2x Caesar Salad                   $17.98
------------------------------------------
Subtotal:                         $36.97
Tax:                              $4.81
Delivery:                         $2.99
Tip:                              $5.00
------------------------------------------
TOTAL:                            $49.77
------------------------------------------
       Thank you for your order!
       Visit us again soon!



[GS]V[NULL] - Cut paper
```