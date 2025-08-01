# MenuCA Next Steps
## Immediate action plan with checkbox tracking

## Phase 1: Fix Critical Issues (This Week)
### Switch to PR Workflow
- [ ] Create feature branch for next change
- [ ] Push to branch (not main)
- [ ] Use `gh pr create` for PR
- [ ] Let CodeRabbit review
- [ ] Merge after review

### Fix Payment Processing (URGENT)
- [ ] Add Stripe Elements to checkout form
- [ ] Connect to existing `POST /api/payments/create-intent` 
- [ ] Replace "free" orders with real payment processing
- [ ] Test full payment flow end-to-end

### Fix Canada Post API
- [ ] Get Canada Post API key from user
- [ ] Add `NEXT_PUBLIC_CANADA_POST_API_KEY` to environment
- [ ] Test address autofill functionality
- [ ] Fallback to manual entry if API fails

### Replace localStorage Authentication
- [ ] Remove all localStorage auth code
- [ ] Implement JWT with HTTP-only cookies
- [ ] Connect to existing `POST /api/auth/login`  
- [ ] Add automatic token refresh
- [ ] Test login/logout flow

## Phase 2: Core Backend Integration (Next Week)
### Order Management
- [ ] Replace localStorage orders with `POST /api/orders`
- [ ] Connect WebSocket for real-time order updates
- [ ] Add order status tracking for customers
- [ ] Create restaurant dashboard for incoming orders

### Menu Management  
- [ ] Replace localStorage menus with `GET /api/restaurants/:id/menus`
- [ ] Connect menu CRUD to backend APIs
- [ ] Add real-time menu updates
- [ ] Remove all hardcoded demo data

### User Account System
- [ ] Add account creation during checkout
- [ ] Connect to user profile APIs
- [ ] Save customer addresses and payment methods
- [ ] Add order history functionality

## Phase 3: Advanced Features (Following Week)
### Analytics Dashboards
- [ ] Connect to existing analytics APIs
- [ ] Create revenue reporting dashboards  
- [ ] Add performance metrics visualization
- [ ] Implement export functionality

### Live Chat System
- [ ] Connect WebSocket chat APIs
- [ ] Add customer support chat widget
- [ ] Create support ticket system
- [ ] Add chat history functionality

### Commission Management
- [ ] Create commission tracking interface
- [ ] Add financial reporting dashboards
- [ ] Connect automated payout system
- [ ] Add partner revenue analytics

## Quality Checklist
Before any PR:
- [ ] No localStorage usage for business data
- [ ] All forms connect to backend APIs
- [ ] Payment processing works end-to-end
- [ ] Authentication uses JWT properly
- [ ] Real-time features use WebSocket
- [ ] Error handling for all API calls