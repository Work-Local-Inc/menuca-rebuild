import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const TempNavigation: React.FC = () => {
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">🧭 MenuCA Navigation (Temporary)</h3>
          <p className="text-xs text-blue-600">Quick access to all features - will be replaced with proper navigation</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('/')}
            title="Main dashboard/login"
          >
            🏠 Home
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('/login')}
            title="User authentication"
          >
            🔐 Login
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('/restaurant')}
            title="Manage menus, categories, items"
          >
            👨‍🍳 Restaurant Management
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('/menu/user-restaurant-user-1754075779852')}
            title="Public restaurant listing"
          >
            🛒 Customer Ordering
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('/dashboard')}
            title="Business insights"
          >
            📊 Analytics Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation('/checkout')}
            title="Test checkout flow"
          >
            💳 Test Checkout
          </Button>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          💡 <strong>Test Flow:</strong> Restaurant Management → Load Pizza Data → Preview Customer Menu → Customer Ordering
        </div>
      </CardContent>
    </Card>
  );
};