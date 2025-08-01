import React from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const TempNavigation: React.FC = () => {
  const router = useRouter();

  const routes = [
    { path: '/', label: '🏠 Home', description: 'Main dashboard/login' },
    { path: '/login', label: '🔐 Login', description: 'User authentication' },
    { path: '/restaurant', label: '👨‍🍳 Restaurant Management', description: 'Manage menus, categories, items' },
    { path: '/order', label: '🛒 Customer Ordering', description: 'Public restaurant listing' },
    { path: '/dashboard', label: '📊 Analytics Dashboard', description: 'Business insights' },
  ];

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-blue-800 mb-1">
            🧭 MenuCA Navigation (Temporary)
          </h3>
          <p className="text-xs text-blue-600">
            Quick access to all features - will be replaced with proper navigation
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {routes.map((route) => (
            <Button
              key={route.path}
              variant="outline"
              size="sm"
              onClick={() => {
                if (route.path === router.pathname) {
                  return; // Already on this page
                }
                router.push(route.path);
              }}
              className={`text-xs h-8 ${
                route.path === router.pathname 
                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                  : 'hover:bg-white'
              }`}
              title={route.description}
            >
              {route.label}
            </Button>
          ))}
        </div>
        
        <div className="mt-3 text-xs text-blue-600">
          💡 <strong>Test Flow:</strong> Restaurant Management → Load Pizza Data → Preview Customer Menu → Customer Ordering
        </div>
      </CardContent>
    </Card>
  );
};