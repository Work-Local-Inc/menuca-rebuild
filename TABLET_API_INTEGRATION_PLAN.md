# 🔗 TABLET.MENU.CA API INTEGRATION PLAN

## 🎯 OBJECTIVE
Integrate MenuCA web orders with existing tablet.menu.ca system used by 100 restaurants, enabling seamless order flow from web to existing Samsung tablets and NETUM printers.

---

## 🔍 DISCOVERED API ENDPOINTS

### 1. `/action.php` - **PRIMARY ORDER ENDPOINT** 
**Purpose:** Core order processing - submission, updates, status changes
```javascript
$.ajax('/action.php', {
    data: {
        key: rt_key,        // Restaurant API key
        order: order_id,    // Order reference  
        action: 'submit',   // Action type
        // Additional order data...
    }
});
```

### 2. `/get_orders.php` - **ORDER POLLING** 
**Purpose:** Tablets poll this to receive new orders
```javascript
$.ajax('/get_orders.php', {
    data: {
        key: rt_key,
        sw_ver: np,
        api_ver: rt_api_version
    }
});
```

### 3. `/get_history.php` - **ORDER HISTORY**
**Purpose:** Historical order data and reporting  
```javascript
$.ajax('/get_history.php', {
    data: {
        key: rt_key,
        sw_ver: np, 
        api_ver: rt_api_version,
        start: timestamp_start,
        end: timestamp_end
    }
});
```

### 4. `/update_config.php` - **CONFIGURATION**
**Purpose:** Update tablet settings and configuration
```javascript
$.ajax('/update_config.php', {
    data: {
        key: rt_key,
        data: config_object
    }
});
```

### 5. `/diagnostics.php` - **MONITORING**
**Purpose:** System diagnostics and telemetry
```javascript
$.ajax('/diagnostics.php?' + query_string, {
    // Diagnostic data payload
});
```

---

## 🔑 AUTHENTICATION SYSTEM

### Restaurant Authentication
- **Primary Key:** `rt_key` (e.g., "689a3cd4216f2")
- **Restaurant ID:** `rt_designator` (e.g., "O33")  
- **API Version:** `rt_api_version` (currently "13")

### Example Authentication
```javascript
const auth = {
    rt_key: "689a3cd4216f2",
    rt_designator: "O33", 
    rt_api_version: "13"
};
```

---

## 🔄 INTEGRATION FLOW

### Current System
```
Customer Order → MenuCA Web App → Stripe Payment → Success Page
                                                      ↓
                                              [INTEGRATION POINT]
```

### Target Integration
```
Customer Order → MenuCA Web → Payment Success → /action.php → tablet.menu.ca
                                                                     ↓
Samsung Tablet ← /get_orders.php polling ← tablet.menu.ca backend
       ↓
NETUM Printer ← JavaScript Bridge ← WebView App
```

---

## 🛠️ IMPLEMENTATION STEPS

### Phase 1: API Testing & Authentication
1. **Test API Connectivity**
   ```bash
   curl -X POST https://tablet.menu.ca/action.php \
     -d "key=TEST_KEY&action=test"
   ```

2. **Obtain Restaurant API Keys**
   - Get `rt_key` for each of 100 restaurants
   - Map restaurant locations to API credentials
   - Test authentication for each location

### Phase 2: Order Format Discovery  
1. **Reverse Engineer Order Structure**
   - Analyze existing orders in tablet.menu.ca system
   - Document required fields and format
   - Test order submission with sample data

2. **Create Order Mapping**
   - Map MenuCA web order format → tablet.menu.ca format
   - Handle customer info, items, pricing, delivery details
   - Ensure receipt formatting compatibility

### Phase 3: Integration Development
1. **Build Order Injection Service**
   ```typescript
   // pages/api/inject-tablet-order.ts
   export default async function handler(req, res) {
     const { order, restaurant_id } = req.body;
     
     // Get restaurant API credentials
     const rt_key = getRestaurantAPIKey(restaurant_id);
     
     // Format order for tablet.menu.ca
     const tabletOrder = formatOrderForTablet(order);
     
     // Submit to tablet.menu.ca
     const response = await fetch('https://tablet.menu.ca/action.php', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: new URLSearchParams({
         key: rt_key,
         action: 'submit',
         order: JSON.stringify(tabletOrder)
       })
     });
     
     return res.json({ success: response.ok });
   }
   ```

