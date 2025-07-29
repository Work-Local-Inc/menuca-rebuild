import React from 'react';
import { LiveChat } from '@/components/chat/LiveChat';

export default function SupportPage() {
  // In a real app, these would come from authentication context
  const userId = 'customer-123';
  const userToken = 'mock-jwt-token';
  const tenantId = 'default-tenant';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content area */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Support</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Support Options */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">How can we help you?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium mb-2">Order Issues</h3>
                    <p className="text-sm text-gray-600">Problems with your current or past orders</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium mb-2">Payment Help</h3>
                    <p className="text-sm text-gray-600">Billing questions and payment issues</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium mb-2">Account Settings</h3>
                    <p className="text-sm text-gray-600">Manage your profile and preferences</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <h3 className="font-medium mb-2">Technical Support</h3>
                    <p className="text-sm text-gray-600">App issues and technical problems</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">How do I track my order?</h3>
                    <p className="text-sm text-gray-600">
                      You can track your order status in real-time by visiting your order history page or checking the confirmation email we sent you.
                    </p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
                    <p className="text-sm text-gray-600">
                      We accept all major credit cards, debit cards, PayPal, Apple Pay, and Google Pay for your convenience.
                    </p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-2">How long does delivery take?</h3>
                    <p className="text-sm text-gray-600">
                      Standard delivery typically takes 30-45 minutes. Express delivery is available for an additional fee and takes 15-25 minutes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-green-600 mb-2">🟢 Live Chat</h3>
                    <p className="text-sm text-gray-600">
                      Chat with our support team for immediate assistance. Average response time: under 2 minutes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">📧 Email Support</h3>
                    <p className="text-sm text-gray-600">
                      Send us an email at support@menuca.com. We typically respond within 4 hours.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">📞 Phone Support</h3>
                    <p className="text-sm text-gray-600">
                      Call us at 1-800-MENUCA-1 for urgent issues. Available 24/7.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Need immediate help?</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Click the chat button in the bottom right corner to start a live conversation with our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Chat Widget - Always available */}
      <LiveChat
        userId={userId}
        userToken={userToken}
        tenantId={tenantId}
      />
    </div>
  );
}