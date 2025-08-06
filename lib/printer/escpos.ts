/**
 * ESC/POS Command Generator for NETUM NT-1809DD Thermal Printers
 * Generates raw ESC/POS commands for restaurant receipt printing
 */

export interface PrinterConfig {
  width: number; // Characters per line (42 for 58mm paper)
  encoding: string; // Character encoding
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  finalPrice: number;
}

export interface OrderData {
  orderNumber: string;
  restaurantName: string;
  restaurantPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery: number;
  tip: number;
  total: number;
  paymentMethod: 'Card' | 'Cash' | 'Digital';
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  timestamp: string;
}

export class ESCPOSGenerator {
  private config: PrinterConfig;
  
  // ESC/POS Command Constants for NETUM NT-1809DD
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';
  
  private readonly COMMANDS = {
    // Initialize printer
    INIT: '\x1B\x40',
    
    // Text formatting
    BOLD_ON: '\x1B\x45\x01',
    BOLD_OFF: '\x1B\x45\x00',
    UNDERLINE_ON: '\x1B\x2D\x01',
    UNDERLINE_OFF: '\x1B\x2D\x00',
    
    // Text alignment
    ALIGN_LEFT: '\x1B\x61\x00',
    ALIGN_CENTER: '\x1B\x61\x01',
    ALIGN_RIGHT: '\x1B\x61\x02',
    
    // Font size
    FONT_NORMAL: '\x1D\x21\x00',
    FONT_DOUBLE_HEIGHT: '\x1D\x21\x01',
    FONT_DOUBLE_WIDTH: '\x1D\x21\x10',
    FONT_DOUBLE_BOTH: '\x1D\x21\x11',
    
    // Line spacing
    LINE_SPACING_DEFAULT: '\x1B\x32',
    LINE_SPACING_NARROW: '\x1B\x33\x20',
    
    // Paper feed
    FEED_LINE: '\x0A',
    FEED_LINES_3: '\x0A\x0A\x0A',
    CUT_PAPER: '\x1D\x56\x00',
    
    // Character encoding
    CODEPAGE_CP437: '\x1B\x74\x00', // Standard US encoding
  };

  constructor(config: PrinterConfig = { width: 42, encoding: 'cp437' }) {
    this.config = config;
  }

  /**
   * Generate complete ESC/POS command sequence for restaurant receipt
   */
  generateReceiptCommands(orderData: OrderData): Uint8Array {
    let commands = '';
    
    // Initialize printer
    commands += this.COMMANDS.INIT;
    commands += this.COMMANDS.CODEPAGE_CP437;
    commands += this.COMMANDS.LINE_SPACING_NARROW;
    
    // Header
    commands += this.printHeader(orderData);
    
    // Order details
    commands += this.printOrderDetails(orderData);
    
    // Items list
    commands += this.printItems(orderData.items);
    
    // Totals
    commands += this.printTotals(orderData);
    
    // Footer
    commands += this.printFooter(orderData);
    
    // Cut paper
    commands += this.COMMANDS.FEED_LINES_3;
    commands += this.COMMANDS.CUT_PAPER;
    
    return this.stringToUint8Array(commands);
  }

  private printHeader(orderData: OrderData): string {
    let header = '';
    
    // Restaurant name (centered, bold, double height)
    header += this.COMMANDS.ALIGN_CENTER;
    header += this.COMMANDS.BOLD_ON;
    header += this.COMMANDS.FONT_DOUBLE_HEIGHT;
    header += orderData.restaurantName + '\n';
    header += this.COMMANDS.FONT_NORMAL;
    header += this.COMMANDS.BOLD_OFF;
    
    // Phone number (centered)
    if (orderData.restaurantPhone) {
      header += orderData.restaurantPhone + '\n';
    }
    
    // Separator line
    header += this.printLine();
    
    // Order number and timestamp (centered, bold)
    header += this.COMMANDS.BOLD_ON;
    header += `ORDER #${orderData.orderNumber}\n`;
    header += this.COMMANDS.BOLD_OFF;
    header += this.formatDate(orderData.timestamp) + '\n';
    
    header += this.printLine();
    
    return header;
  }