2. **Integrate with Order Success Flow**
   ```typescript
   // In order-success.tsx
   useEffect(() => {
     if (paymentSuccess && orderData) {
       // Send order to tablet system
       fetch('/api/inject-tablet-order', {
         method: 'POST',
         body: JSON.stringify({
           order: orderData,
           restaurant_id: selectedRestaurant
         })
       });
     }
   }, [paymentSuccess]);
   ```

### Phase 4: Testing & Deployment
1. **Single Restaurant Pilot**
   - Test with one restaurant tablet
   - Verify order appears on tablet
   - Confirm NETUM printer functionality
   - Monitor for errors and edge cases

2. **Gradual Rollout**
   - Deploy to 5 pilot restaurants
   - Monitor system performance and reliability
   - Scale to all 100 restaurants systematically

---

## 🔧 TECHNICAL REQUIREMENTS

### Order Data Structure (TBD - Needs Discovery)
```javascript
const orderFormat = {
  customer: {
    name: string,
    phone: string,
    address: string,
    delivery_instructions: string
  },
  items: [{
    id: string,
    name: string, 
    price: number,
    quantity: number,
    options: object
  }],
  totals: {
    subtotal: number,
    tax: number,
    delivery: number,
    total: number
  },
  payment: {
    method: string,
    status: string,
    transaction_id: string
  }
};
```

### Error Handling
```typescript
const handleTabletAPIError = (error) => {
  // Log to monitoring system
  console.error('Tablet API Error:', error);
  
  // Retry logic for failed submissions
  // Fallback notification system
  // Admin alerts for systematic failures
};
```

---

## 📊 SUCCESS METRICS

### Integration Success Indicators
- ✅ Orders appear on restaurant tablets within 30 seconds
- ✅ NETUM printers produce readable receipts
- ✅ Zero data loss between web order and tablet display  
- ✅ 100% restaurant compatibility across all locations

### Performance Targets
- **API Response Time:** < 2 seconds
- **Order Delivery Success Rate:** > 99.5%
- **System Uptime:** > 99.9%
- **Error Rate:** < 0.1%

---

## ⚠️ RISK MITIGATION

### High Risk Items
1. **Authentication Failures**
   - **Mitigation:** Test all 100 restaurant API keys before deployment
   - **Fallback:** Manual order entry process during outages

2. **Order Format Incompatibility**
   - **Mitigation:** Extensive testing with sample orders
   - **Fallback:** Real-time order format validation

3. **API Rate Limiting**
   - **Mitigation:** Implement request throttling and retry logic
   - **Fallback:** Queue orders during high-traffic periods

### Monitoring & Alerts
- Real-time order delivery monitoring
- API failure rate tracking
- Restaurant-specific error reporting
- Automated alert system for administrators

---

## 🚀 DEPLOYMENT TIMELINE

| Phase | Duration | Tasks | Success Criteria |
|-------|----------|-------|------------------|
| **Phase 1** | 1-2 days | API discovery & auth testing | All endpoints accessible |
| **Phase 2** | 2-3 days | Order format reverse engineering | Sample orders successfully submitted |
| **Phase 3** | 3-5 days | Integration development | End-to-end order flow working |
| **Phase 4** | 1-2 weeks | Testing & gradual rollout | All 100 restaurants operational |

---

## 💡 COMPETITIVE ADVANTAGE

### Zero Disruption Deployment
- **No tablet app changes required**
- **No printer reconfiguration needed** 
- **No staff retraining necessary**
- **Uses existing working infrastructure**

### Immediate Business Value
- **100 restaurants ready day-one**
- **Proven printer integration**
- **Enterprise-scale order processing**
- **Cost-effective backwards compatibility**

This integration strategy delivers maximum business value with minimal technical risk by leveraging the existing, proven tablet.menu.ca infrastructure while adding our superior web ordering experience.