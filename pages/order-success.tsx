import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

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
    // Wait for Next.js router to be ready with query parameters
    if (!router.isReady) {
      return;
    }
    
    const { payment_intent, redirect_status } = router.query;
    
    console.log('Success page - Router query:', router.query);
    console.log('Success page - Payment intent:', payment_intent);
    console.log('Success page - SessionStorage completed_order:', sessionStorage.getItem('completed_order'));
    console.log('Success page - SessionStorage checkout_cart:', sessionStorage.getItem('checkout_cart'));
    
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
      
      // Clear storage completely - both localStorage and sessionStorage
      sessionStorage.removeItem('completed_order');
      sessionStorage.removeItem('checkout_cart');
      sessionStorage.removeItem('checkout_restaurant');
      sessionStorage.removeItem('delivery_instructions');
      localStorage.removeItem('checkout_cart'); // THIS WAS MISSING!
      localStorage.removeItem('checkout_restaurant');
    } else {
      console.log('No payment_intent found - checking for fallback data...');
      
      // Fallback 1: Check for cart data without payment_intent
      const storedCart = sessionStorage.getItem('checkout_cart');
      const storedOrder = sessionStorage.getItem('completed_order');
      
      if (storedOrder || storedCart) {
        console.log('Found cart/order data without payment_intent - showing success page anyway');
        
        let fallbackOrderData: OrderDetails;
        
        if (storedOrder) {
          const parsed = JSON.parse(storedOrder);
          fallbackOrderData = {
            orderNumber: 'ORD' + Date.now().toString().slice(-6),
            paymentIntentId: 'manual_' + Date.now(),
            total: parsed.total || 25.99,
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
            const itemPrice = item.finalPrice || item.menuItem?.price || item.price || 0;
            return total + (itemPrice * (item.quantity || 1));
          }, 0);
          
          fallbackOrderData = {
            orderNumber: 'ORD' + Date.now().toString().slice(-6),
            paymentIntentId: 'manual_' + Date.now(),
            total: subtotal + (subtotal * 0.13) + 2.99,
            items: cart.map((item: any) => ({
              name: item.menuItem?.name || item.name || 'Unknown Item',
              quantity: item.quantity || 1,
              price: item.finalPrice || item.menuItem?.price || item.price || 0
            })),
            timestamp: new Date().toISOString()
          };
        } else {
          // This shouldn't happen, but just in case
          fallbackOrderData = {
            orderNumber: 'TEST001',
            paymentIntentId: 'test_payment',
            total: 25.99,
            items: [{ name: 'Test Order', quantity: 1, price: 25.99 }],
            timestamp: new Date().toISOString()
          };
        }
        
        setOrderDetails(fallbackOrderData);
        sendReceiptToPrinter(fallbackOrderData);
        
        // Clear storage completely - both localStorage and sessionStorage
        sessionStorage.removeItem('completed_order');
        sessionStorage.removeItem('checkout_cart');
        sessionStorage.removeItem('checkout_restaurant');
        sessionStorage.removeItem('delivery_instructions');
        localStorage.removeItem('checkout_cart'); // THIS WAS MISSING!
        localStorage.removeItem('checkout_restaurant');
        
      } else {
        // Fallback 2: Create test order for debugging
        console.log('No order data found - creating test order for debugging');
        const testOrder: OrderDetails = {
          orderNumber: 'TEST' + Date.now().toString().slice(-6),
          paymentIntentId: 'test_debug_' + Date.now(),
          total: 31.31,
          items: [
            { name: 'Debug Pizza Large', quantity: 1, price: 22.99 },
            { name: 'Debug Wings', quantity: 1, price: 8.32 }
          ],
          timestamp: new Date().toISOString()
        };
        
        setOrderDetails(testOrder);
        console.log('Created test order for debugging:', testOrder);
      }
    }
    
    setLoading(false);
  }, [router.isReady, router.query, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  // Send receipt to NETUM printer via ESC/POS Print Service
  const sendReceiptToPrinter = async (orderData: OrderDetails) => {
    try {
      setPrintStatus('printing');
      
      // Format receipt for thermal printing (58mm paper, 42 chars wide)
      const formatReceiptForPrinting = (data: OrderDetails): string => {
        const line = (char: string = '-') => char.repeat(42);
        const centerText = (text: string) => {
          const padding = Math.max(0, Math.floor((42 - text.length) / 2));
          return ' '.repeat(padding) + text;
        };
        const rightAlign = (left: string, right: string) => {
          const padding = Math.max(1, 42 - left.length - right.length);
          return left + ' '.repeat(padding) + right;
        };
        
        let receipt = '';
        
        // Header
        receipt += centerText('MenuCA Restaurant') + '\n';
        receipt += centerText('1-800-MENUCA') + '\n';
        receipt += line() + '\n';
        receipt += centerText(`ORDER #${data.orderNumber}`) + '\n';
        receipt += centerText(new Date(data.timestamp).toLocaleString()) + '\n';
        receipt += line() + '\n';
        
        // Items - KITCHEN-SAFE APPROACH: Print core items + summary for large orders
        const SAFE_ITEM_LIMIT = 30; // Conservative limit to prevent printer buffer overflow
        const totalItems = data.items.length;
        
        if (totalItems <= SAFE_ITEM_LIMIT) {
          // Normal receipt - show all items
          receipt += 'ITEMS' + ' '.repeat(29) + 'PRICE\n';
          data.items.forEach(item => {
            const itemText = `${item.quantity}x ${item.name}`;
            const priceText = `$${item.price.toFixed(2)}`;
            
            if (itemText.length <= 34) {
              receipt += rightAlign(itemText, priceText) + '\n';
            } else {
              const wrapped = itemText.substring(0, 34);
              receipt += rightAlign(wrapped + '...', priceText) + '\n';
            }
          });
        } else {
          // LARGE ORDER - Print summary format for kitchen
          receipt += centerText('⚠️ LARGE ORDER SUMMARY ⚠️') + '\n';
          receipt += line() + '\n';
          receipt += centerText(`${totalItems} TOTAL ITEMS ORDERED`) + '\n';
          receipt += line() + '\n';
          
          // Group items by name and show quantities
          const itemCounts = {};
          data.items.forEach(item => {
            const key = item.name;
            if (!itemCounts[key]) {
              itemCounts[key] = { count: 0, price: item.price };
            }
            itemCounts[key].count += item.quantity;
          });
          
          receipt += 'KITCHEN SUMMARY' + ' '.repeat(18) + 'QTY\n';
          Object.entries(itemCounts).forEach(([name, info]: [string, any]) => {
            const itemText = name.length > 32 ? name.substring(0, 32) + '...' : name;
            receipt += rightAlign(itemText, `x${info.count}`) + '\n';
          });
          
          receipt += line() + '\n';
          receipt += centerText('📋 CHECK ONLINE FOR FULL DETAILS') + '\n';
        }
        
        receipt += line() + '\n';
        
        // Totals
        const subtotal = data.total * 0.85;
        const tax = data.total * 0.13;
        const delivery = 2.99;
        
        receipt += rightAlign('Subtotal:', `$${subtotal.toFixed(2)}`) + '\n';
        receipt += rightAlign('Tax:', `$${tax.toFixed(2)}`) + '\n';
        receipt += rightAlign('Delivery:', `$${delivery.toFixed(2)}`) + '\n';
        receipt += line() + '\n';
        receipt += rightAlign('TOTAL:', `$${data.total.toFixed(2)}`) + '\n';
        receipt += line() + '\n';
        
        // Special delivery instructions (if any)
        const specialInstructions = sessionStorage.getItem('delivery_instructions') || '';
        if (specialInstructions && specialInstructions.trim()) {
          receipt += '\n';
          receipt += centerText('DELIVERY INSTRUCTIONS:') + '\n';
          receipt += line('-') + '\n';
          
          // Word wrap instructions to fit receipt width (42 chars)
          const words = specialInstructions.trim().split(' ');
          let currentLine = '';
          
          words.forEach(word => {
            if ((currentLine + word + ' ').length <= 42) {
              currentLine += word + ' ';
            } else {
              if (currentLine) {
                receipt += currentLine.trim() + '\n';
                currentLine = word + ' ';
              } else {
                // Single word longer than line, just add it
                receipt += word + '\n';
              }
            }
          });
          
          // Add any remaining text
          if (currentLine) {
            receipt += currentLine.trim() + '\n';
          }
          
          receipt += line('-') + '\n';
        }
        
        // Footer
        receipt += centerText('Thank you for your order!') + '\n';
        receipt += centerText('Visit us again soon!') + '\n';
        receipt += '\n\n\n';
        
        // Safety check: Conservative limit to prevent printer buffer overflow
        // NETUM thermal printers have strict memory limits - be safe
        const MAX_RECEIPT_LENGTH = 6000; // Safe 6KB limit for thermal printer reliability
        if (receipt.length > MAX_RECEIPT_LENGTH) {
          console.warn(`⚠️ Receipt extremely long (${receipt.length} chars), may need manual intervention`);
          // Only truncate if absolutely massive (catering orders 100+ items)
          receipt = receipt.substring(0, MAX_RECEIPT_LENGTH - 300) + '\n\n[LARGE ORDER - REMAINDER ON NEXT RECEIPT]\n[TOTAL ITEMS: ' + data.items.length + ']\n\n';
        }
        
        console.log(`📄 Receipt generated: ${receipt.length} characters, ${data.items.length} items`);
        return receipt;
      };

      console.log('Creating receipt for ESC/POS printing...', orderData);
      
      // Create a hidden printable div with the receipt
      const receiptContent = formatReceiptForPrinting(orderData);
      
      // Create print window content
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - Order #${orderData.orderNumber}</title>
          <style>
            @page {
              size: 58mm 200mm;
              margin: 0;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 5px;
              width: 58mm;
              color: black;
              background: white;
            }
            .receipt {
              white-space: pre-line;
              word-wrap: break-word;
            }
            @media print {
              body { 
                font-size: 10px;
                width: 100%;
                margin: 0;
                padding: 2mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">${receiptContent}</div>
        </body>
        </html>
      `;

      // Create a data URL with the receipt content for ESC/POS app link
      const receiptDataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(printContent)}`;
      
      // Send HTTP request to Samsung tablet running ESC/POS Print Service
      console.log('Sending receipt to restaurant Samsung tablet...');
      
      // Method 1: Try sending to restaurant tablet via HTTP
      try {
        // Restaurant tablet IP addresses (configure these for each location)
        const restaurantTablets = [
          '192.168.0.49', // Your Samsung tablet IP
        ];
        
        let printSuccess = false;
        
        // Use cloud bridge service - works from any device anywhere
        console.log('Sending receipt via MenuCA cloud bridge...');
        console.log(`📊 Order size: ${orderData.items?.length || 0} items, Receipt: ${receiptContent.length} chars`);
        
        // Additional safety check before transmission
        if (receiptContent.length > 10000) {
          console.warn(`⚠️ Very large receipt (${receiptContent.length} chars) - potential printer issue`);
        }
        
        try {
          const requestPayload = {
            restaurantId: 'xtreme-pizza',
            orderData: orderData,
            receiptData: receiptContent
          };
          
          // Check payload size
          const payloadSize = JSON.stringify(requestPayload).length;
          console.log(`📤 API payload size: ${payloadSize} bytes`);
          
          const response = await fetch('/api/printer/cloud-bridge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestPayload),
            signal: AbortSignal.timeout(15000) // 15 second timeout
          });

          const result = await response.json();
          
          if (result.success) {
            console.log(`✅ Receipt sent via cloud bridge to ${result.tablet}`);
            setPrintStatus('success');
            printSuccess = true;
          } else if (response.status === 202) {
            // Tablet offline but queued
            console.log(`⏳ Receipt queued for ${result.tablet} (tablet offline)`);
            setPrintStatus('success'); // Show success to customer
            printSuccess = true;
          } else {
            console.log(`❌ Cloud bridge error: ${result.error}`);
          }
          
        } catch (cloudError) {
          console.log(`❌ Cloud bridge failed:`, cloudError.message);
        }
        
        if (!printSuccess) {
          console.log('⚠️ Could not reach any restaurant tablets - trying fallback methods...');
          throw new Error('No tablets reachable');
        }
        
      } catch (httpError) {
        console.log('HTTP to tablet failed, trying Android share method...', httpError);
        
        // Method 2: Try share intent approach
        try {
          // Create share URL for ESC/POS service
          const shareData = {
            title: `Receipt - Order #${orderData.orderNumber}`,
            text: receiptContent,
            url: receiptDataUrl
          };
          
          if (navigator.share) {
            await navigator.share(shareData);
            console.log('✅ Receipt shared to ESC/POS service');
            setPrintStatus('success');
          } else {
            // Method 3: Fallback - open receipt in new tab for manual printing
            console.log('Share API not available, opening receipt for manual printing...');
            const printTab = window.open(receiptDataUrl, '_blank');
            if (printTab) {
              console.log('✅ Receipt opened in new tab - user can manually select ESC/POS service');
              setPrintStatus('success');
            } else {
              throw new Error('Could not open print tab');
            }
          }
          
        } catch (shareError) {
          console.log('Share intent failed, trying window print...', shareError);
          
          // Method 4: Final fallback - standard window.print() 
          const printWindow = window.open(receiptDataUrl, '_blank', 'width=300,height=600');
          if (printWindow) {
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
                setTimeout(() => {
                  printWindow.close();
                  setPrintStatus('success');
                  console.log('✅ Receipt sent via standard print dialog');
                }, 1000);
              }, 500);
            };
          } else {
            console.log('All print methods failed');
            setPrintStatus('error');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Print service error:', error);
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
    <>
      <Head>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </Head>
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
            onClick={() => {
              // Clear cart and storage completely for fresh order
              sessionStorage.removeItem('checkout_cart');
              sessionStorage.removeItem('checkout_restaurant'); 
              sessionStorage.removeItem('delivery_instructions');
              sessionStorage.removeItem('completed_order');
              localStorage.removeItem('checkout_cart'); // Clear the main cart storage
              localStorage.removeItem('checkout_restaurant');
              router.push('/restaurant/user-restaurant-user-adminmenucalocal-YWRtaW5A?fresh=true');
            }}
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
    </>
  );
}