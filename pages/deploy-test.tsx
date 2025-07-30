import React from 'react';
import { RestaurantOperations } from '../src/components/restaurant/RestaurantOperations';
import { CustomerManagement } from '../src/components/restaurant/CustomerManagement';

export default function DeployTest() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            MenuCA Restaurant CMS
          </h1>
          <p className="text-xl text-gray-600">
            Multi-tenant SaaS Platform - Proof of Concept
          </p>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Restaurant Operations</h2>
            <RestaurantOperations />
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Customer Management</h2>
            <CustomerManagement />
          </div>
        </div>
      </div>
    </div>
  );
}