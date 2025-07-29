-- Create help articles table if it doesn't exist
CREATE TABLE IF NOT EXISTS help_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    tags TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS help_article_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES help_articles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, article_id)
);

-- Enable RLS
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_article_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_help_articles ON help_articles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id'));

CREATE POLICY tenant_isolation_help_feedback ON help_article_feedback
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id'));

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_help_articles_tenant_id ON help_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_rating ON help_articles(rating);
CREATE INDEX IF NOT EXISTS idx_help_articles_views ON help_articles(view_count);
CREATE INDEX IF NOT EXISTS idx_help_articles_search ON help_articles USING gin(to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')));

-- Insert sample help articles for default tenant
INSERT INTO help_articles (tenant_id, title, content, category, tags, rating, view_count) VALUES
(
    'default-tenant',
    'How to Place Your First Order',
    'Welcome to MenuCA! Placing your first order is easy and straightforward. Here''s a step-by-step guide:

1. **Browse Restaurants**: Start by browsing available restaurants in your area. You can use the search function to find specific cuisines or restaurant names.

2. **Select Menu Items**: Click on a restaurant to view their menu. Browse through categories like appetizers, main courses, and desserts. Click "Add to Cart" for items you want to order.

3. **Review Your Cart**: Once you''ve selected your items, review your cart to make sure everything is correct. You can adjust quantities or remove items if needed.

4. **Checkout**: When you''re ready, proceed to checkout. Enter your delivery address and payment information.

5. **Track Your Order**: After placing your order, you''ll receive a confirmation and can track its progress in real-time.

Need help? Our support team is available 24/7 to assist you with any questions.',
    'Getting Started',
    ARRAY['ordering', 'first-time', 'tutorial', 'restaurants'],
    4.5,
    1250
),
(
    'default-tenant',
    'Payment Methods and Security',
    'MenuCA accepts various payment methods to make ordering convenient and secure:

**Accepted Payment Methods:**
- Credit Cards (Visa, MasterCard, American Express)
- Debit Cards
- Digital Wallets (Apple Pay, Google Pay)
- PayPal

**Security Features:**
- All transactions are encrypted using industry-standard SSL technology
- We never store your full credit card information
- PCI DSS compliant payment processing
- Two-factor authentication available for account security

**Payment Issues:**
If you encounter payment issues:
1. Check that your card information is correct
2. Ensure your card has sufficient funds
3. Verify that your card is authorized for online purchases
4. Contact your bank if the issue persists

For additional security, we recommend enabling two-factor authentication in your account settings.',
    'Payment & Billing',
    ARRAY['payment', 'security', 'credit-card', 'billing'],
    4.7,
    890
),
(
    'default-tenant',
    'Delivery Options and Timing',
    'Understanding delivery options helps you get your food when you want it:

**Standard Delivery:**
- Estimated delivery time: 30-45 minutes
- Available during restaurant operating hours
- Free delivery on orders over $25

**Express Delivery:**
- Estimated delivery time: 15-25 minutes
- Additional $3.99 fee
- Available during peak hours

**Scheduled Delivery:**
- Order up to 24 hours in advance
- Choose specific delivery times
- Perfect for parties or business meetings

**Pickup Option:**
- Skip delivery fees
- Ready in 15-20 minutes
- Get notifications when your order is ready

**Delivery Tracking:**
- Real-time GPS tracking
- SMS notifications at key stages
- Estimated arrival times
- Direct contact with delivery driver

Weather and high-demand periods may affect delivery times. We appreciate your patience!',
    'Delivery & Pickup',
    ARRAY['delivery', 'timing', 'pickup', 'tracking'],
    4.3,
    1100
),
(
    'default-tenant',
    'Account Management and Settings',
    'Manage your MenuCA account to customize your experience:

**Profile Settings:**
- Update personal information
- Change email and phone number
- Set dietary preferences and allergies
- Manage notification preferences

**Address Book:**
- Save multiple delivery addresses
- Set a default address
- Add special delivery instructions
- Business and home address options

**Order History:**
- View past orders
- Reorder favorite meals with one click
- Download receipts for expense reports
- Rate and review restaurants

**Preferences:**
- Cuisine preferences
- Dietary restrictions (vegetarian, vegan, gluten-free)
- Spice level preferences
- Preferred restaurants

**Security:**
- Change password
- Enable two-factor authentication
- Manage payment methods
- Review account activity

To access these settings, click on your profile icon in the top right corner of the app.',
    'Account Management',
    ARRAY['account', 'profile', 'settings', 'preferences'],
    4.6,
    750
),
(
    'default-tenant',
    'Restaurant Reviews and Ratings',
    'Help the community by leaving honest reviews and ratings:

**How to Leave a Review:**
1. Find the restaurant in your order history
2. Click "Rate & Review"
3. Give a star rating (1-5 stars)
4. Write a detailed review about your experience
5. Submit your review

**Review Guidelines:**
- Be honest and constructive
- Focus on food quality, delivery time, and overall experience
- Avoid personal attacks or inappropriate language
- Include specific details about your order
- Review guidelines are enforced to maintain quality

**Rating System:**
- 5 stars: Excellent experience
- 4 stars: Good experience with minor issues
- 3 stars: Average experience
- 2 stars: Below average, significant issues
- 1 star: Poor experience, major problems

**Benefits of Reviewing:**
- Help other customers make informed decisions
- Provide valuable feedback to restaurants
- Build your reviewer reputation
- Unlock special discounts and rewards

Your reviews help make MenuCA a better platform for everyone!',
    'Reviews & Ratings',
    ARRAY['reviews', 'ratings', 'feedback', 'community'],
    4.4,
    620
),
(
    'default-tenant',
    'Troubleshooting Common Issues',
    'Quick solutions to common problems you might encounter:

**App or Website Not Loading:**
- Check your internet connection
- Clear browser cache and cookies
- Try refreshing the page
- Update your app to the latest version
- Try using a different browser or device

**Order Not Received:**
- Check your order confirmation email
- Verify the delivery address
- Check with building reception or doorman
- Contact the restaurant directly
- Use our live chat for immediate assistance

**Payment Declined:**
- Verify card information is correct
- Check that you have sufficient funds
- Contact your bank to authorize online purchases
- Try a different payment method
- Update expired cards

**Food Quality Issues:**
- Document the issue with photos
- Contact customer support within 2 hours
- We''ll work with the restaurant to resolve
- Refunds or credits available for valid complaints

**Login Problems:**
- Reset your password
- Clear browser cache
- Check for typos in email address
- Contact support if issues persist

For immediate help, use our live chat feature or call customer support.',
    'Troubleshooting',
    ARRAY['troubleshooting', 'problems', 'support', 'issues'],
    4.2,
    980
),
(
    'default-tenant',
    'Promotions and Discount Codes',
    'Save money on your orders with promotions and discount codes:

**Types of Promotions:**
- First-time user discounts
- Restaurant-specific offers
- Seasonal promotions
- Loyalty program rewards
- Group order discounts

**How to Use Discount Codes:**
1. Add items to your cart
2. Go to checkout
3. Enter the promo code in the designated field
4. Click "Apply" to see the discount
5. Complete your order

**Finding Discount Codes:**
- Check your email for promotional offers
- Follow us on social media
- Look for restaurant-specific deals
- Check the promotions section in the app
- Sign up for our newsletter

**Loyalty Program:**
- Earn points with every order
- 1 point per dollar spent
- Redeem points for discounts
- Exclusive member-only deals
- Birthday and anniversary rewards

**Terms and Conditions:**
- One promo code per order
- Minimum order amounts may apply
- Expiration dates must be observed
- Cannot be combined with other offers
- Some restrictions may apply

Check back regularly for new promotions and special offers!',
    'Promotions & Discounts',
    ARRAY['promotions', 'discounts', 'coupons', 'loyalty', 'savings'],
    4.5,
    1340
);

-- Update the rating based on feedback (this would normally be done by the feedback system)
UPDATE help_articles SET rating = 4.5 WHERE title = 'How to Place Your First Order';
UPDATE help_articles SET rating = 4.7 WHERE title = 'Payment Methods and Security';
UPDATE help_articles SET rating = 4.3 WHERE title = 'Delivery Options and Timing';
UPDATE help_articles SET rating = 4.6 WHERE title = 'Account Management and Settings';
UPDATE help_articles SET rating = 4.4 WHERE title = 'Restaurant Reviews and Ratings';
UPDATE help_articles SET rating = 4.2 WHERE title = 'Troubleshooting Common Issues';
UPDATE help_articles SET rating = 4.5 WHERE title = 'Promotions and Discount Codes';