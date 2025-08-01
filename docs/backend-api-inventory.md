# Backend API Inventory
## Complete list of 67+ existing API endpoints that frontend should use

### Authentication APIs ✅ (Ready to use)
- [ ] `POST /api/auth/login` - JWT login
- [ ] `POST /api/auth/refresh` - Token refresh  
- [ ] `GET /api/auth/profile` - User profile
- [ ] `POST /api/auth/logout` - Session end

### Payment APIs ✅ (Ready to use - orders currently FREE!)
- [ ] `POST /api/payments/create-intent` - Stripe payment
- [ ] `POST /api/payments/confirm` - Payment confirmation
- [ ] `GET /api/payments/methods` - Saved payment methods
- [ ] `GET /api/payments/history` - Payment history

### Order Management APIs ✅ (Ready to use)
- [ ] `GET /api/orders` - Order listing
- [ ] `POST /api/orders` - Create order (should replace localStorage)
- [ ] `PUT /api/orders/:id/status` - Update status
- [ ] `GET /api/orders/restaurant/:id` - Restaurant orders
- [ ] WebSocket `/ws/orders` - Real-time updates

### Restaurant APIs ✅ (Ready to use)
- [ ] `GET /api/restaurants` - Restaurant data
- [ ] `POST /api/restaurants` - Create restaurant
- [ ] `GET /api/restaurants/:id/menus` - Restaurant menus (replace localStorage!)
- [ ] `POST /api/menus` - Create menu (replace localStorage!)

### Commission & Financial APIs ✅ (Ready to use)
- [ ] `GET /api/commissions/calculate` - Commission calc
- [ ] `GET /api/reports/financial` - Financial reports
- [ ] `POST /api/payouts/initiate` - Payout processing

### Chat & Support APIs ✅ (Ready to use)
- [ ] `POST /api/support/tickets` - Support tickets
- [ ] WebSocket `/ws/chat` - Live chat
- [ ] `GET /api/chat/history` - Chat history

### Analytics APIs ✅ (Ready to use)
- [ ] `GET /api/analytics/restaurant/:id` - Restaurant metrics
- [ ] `GET /api/analytics/revenue` - Revenue analytics
- [ ] `GET /api/reports/export` - Export functionality

## Current Frontend Issues
- [ ] Using localStorage instead of these APIs 
- [ ] Orders are FREE (not using payment APIs)
- [ ] No real-time features (not using WebSocket)
- [ ] No authentication system (not using auth APIs)