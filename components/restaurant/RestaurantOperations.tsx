import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Users, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  AlertCircle,
  Check
} from 'lucide-react';

// Types
interface OperatingHours {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  polygon: Array<{lat: number; lng: number}>;
  deliveryFee: number;
  minimumOrder: number;
  estimatedTime: number;
  isActive: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

interface RestaurantSettings {
  id: string;
  restaurantName: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  taxRate: number;
  serviceCharge: number;
  autoAcceptOrders: boolean;
  preparationTime: number;
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

const RestaurantOperations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hours' | 'zones' | 'staff' | 'settings'>('hours');
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingHours, setEditingHours] = useState<string | null>(null);
  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);

  // Mock data
  useEffect(() => {
    const mockHours: OperatingHours[] = [
      { id: '1', dayOfWeek: 0, openTime: '11:00', closeTime: '22:00', isClosed: false },
      { id: '2', dayOfWeek: 1, openTime: '11:00', closeTime: '22:00', isClosed: false },
      { id: '3', dayOfWeek: 2, openTime: '11:00', closeTime: '22:00', isClosed: false },
      { id: '4', dayOfWeek: 3, openTime: '11:00', closeTime: '22:00', isClosed: false },
      { id: '5', dayOfWeek: 4, openTime: '11:00', closeTime: '23:00', isClosed: false },
      { id: '6', dayOfWeek: 5, openTime: '11:00', closeTime: '23:00', isClosed: false },
      { id: '7', dayOfWeek: 6, openTime: '12:00', closeTime: '22:00', isClosed: false }
    ];

    const mockZones: DeliveryZone[] = [
      {
        id: '1',
        name: 'Downtown Core',
        description: 'Central business district',
        polygon: [{lat: 43.6426, lng: -79.3871}, {lat: 43.6476, lng: -79.3771}],
        deliveryFee: 2.99,
        minimumOrder: 15.00,
        estimatedTime: 30,
        isActive: true
      },
      {
        id: '2',
        name: 'Midtown',
        description: 'Residential area north of downtown',
        polygon: [{lat: 43.6826, lng: -79.3971}, {lat: 43.6876, lng: -79.3871}],
        deliveryFee: 4.99,
        minimumOrder: 20.00,
        estimatedTime: 45,
        isActive: true
      }
    ];

    const mockStaff: StaffMember[] = [
      {
        id: '1',
        name: 'John Manager',
        email: 'john@restaurant.com',
        phone: '(555) 123-4567',
        role: 'manager',
        permissions: ['manage_orders', 'manage_menu', 'view_reports'],
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'Sarah Staff',
        email: 'sarah@restaurant.com',
        phone: '(555) 987-6543',
        role: 'staff',
        permissions: ['manage_orders'],
        isActive: true,
        createdAt: '2024-02-01T14:30:00Z'
      }
    ];

    const mockSettings: RestaurantSettings = {
      id: '1',
      restaurantName: 'Sample Restaurant',
      description: 'Fresh, local ingredients prepared with care',
      phone: '(555) 123-FOOD',
      email: 'orders@restaurant.com',
      address: '123 Main St, Toronto, ON M5V 3A1',
      taxRate: 13.0,
      serviceCharge: 0.0,
      autoAcceptOrders: false,
      preparationTime: 25,
      notificationSettings: {
        email: true,
        sms: false,
        push: true
      }
    };

    setOperatingHours(mockHours);
    setDeliveryZones(mockZones);
    setStaffMembers(mockStaff);
    setSettings(mockSettings);
    setLoading(false);
  }, []);

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  const updateOperatingHours = (id: string, updates: Partial<OperatingHours>) => {
    setOperatingHours(prev => prev.map(hours => 
      hours.id === id ? { ...hours, ...updates } : hours
    ));
    setEditingHours(null);
  };

  const toggleStaffStatus = (id: string) => {
    setStaffMembers(prev => prev.map(staff => 
      staff.id === id ? { ...staff, isActive: !staff.isActive } : staff
    ));
  };

  const updateSettings = (updates: Partial<RestaurantSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Operations</h1>
        <p className="text-gray-600">Manage hours, delivery zones, staff, and settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'hours', label: 'Operating Hours', icon: Clock },
            { id: 'zones', label: 'Delivery Zones', icon: MapPin },
            { id: 'staff', label: 'Staff Management', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="mr-2 h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Operating Hours Tab */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Operating Hours</h2>
            <div className="space-y-3">
              {operatingHours.map((hours) => (
                <div key={hours.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium w-20">{getDayName(hours.dayOfWeek)}</span>
                    {editingHours === hours.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={hours.openTime}
                          onChange={(e) => updateOperatingHours(hours.id, { openTime: e.target.value })}
                          className="border rounded px-2 py-1"
                        />
                        <span>to</span>
                        <input
                          type="time"
                          value={hours.closeTime}
                          onChange={(e) => updateOperatingHours(hours.id, { closeTime: e.target.value })}
                          className="border rounded px-2 py-1"
                        />
                        <button
                          onClick={() => setEditingHours(null)}
                          className="p-1 text-green-600 hover:text-green-800"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {hours.isClosed ? (
                          <span className="text-red-600 font-medium">Closed</span>
                        ) : (
                          <span className="text-gray-700">{hours.openTime} - {hours.closeTime}</span>
                        )}
                        <button
                          onClick={() => setEditingHours(hours.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hours.isClosed}
                        onChange={(e) => updateOperatingHours(hours.id, { isClosed: e.target.checked })}
                        className="mr-2"
                      />
                      Closed
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Zones Tab */}
      {activeTab === 'zones' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Delivery Zones</h2>
              <button
                onClick={() => setShowAddZone(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </button>
            </div>
            
            <div className="grid gap-4">
              {deliveryZones.map((zone) => (
                <div key={zone.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{zone.name}</h3>
                      <p className="text-gray-600">{zone.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        zone.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <span className="text-sm text-gray-500">Delivery Fee</span>
                      <p className="font-medium">${zone.deliveryFee.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Minimum Order</span>
                      <p className="font-medium">${zone.minimumOrder.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Est. Time</span>
                      <p className="font-medium">{zone.estimatedTime} min</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff Management Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Staff Management</h2>
              <button
                onClick={() => setShowAddStaff(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </button>
            </div>
            
            <div className="space-y-3">
              {staffMembers.map((staff) => (
                <div key={staff.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{staff.name}</h3>
                      <p className="text-gray-600">{staff.email}</p>
                      <p className="text-gray-600">{staff.phone}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          staff.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          staff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleStaffStatus(staff.id)}
                        className={`px-3 py-1 rounded text-sm ${
                          staff.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {staff.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className="text-sm text-gray-500">Permissions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {staff.permissions.map((permission) => (
                        <span key={permission} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Restaurant Settings</h2>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      value={settings.restaurantName}
                      onChange={(e) => updateSettings({ restaurantName: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => updateSettings({ phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={settings.description}
                      onChange={(e) => updateSettings({ description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={settings.address}
                      onChange={(e) => updateSettings({ address: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Operational Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Operational Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.taxRate}
                      onChange={(e) => updateSettings({ taxRate: parseFloat(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preparation Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.preparationTime}
                      onChange={(e) => updateSettings({ preparationTime: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.autoAcceptOrders}
                        onChange={(e) => updateSettings({ autoAcceptOrders: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Auto-accept orders
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Notification Settings</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notificationSettings.email}
                      onChange={(e) => updateSettings({
                        notificationSettings: {
                          ...settings.notificationSettings,
                          email: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notificationSettings.sms}
                      onChange={(e) => updateSettings({
                        notificationSettings: {
                          ...settings.notificationSettings,
                          sms: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">SMS notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.notificationSettings.push}
                      onChange={(e) => updateSettings({
                        notificationSettings: {
                          ...settings.notificationSettings,
                          push: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Push notifications</span>
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantOperations;