/**
 * DNS Hijack Server for MenuCA Integration
 * 
 * This DNS server redirects tablet.menu.ca to our local server
 * so existing MenuCA tablet apps load our compatible web app
 * instead of the dead server.
 */

const dns = require('dns');
const dgram = require('dgram');

const DNS_PORT = 53;
const WEB_SERVER_IP = '192.168.0.56'; // Your computer's IP
const HIJACK_DOMAIN = 'tablet.menu.ca';

// DNS packet parsing helper
function parseDNSQuery(buffer) {
    const query = {};
    let offset = 12; // Skip DNS header
    
    // Parse domain name
    const labels = [];
    while (offset < buffer.length) {
        const length = buffer[offset];
        if (length === 0) {
            offset++;
            break;
        }
        
        const label = buffer.toString('utf8', offset + 1, offset + 1 + length);
        labels.push(label);
        offset += 1 + length;
    }
    
    query.name = labels.join('.');
    query.type = buffer.readUInt16BE(offset);
    query.class = buffer.readUInt16BE(offset + 2);
    
    return query;
}

// DNS response builder
function buildDNSResponse(queryBuffer, ip) {
    const response = Buffer.alloc(queryBuffer.length + 16);
    
    // Copy query
    queryBuffer.copy(response);
    
    // Set response flags
    response.writeUInt16BE(0x8180, 2); // Standard query response, no error
    response.writeUInt16BE(0x0001, 6); // 1 answer
    
    // Add answer section
    let offset = queryBuffer.length;
    
    // Name (pointer to query name)
    response.writeUInt16BE(0xc00c, offset);
    offset += 2;
    
    // Type A record
    response.writeUInt16BE(0x0001, offset);
    offset += 2;
    
    // Class IN
    response.writeUInt16BE(0x0001, offset);
    offset += 2;
    
    // TTL (300 seconds)
    response.writeUInt32BE(300, offset);
    offset += 4;
    
    // Data length (4 bytes for IPv4)
    response.writeUInt16BE(4, offset);
    offset += 2;
    
    // IP address
    const ipParts = ip.split('.');
    for (let i = 0; i < 4; i++) {
        response.writeUInt8(parseInt(ipParts[i]), offset + i);
    }
    
    return response;
}

// Create DNS server
const dnsServer = dgram.createSocket('udp4');

dnsServer.on('message', (msg, rinfo) => {
    try {
        const query = parseDNSQuery(msg);
        
        console.log(`📡 DNS Query: ${query.name} from ${rinfo.address}:${rinfo.port}`);
        
        if (query.name === HIJACK_DOMAIN) {
            // Hijack tablet.menu.ca to point to our server
            console.log(`🎯 HIJACKING ${HIJACK_DOMAIN} → ${WEB_SERVER_IP}`);
            
            const response = buildDNSResponse(msg, WEB_SERVER_IP);
            dnsServer.send(response, rinfo.port, rinfo.address);
            
        } else {
            // Forward other queries to real DNS
            console.log(`🔄 Forwarding ${query.name} to real DNS`);
            
            dns.resolve(query.name, 'A', (err, addresses) => {
                if (err || !addresses.length) {
                    console.log(`❌ DNS resolution failed for ${query.name}`);
                    return;
                }
                
                const response = buildDNSResponse(msg, addresses[0]);
                dnsServer.send(response, rinfo.port, rinfo.address);
            });
        }
        
    } catch (error) {
        console.error('❌ DNS processing error:', error);
    }
});

dnsServer.on('listening', () => {
    console.log('🔥 MenuCA DNS Hijack Server Started!');
    console.log('=====================================');
    console.log(`📡 DNS Server: ${WEB_SERVER_IP}:${DNS_PORT}`);
    console.log(`🎯 Hijacking: ${HIJACK_DOMAIN} → ${WEB_SERVER_IP}`);
    console.log(`🌐 Web Server: http://${WEB_SERVER_IP}:3001/tablet-menu-ca.html`);
    console.log('');
    console.log('📱 TABLET SETUP INSTRUCTIONS:');
    console.log('1. WiFi Settings → Advanced → DNS');
    console.log(`2. Set DNS to: ${WEB_SERVER_IP}`);
    console.log('3. Open MenuCA tablet app');
    console.log('4. It will now load OUR server instead of dead tablet.menu.ca!');
});

dnsServer.on('error', (err) => {
    console.error('❌ DNS Server error:', err);
    if (err.code === 'EACCES') {
        console.log('⚠️  Port 53 requires root access. Run with sudo:');
        console.log('   sudo node dns-hijack-server.js');
    }
});

// Bind DNS server
dnsServer.bind(DNS_PORT, '0.0.0.0');

// Also serve the hijacked domain via HTTP
const express = require('express');
const app = express();

// Serve our tablet-menu-ca.html when tablet.menu.ca/app.php is requested  
app.get('/app.php', (req, res) => {
    console.log('🎯 HIJACKED REQUEST: tablet.menu.ca/app.php');
    console.log('📍 Redirecting to our compatible web app...');
    
    // Redirect to our compatible tablet interface
    res.redirect('/tablet-menu-ca.html');
});

// Start HTTP server on port 80 (standard HTTP port)
const HTTP_PORT = 80;
app.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`🌐 HTTP Hijack Server running on port ${HTTP_PORT}`);
    console.log(`🔗 Intercepting: tablet.menu.ca/app.php → /tablet-menu-ca.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down DNS hijack server...');
    dnsServer.close();
    process.exit(0);
});

// Keep alive
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
});

console.log('\n💡 INTEGRATION STRATEGY:');
console.log('Instead of modifying 100 tablet apps, we redirect');  
console.log('the dead tablet.menu.ca to load our compatible server!');
console.log('\nThis gives us ZERO-DISRUPTION backwards compatibility! 🚀');