  private printOrderDetails(orderData: OrderData): string {
    let details = '';
    
    details += this.COMMANDS.ALIGN_LEFT;
    
    if (orderData.customerName) {
      details += `Customer: ${orderData.customerName}\n`;
    }
    
    if (orderData.customerPhone) {
      details += `Phone: ${orderData.customerPhone}\n`;
    }
    
    if (orderData.deliveryAddress) {
      details += `Delivery: ${this.wrapText(orderData.deliveryAddress, this.config.width)}\n`;
    }
    
    details += `Payment: ${orderData.paymentMethod}\n`;
    
    details += this.printLine();
    
    return details;
  }

  private printItems(items: OrderItem[]): string {
    let itemsStr = '';
    
    itemsStr += this.COMMANDS.ALIGN_LEFT;
    itemsStr += this.COMMANDS.BOLD_ON;
    itemsStr += this.padLine('ITEMS', 'PRICE') + '\n';
    itemsStr += this.COMMANDS.BOLD_OFF;
    
    items.forEach(item => {
      // Item name with quantity
      const itemLine = `${item.quantity}x ${item.name}`;
      const priceLine = `$${item.finalPrice.toFixed(2)}`;
      
      if (itemLine.length <= this.config.width - 8) {
        // Single line item
        itemsStr += this.padLine(itemLine, priceLine) + '\n';
      } else {
        // Multi-line item
        const wrappedName = this.wrapText(itemLine, this.config.width);
        const lines = wrappedName.split('\n');
        
        // First line with price
        itemsStr += this.padLine(lines[0], priceLine) + '\n';
        
        // Remaining lines
        for (let i = 1; i < lines.length; i++) {
          itemsStr += lines[i] + '\n';
        }
      }
    });
    
    itemsStr += this.printLine();
    
    return itemsStr;
  }

  private printTotals(orderData: OrderData): string {
    let totals = '';
    
    totals += this.COMMANDS.ALIGN_LEFT;
    
    // Subtotal
    totals += this.padLine('Subtotal:', `$${orderData.subtotal.toFixed(2)}`) + '\n';
    
    // Tax
    if (orderData.tax > 0) {
      totals += this.padLine('Tax:', `$${orderData.tax.toFixed(2)}`) + '\n';
    }
    
    // Delivery fee
    if (orderData.delivery > 0) {
      totals += this.padLine('Delivery:', `$${orderData.delivery.toFixed(2)}`) + '\n';
    }
    
    // Tip
    if (orderData.tip > 0) {
      totals += this.padLine('Tip:', `$${orderData.tip.toFixed(2)}`) + '\n';
    }
    
    totals += this.printLine();
    
    // Total (bold, double width)
    totals += this.COMMANDS.BOLD_ON;
    totals += this.COMMANDS.FONT_DOUBLE_WIDTH;
    totals += this.padLine('TOTAL:', `$${orderData.total.toFixed(2)}`) + '\n';
    totals += this.COMMANDS.FONT_NORMAL;
    totals += this.COMMANDS.BOLD_OFF;
    
    return totals;
  }

  private printFooter(orderData: OrderData): string {
    let footer = '';
    
    footer += this.printLine();
    footer += this.COMMANDS.ALIGN_CENTER;
    footer += 'Thank you for your order!\n';
    footer += 'Visit us again soon!\n';
    footer += this.COMMANDS.FEED_LINE;
    
    return footer;
  }

  private printLine(char: string = '-'): string {
    return char.repeat(this.config.width) + '\n';
  }

  private padLine(left: string, right: string): string {
    const padding = this.config.width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, padding)) + right;
  }

  private wrapText(text: string, width: number): string {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
  }

  private formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private stringToUint8Array(str: string): Uint8Array {
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i);
    }
    
    return view;
  }
}

// Export convenience function
export function generateNetumReceiptCommands(orderData: OrderData): Uint8Array {
  const generator = new ESCPOSGenerator();
  return generator.generateReceiptCommands(orderData);
}