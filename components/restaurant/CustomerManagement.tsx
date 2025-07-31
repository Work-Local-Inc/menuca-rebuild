import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  ShoppingBag, 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  TrendingUp,
  Eye,
  Ban,
  Gift,
  Edit2
} from 'lucide-react';

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  firstOrderDate: string;
  status: 'active' | 'inactive' | 'banned';
  loyaltyPoints: number;
  notes: string;
  addresses: Address[];
  tags: string[];
}

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
}

interface CustomerOrder {
  id: string;
  date: string;
  total: number;
  items: number;
  status: 'completed' | 'cancelled' | 'refunded';
  paymentMethod: string;
}

interface CustomerFeedback {
  id: string;
  orderId: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
}

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  averageLifetimeValue: number;
  retentionRate: number;
}

const CustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customerFeedback, setCustomerFeedback] = useState<CustomerFeedback[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'banned'>('all');
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        totalOrders: 24,
        totalSpent: 456.78,
        averageOrderValue: 19.03,
        lastOrderDate: '2024-01-25T18:30:00Z',
        firstOrderDate: '2023-08-15T12:00:00Z',
        status: 'active',
        loyaltyPoints: 890,
        notes: 'Regular customer, prefers contactless delivery',
        addresses: [
          {
            id: '1',
            type: 'home',
            street: '123 Main St, Apt 4B',
            city: 'Toronto',
            postalCode: 'M5V 3A1',
            isDefault: true
          }
        ],
        tags: ['vip', 'frequent-orderer']
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        phone: '(555) 987-6543',
        totalOrders: 8,
        totalSpent: 167.45,
        averageOrderValue: 20.93,
        lastOrderDate: '2024-01-20T19:15:00Z',
        firstOrderDate: '2023-12-01T14:30:00Z',
        status: 'active',
        loyaltyPoints: 245,
        notes: 'Vegetarian preferences, always tips well',
        addresses: [
          {
            id: '2',
            type: 'work',
            street: '456 Business Ave, Suite 100',
            city: 'Toronto',
            postalCode: 'M4W 2K1',
            isDefault: true
          }
        ],
        tags: ['vegetarian', 'office-orders']
      },
      {
        id: '3',
        name: 'Mike Wilson',
        email: 'mike.wilson@email.com',
        phone: '(555) 555-0123',
        totalOrders: 3,
        totalSpent: 67.25,
        averageOrderValue: 22.42,
        lastOrderDate: '2024-01-10T16:45:00Z',
        firstOrderDate: '2024-01-05T20:00:00Z',
        status: 'active',
        loyaltyPoints: 125,
        notes: 'New customer, referred by John Smith',
        addresses: [
          {
            id: '3',
            type: 'home',
            street: '789 Oak Street',
            city: 'Toronto',
            postalCode: 'M6K 1A1',
            isDefault: true
          }
        ],
        tags: ['new-customer', 'referral']
      }
    ];

    const mockOrders: CustomerOrder[] = [
      {
        id: '1',
        date: '2024-01-25T18:30:00Z',
        total: 23.45,
        items: 2,
        status: 'completed',
        paymentMethod: 'Credit Card'
      },
      {
        id: '2',
        date: '2024-01-20T19:15:00Z',
        total: 31.20,
        items: 3,
        status: 'completed',
        paymentMethod: 'PayPal'
      },
      {
        id: '3',
        date: '2024-01-15T12:30:00Z',
        total: 18.75,
        items: 1,
        status: 'completed',
        paymentMethod: 'Credit Card'
      }
    ];

    const mockFeedback: CustomerFeedback[] = [
      {
        id: '1',
        orderId: '1',
        rating: 5,
        comment: 'Amazing food and fast delivery! Will definitely order again.',
        date: '2024-01-25T20:00:00Z'
      },
      {
        id: '2',
        orderId: '2',
        rating: 4,
        comment: 'Good food, but delivery was a bit slow today.',
        date: '2024-01-20T20:30:00Z',
        response: 'Thank you for the feedback! We\'ll work on improving delivery times.'
      }
    ];

    const mockStats: CustomerStats = {
      totalCustomers: 1247,
      activeCustomers: 1156,
      newThisMonth: 89,
      averageLifetimeValue: 287.45,
      retentionRate: 78.5
    };

    setCustomers(mockCustomers);
    setCustomerOrders(mockOrders);
    setCustomerFeedback(mockFeedback);
    setStats(mockStats);
    setLoading(false);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || customer.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p className="text-gray-600">Manage customer profiles, orders, and feedback</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newThisMonth}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Avg Lifetime Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageLifetimeValue)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Retention Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.retentionRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="banned">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loyalty Points
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                      {customer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {customer.tags.map((tag) => (
                            <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.totalOrders}</div>
                    <div className="text-sm text-gray-500">
                      Avg: {formatCurrency(customer.averageOrderValue)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(customer.totalSpent)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(customer.lastOrderDate)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Gift className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-900">{customer.loyaltyPoints}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDetail(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit Customer"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="More Options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {showCustomerDetail && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <p className="text-gray-600">Customer since {formatDate(selectedCustomer.firstOrderDate)}</p>
                </div>
                <button
                  onClick={() => setShowCustomerDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Customer Info */}
                <div className="col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{selectedCustomer.phone}</span>
                      </div>
                    </div>

                    <h4 className="font-medium mt-4 mb-2">Addresses</h4>
                    {selectedCustomer.addresses.map((address) => (
                      <div key={address.id} className="text-sm text-gray-600 mb-2">
                        <div className="font-medium">{address.type.charAt(0).toUpperCase() + address.type.slice(1)}</div>
                        <div>{address.street}</div>
                        <div>{address.city}, {address.postalCode}</div>
                      </div>
                    ))}

                    {selectedCustomer.notes && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Notes</h4>
                        <p className="text-sm text-gray-600">{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order History */}
                <div className="col-span-2">
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Order History</h3>
                    <div className="space-y-2">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">Order #{order.id}</div>
                              <div className="text-sm text-gray-600">
                                {formatDate(order.date)} • {order.items} items
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(order.total)}</div>
                              <span className={`px-2 py-1 text-xs rounded-full ${getOrderStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <h3 className="font-semibold mb-3">Customer Feedback</h3>
                    <div className="space-y-3">
                      {customerFeedback.map((feedback) => (
                        <div key={feedback.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <div className="flex mr-2">
                                {renderStars(feedback.rating)}
                              </div>
                              <span className="text-sm text-gray-600">Order #{feedback.orderId}</span>
                            </div>
                            <span className="text-sm text-gray-500">{formatDate(feedback.date)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{feedback.comment}</p>
                          {feedback.response && (
                            <div className="bg-blue-50 rounded p-2">
                              <div className="text-xs text-blue-600 font-medium mb-1">Your Response:</div>
                              <p className="text-sm text-gray-700">{feedback.response}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;