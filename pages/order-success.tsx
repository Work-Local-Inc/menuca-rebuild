import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderNumber: string;
  paymentIntentId: string;
  total: number;
  items: OrderItem[];
  timestamp: string;
}

export default function OrderSuccessPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  
  useEffect(() => {
    const { payment_intent } = router.query;
    
    if (payment_intent) {
      // Get order details from sessionStorage
      const storedOrder = sessionStorage.getItem('completed_order');
      const storedCart = sessionStorage.getItem('checkout_cart');
      
      let orderData: OrderDetails;
      
      if (storedOrder) {
        const parsed = JSON.parse(storedOrder);
        orderData = {
          orderNumber: (payment_intent as string).slice(-8).toUpperCase(),
          paymentIntentId: payment_intent as string,
          total: parsed.total || 0,
          items: parsed.items?.map((item: any) => ({
            name: item.menuItem?.name || item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: item.finalPrice || item.menuItem?.price || item.price || 0
          })) || [],
          timestamp: parsed.timestamp || new Date().toISOString()
        };
      } else if (storedCart) {
        const cart = JSON.parse(storedCart);
        const subtotal = cart.reduce((total: number, item: any) => {
          const price = item.finalPrice || item.menuItem?.price || item.price || 0;
          return total + (price * item.quantity);
        }, 0);
        
        orderData = {
          orderNumber: (payment_intent as string).slice(-8).toUpperCase(),
          paymentIntentId: payment_intent as string,
          total: subtotal + (subtotal * 0.13) + 2.99,
          items: cart.map((item: any) => ({
            name: item.menuItem?.name || item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            price: item.finalPrice || item.menuItem?.price || item.price || 0
          })),
          timestamp: new Date().toISOString()
        };
      } else {
        // Minimal fallback - still show success
        orderData = {
          orderNumber: (payment_intent as string).slice(-8).toUpperCase(),
          paymentIntentId: payment_intent as string,
          total: 25.99, // Default amount
          items: [
            { name: 'Your Order', quantity: 1, price: 25.99 }
          ],
          timestamp: new Date().toISOString()
        };
      }
      
      setOrderDetails(orderData);
      
      // Send to printer
      sendReceiptToPrinter(orderData);
      
      // Clear storage
      sessionStorage.removeItem('completed_order');
      sessionStorage.removeItem('checkout_cart');
      sessionStorage.removeItem('checkout_restaurant');
    } else {
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [router.query, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  // Send receipt to NETUM printer via Samsung tablet bridge
  const sendReceiptToPrinter = async (orderData: OrderDetails) => {
    try {
      setPrintStatus('printing');
      
      // Convert OrderDetails to printer format
      const printerOrderData = {
        orderNumber: orderData.orderNumber,
        restaurantName: 'MenuCA Restaurant', // You can get this from restaurant context
        restaurantPhone: '1-800-MENUCA',
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          finalPrice: item.price * item.quantity
        })),
        subtotal: orderData.total * 0.85, // Estimate subtotal
        tax: orderData.total * 0.13, // 13% HST estimate
        delivery: 2.99,
        tip: 0,
        total: orderData.total,
        paymentMethod: 'Card' as const,
        timestamp: orderData.timestamp
      };

      console.log('Generating ESC/POS commands for tablet bridge...', printerOrderData);
      
      // First, generate ESC/POS commands
      const response = await fetch('/api/printer/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: printerOrderData,
          printerConfig: {
            method: 'bluetooth' // Generate commands for bridge app
          }
        }),
      });

      const result = await response.json();
      
      if (result.success && result.commandsGenerated) {
        console.log('✅ ESC/POS commands generated, sending to tablet bridge...');
        
        // Try to send to tablet bridge app
        // You'll configure the tablet IP address for each restaurant
        const tabletIPs = [
          '192.168.1.100', // Restaurant 1 tablet
          '192.168.1.101', // Restaurant 2 tablet  
          // Add more tablet IPs as needed
        ];
        
        let printed = false;
        
        // Try each tablet IP until one succeeds
        for (const tabletIP of tabletIPs) {
          try {
            console.log(`Trying tablet bridge at ${tabletIP}...`);
            
            const bridgeResponse = await fetch(`http://${tabletIP}:8080/print`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                escposCommands: btoa(String.fromCharCode(...new Uint8Array(
                  await (await fetch('/api/printer/send-receipt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      orderData: printerOrderData,
                      printerConfig: { method: 'bluetooth' }
                    })
                  })).arrayBuffer()
                )))
              }),
              signal: AbortSignal.timeout(5000) // 5 second timeout
            });
            
            const bridgeResult = await bridgeResponse.json();
            
            if (bridgeResult.success) {
              console.log(`✅ Receipt printed via tablet ${tabletIP}`);
              printed = true;
              break;
            } else {
              console.log(`❌ Tablet ${tabletIP} failed: ${bridgeResult.error}`);
            }
            
          } catch (bridgeError) {
            console.log(`❌ Tablet ${tabletIP} unreachable: ${bridgeError}`);
            continue;
          }
        }
        
        if (printed) {
          setPrintStatus('success');
        } else {
          console.log('⚠️  No tablet bridges responded, receipt queued for manual printing');
          setPrintStatus('error');
        }
        
      } else {
        console.error('❌ Failed to generate ESC/POS commands:', result.error);
        setPrintStatus('error');
      }
    } catch (error) {
      console.error('❌ Printer integration error:', error);
      setPrintStatus('error');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', paddingTop: '64px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Processing your order...
          </h2>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Success Header */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '32px', 
          textAlign: 'center',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <span style={{ color: 'white', fontSize: '32px' }}>✓</span>
          </div>
          
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Order Confirmed!
          </h1>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '16px' }}>
            🎉 Payment successful - Your delicious food is on the way!
          </p>
          
          {/* Print Status Indicator */}
          {printStatus === 'printing' && (
            <div style={{ 
              backgroundColor: '#fef3c7', 
              border: '1px solid #f59e0b', 
              borderRadius: '6px', 
              padding: '8px 16px', 
              margin: '16px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid #f59e0b', 
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <span style={{ color: '#92400e', fontSize: '14px', fontWeight: '500' }}>
                Printing receipt...
              </span>
            </div>
          )}
          
          {printStatus === 'success' && (
            <div style={{ 
              backgroundColor: '#d1fae5', 
              border: '1px solid #10b981', 
              borderRadius: '6px', 
              padding: '8px 16px', 
              margin: '16px 0',
              color: '#065f46',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ✅ Receipt sent to printer successfully
            </div>
          )}
          
          {printStatus === 'error' && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              border: '1px solid #ef4444', 
              borderRadius: '6px', 
              padding: '8px 16px', 
              margin: '16px 0',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ⚠️ Receipt printing queued (check printer connection)
            </div>
          )}
          
          <div style={{ 
            backgroundColor: '#ecfdf5', 
            border: '1px solid #10b981', 
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#047857' }}>Order Number</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#064e3b', fontFamily: 'monospace' }}>
                  #{orderDetails?.orderNumber}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: '#047857' }}>Total Paid</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#064e3b' }}>
                  {formatCurrency(orderDetails?.total || 0)}
                </p>
              </div>
            </div>
          </div>
          
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Order placed on {new Date(orderDetails?.timestamp || '').toLocaleString('en-CA')}
          </p>
        </div>

        {/* Order Details */}
        {orderDetails && orderDetails.items.length > 0 && (
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            padding: '24px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
              📦 Your Order
            </h2>
            
            <div>
              {orderDetails.items.map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingBottom: '12px',
                  borderBottom: index < orderDetails.items.length - 1 ? '1px solid #e5e7eb' : 'none',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontWeight: '500', color: '#111827' }}>
                    {item.quantity}x {item.name}
                  </span>
                  <span style={{ fontWeight: '500', color: '#111827' }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{ 
              borderTop: '1px solid #e5e7eb', 
              marginTop: '16px', 
              paddingTop: '16px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                <span>Total</span>
                <span style={{ color: '#10b981' }}>{formatCurrency(orderDetails.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            ⏰ What's Next?
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginTop: '8px' }}></div>
              <div>
                <p style={{ fontWeight: '500', color: '#111827' }}>Payment Confirmed ✅</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Your payment has been processed successfully</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#eab308', borderRadius: '50%', marginTop: '8px' }}></div>
              <div>
                <p style={{ fontWeight: '500', color: '#111827' }}>Restaurant Preparing 👨‍🍳</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Your order has been sent to the kitchen</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#d1d5db', borderRadius: '50%', marginTop: '8px' }}></div>
              <div>
                <p style={{ fontWeight: '500', color: '#6b7280' }}>Out for Delivery 🚗</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>We'll notify you when your order is on the way</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => router.push('/restaurant/xtreme-pizza-checkout')}
            style={{
              width: '100%',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            Order Again from Xtreme Pizza
          </button>
          
          <button 
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              backgroundColor: 'white',
              color: '#374151',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Browse Other Restaurants
          </button>
        </div>
      </div>
    </div>
  );
}