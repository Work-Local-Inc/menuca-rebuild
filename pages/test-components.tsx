import React, { useState } from 'react';
import CustomerManagement from '../src/components/restaurant/CustomerManagement';
import RestaurantOperations from '../src/components/restaurant/RestaurantOperations';
import OrderManagement from '../src/components/restaurant/OrderManagement';

const TestComponents: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'customers' | 'operations' | 'orders'>('customers');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">MenuCA Restaurant CMS - Component Test</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveComponent('customers')}
                className={`px-4 py-2 rounded-lg ${
                  activeComponent === 'customers'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Customer Management
              </button>
              <button
                onClick={() => setActiveComponent('operations')}
                className={`px-4 py-2 rounded-lg ${
                  activeComponent === 'operations'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Restaurant Operations
              </button>
              <button
                onClick={() => setActiveComponent('orders')}
                className={`px-4 py-2 rounded-lg ${
                  activeComponent === 'orders'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Order Management
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6">
        {activeComponent === 'customers' && <CustomerManagement />}
        {activeComponent === 'operations' && <RestaurantOperations />}
        {activeComponent === 'orders' && <OrderManagement />}
      </div>
    </div>
  );
};

export default TestComponents;