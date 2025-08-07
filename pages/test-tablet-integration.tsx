import React, { useState } from 'react';
import Head from 'next/head';

interface OrderData {
  orderNumber: string;
  restaurantName: string;
  restaurantPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    finalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  delivery: number;
  tip: number;
  total: number;
  timestamp: string;
}

export default function TestTabletIntegration() {
  const [receiptOutput, setReceiptOutput] = useState('');
  const [orderOutput, setOrderOutput] = useState('');
  const [apiOutput, setApiOutput] = useState('');

  // Mock ESC/POS generator for tablet testing
  const generateESCPOSCommands = (orderData: OrderData): string => {
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // Initialize
    commands += '\x1B\x74\x00'; // Set codepage
    
    // Header (centered, bold, double height)
    commands += '\x1B\x61\x01'; // Center align
    commands += '\x1B\x45\x01'; // Bold on
    commands += '\x1D\x21\x01'; // Double height
    commands += orderData.restaurantName + '\n';
    commands += '\x1D\x21\x00'; // Normal size
    commands += '\x1B\x45\x00'; // Bold off
    
    if (orderData.restaurantPhone) {
      commands += orderData.restaurantPhone + '\n';
    }
    
    // Separator line
    commands += '-'.repeat(42) + '\n';
    
    // Order number (bold)
    commands += '\x1B\x45\x01'; // Bold on
    commands += `ORDER #${orderData.orderNumber}\n`;
    commands += '\x1B\x45\x00'; // Bold off
    commands += new Date(orderData.timestamp).toLocaleString() + '\n';
    commands += '-'.repeat(42) + '\n';
    
    // Items
    commands += '\x1B\x61\x00'; // Left align
    commands += '\x1B\x45\x01'; // Bold on
    commands += 'ITEMS'.padEnd(34) + 'PRICE\n';
    commands += '\x1B\x45\x00'; // Bold off
    
    orderData.items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const priceLine = `$${item.finalPrice.toFixed(2)}`;
      const padding = 42 - itemLine.length - priceLine.length;
      commands += itemLine + ' '.repeat(Math.max(1, padding)) + priceLine + '\n';
    });
    
    commands += '-'.repeat(42) + '\n';
    
    // Totals
    commands += `Subtotal:`.padEnd(34) + `$${orderData.subtotal.toFixed(2)}\n`;
    if (orderData.tax > 0) {
      commands += `Tax:`.padEnd(34) + `$${orderData.tax.toFixed(2)}\n`;
    }
    if (orderData.delivery > 0) {
      commands += `Delivery:`.padEnd(34) + `$${orderData.delivery.toFixed(2)}\n`;
    }
    if (orderData.tip > 0) {
      commands += `Tip:`.padEnd(34) + `$${orderData.tip.toFixed(2)}\n`;
    }
    
    commands += '-'.repeat(42) + '\n';
    
    // Total (bold, double width)
    commands += '\x1B\x45\x01'; // Bold on
    commands += '\x1D\x21\x10'; // Double width
    commands += `TOTAL:`.padEnd(17) + `$${orderData.total.toFixed(2)}\n`;
    commands += '\x1D\x21\x00'; // Normal size
    commands += '\x1B\x45\x00'; // Bold off
    
    // Footer
    commands += '-'.repeat(42) + '\n';
    commands += '\x1B\x61\x01'; // Center align
    commands += 'Thank you for your order!\n';
    commands += 'Visit us again soon!\n';
    commands += '\n\n\n';
    commands += '\x1D\x56\x00'; // Cut paper
    
    return commands;
  };

  const generateTestReceipt = () => {
    const testOrder: OrderData = {
      orderNumber: 'TEST001',
      restaurantName: 'MenuCA Test Restaurant',
      restaurantPhone: '1-800-MENUCA',
      items: [
        { name: 'Large Pepperoni Pizza', quantity: 1, finalPrice: 18.99 },
        { name: 'Caesar Salad', quantity: 2, finalPrice: 17.98 }
      ],
      subtotal: 36.97,
      tax: 4.81,
      delivery: 2.99,
      tip: 5.00,
      total: 49.77,
      timestamp: new Date().toISOString()
    };
    
    const commands = generateESCPOSCommands(testOrder);
    
    setReceiptOutput(
      '✅ ESC/POS Commands Generated Successfully!\n\n' +
      'Commands (copy these to your Bluetooth printer app):\n' +
      commands.replace(/\x1B/g, '[ESC]').replace(/\x1D/g, '[GS]').replace(/\x00/g, '[NULL]').replace(/\x01/g, '[SOH]').replace(/\x40/g, '[INIT]') +
      '\n\nRaw Bytes Length: ' + commands.length + ' bytes' +
      '\n\nBase64 Encoded:\n' + btoa(commands)
    );
  };

  const testRealOrder = () => {
    const realOrder: OrderData = {
      orderNumber: 'ORD' + Date.now().toString().slice(-6),
      restaurantName: 'Xtreme Pizza Ottawa',
      restaurantPhone: '(613) 555-0123',
      items: [
        { name: 'Supreme Pizza Large', quantity: 1, finalPrice: 22.99 },
        { name: 'Chicken Wings 12pc', quantity: 1, finalPrice: 14.99 },
        { name: 'Garlic Bread', quantity: 1, finalPrice: 6.99 }
      ],
      subtotal: 44.97,
      tax: 5.85,
      delivery: 3.99,
      tip: 7.50,
      total: 62.31,
      timestamp: new Date().toISOString()
    };
    
    const commands = generateESCPOSCommands(realOrder);
    
    setOrderOutput(
      '✅ Real Order Receipt Generated!\n\n' +
      'Order Details:\n' + JSON.stringify(realOrder, null, 2) +
      '\n\nESC/POS Commands:\n' +
      commands.replace(/\x1B/g, '[ESC]').replace(/\x1D/g, '[GS]').replace(/\x00/g, '[NULL]').replace(/\x01/g, '[SOH]').replace(/\x40/g, '[INIT]') +
      '\n\nReady for NETUM NT-1809DD printer!'
    );
  };

  const testAPI = async () => {
    try {
      setApiOutput('⏳ Testing API connection...');
      
      const testData = {
        orderData: {
          orderNumber: 'API001',
          restaurantName: 'MenuCA API Test',
          restaurantPhone: '1-800-MENUCA',
          items: [{ name: 'Test Item', quantity: 1, price: 10.00, finalPrice: 10.00 }],
          subtotal: 10.00,
          tax: 1.30,
          delivery: 2.99,
          tip: 0,
          total: 14.29,
          paymentMethod: 'Card',
          timestamp: new Date().toISOString()
        },
        printerConfig: { method: 'bluetooth' }
      };
      
      const response = await fetch('/api/printer/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      
      setApiOutput(
        (response.ok ? '✅' : '❌') + ' API Response:\n\n' +
        'Status: ' + response.status + '\n' +
        'Response:\n' + JSON.stringify(result, null, 2)
      );
        
    } catch (error) {
      setApiOutput('❌ API Error:\n' + (error as Error).message);
    }
  };

  return (
    <>
      <Head>
        <title>MenuCA Tablet Printer Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1>🖨️ MenuCA NETUM Printer Test</h1>
          <p><strong>Instructions for Samsung Tablet:</strong></p>
          <ol>
            <li>Load this page on your Samsung tablet</li>
            <li>Ensure NETUM NT-1809DD printer is paired via Bluetooth</li>
            <li>Click "Generate Test Receipt" to create ESC/POS commands</li>
            <li>Commands will be displayed - you can copy them to your printer app</li>
          </ol>

          <div style={{ background: '#f5f5f5', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
            <h3>1. Generate Test Receipt Commands</h3>
            <button 
              onClick={generateTestReceipt}
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                margin: '5px' 
              }}
            >
              Generate Test Receipt
            </button>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              border: '1px solid #ddd', 
              margin: '10px 0', 
              fontFamily: 'monospace', 
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {receiptOutput}
            </pre>
          </div>

          <div style={{ background: '#f5f5f5', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
            <h3>2. Test Real Order Data</h3>
            <button 
              onClick={testRealOrder}
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                margin: '5px' 
              }}
            >
              Test with Real Order
            </button>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              border: '1px solid #ddd', 
              margin: '10px 0', 
              fontFamily: 'monospace', 
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {orderOutput}
            </pre>
          </div>

          <div style={{ background: '#f5f5f5', padding: '20px', margin: '20px 0', borderRadius: '8px' }}>
            <h3>3. Test API Connection</h3>
            <button 
              onClick={testAPI}
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                margin: '5px' 
              }}
            >
              Test Printer API
            </button>
            <pre style={{ 
              background: 'white', 
              padding: '10px', 
              border: '1px solid #ddd', 
              margin: '10px 0', 
              fontFamily: 'monospace', 
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {apiOutput}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}