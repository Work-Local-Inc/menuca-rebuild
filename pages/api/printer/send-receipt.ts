import { NextApiRequest, NextApiResponse } from 'next';
import { generateNetumReceiptCommands, OrderData } from '@/lib/printer/escpos';

interface PrinterRequest {
  orderData: OrderData;
  printerConfig?: {
    ipAddress: string;
    port?: number;
    method: 'network' | 'bluetooth';
    macAddress?: string; // For Bluetooth connection
  };
}

interface PrinterResponse {
  success: boolean;
  message: string;
  commandsGenerated?: boolean;
  commandsSize?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PrinterResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { orderData, printerConfig }: PrinterRequest = req.body;

    // Validate required order data
    if (!orderData || !orderData.orderNumber || !orderData.items) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order data (orderNumber, items)'
      });
    }

    // Generate ESC/POS commands for NETUM NT-1809DD
    console.log(`Generating receipt commands for order ${orderData.orderNumber}`);
    const escposCommands = generateNetumReceiptCommands(orderData);

    if (printerConfig && printerConfig.method === 'network' && printerConfig.ipAddress) {
      // Send to network printer
      const printResult = await sendToNetworkPrinter(
        escposCommands,
        printerConfig.ipAddress,
        printerConfig.port || 9100
      );

      if (printResult.success) {
        return res.status(200).json({
          success: true,
          message: `Receipt printed successfully to ${printerConfig.ipAddress}`,
          commandsGenerated: true,
          commandsSize: escposCommands.length
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to send to printer',
          error: printResult.error,
          commandsGenerated: true,
          commandsSize: escposCommands.length
        });
      }
    } else if (printerConfig && printerConfig.method === 'bluetooth') {
      // For Bluetooth, we'll return the commands for tablet to handle
      // Since web browsers can't directly connect to Bluetooth printers,
      // the Samsung tablet will need to receive these commands and send them
      return res.status(200).json({
        success: true,
        message: 'ESC/POS commands generated for Bluetooth transmission',
        commandsGenerated: true,
        commandsSize: escposCommands.length
      });
    } else {
      // Just generate commands (for testing or manual sending)
      return res.status(200).json({
        success: true,
        message: 'ESC/POS commands generated successfully',
        commandsGenerated: true,
        commandsSize: escposCommands.length
      });
    }

  } catch (error) {
    console.error('Receipt printing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing receipt',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Send ESC/POS commands to network-connected NETUM printer
 */
async function sendToNetworkPrinter(
  commands: Uint8Array,
  ipAddress: string,
  port: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // For network printing, we need to establish a TCP connection
    // This would typically use Node.js 'net' module in a server environment
    
    const net = require('net');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000); // 5 second timeout
      
      socket.on('connect', () => {
        console.log(`Connected to printer at ${ipAddress}:${port}`);
        socket.write(Buffer.from(commands));
        socket.end();
      });
      
      socket.on('close', () => {
        console.log('Printer connection closed');
        resolve({ success: true });
      });
      
      socket.on('error', (error) => {
        console.error('Printer connection error:', error);
        resolve({ 
          success: false, 
          error: `Network error: ${error.message}` 
        });
      });
      
      socket.on('timeout', () => {
        console.error('Printer connection timeout');
        socket.destroy();
        resolve({ 
          success: false, 
          error: 'Connection timeout - printer may be offline' 
        });
      });
      
      try {
        socket.connect(port, ipAddress);
      } catch (connectError) {
        resolve({ 
          success: false, 
          error: `Failed to connect: ${connectError}` 
        });
      }
    });
    
  } catch (error) {
    return {
      success: false,
      error: `Network printing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Alternative endpoint for getting raw ESC/POS commands as base64
 * Useful for tablet applications that handle their own printer communication
 */
export async function generateReceiptCommands(orderData: OrderData): Promise<string> {
  const commands = generateNetumReceiptCommands(orderData);
  return Buffer.from(commands).toString('base64');
}