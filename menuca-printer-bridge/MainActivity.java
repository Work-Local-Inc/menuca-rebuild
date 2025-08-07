package com.menuca.printerbridge;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

import java.io.IOException;
import java.io.OutputStream;
import java.util.UUID;

import fi.iki.elonen.NanoHTTPD;

/**
 * MenuCA Printer Bridge App
 * Receives HTTP print requests from MenuCA web app and sends to NETUM NT-1809DD via Bluetooth
 */
public class MainActivity extends AppCompatActivity {
    
    private static final String TAG = "MenuCAPrinterBridge";
    private static final int REQUEST_BLUETOOTH_PERMISSIONS = 1;
    private static final int HTTP_PORT = 8080;
    private static final UUID PRINTER_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    
    private BluetoothAdapter bluetoothAdapter;
    private PrinterServer httpServer;
    private TextView statusText;
    private TextView logText;
    private Handler mainHandler;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        statusText = findViewById(R.id.statusText);
        logText = findViewById(R.id.logText);
        mainHandler = new Handler(Looper.getMainLooper());
        
        bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
        
        updateStatus("MenuCA Printer Bridge Starting...");
        
        // Check permissions
        if (checkPermissions()) {
            startHttpServer();
        } else {
            requestPermissions();
        }
    }
    
    private boolean checkPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADMIN) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
    
    private void requestPermissions() {
        ActivityCompat.requestPermissions(this, 
            new String[]{
                Manifest.permission.BLUETOOTH,
                Manifest.permission.BLUETOOTH_ADMIN,
                Manifest.permission.ACCESS_FINE_LOCATION
            }, 
            REQUEST_BLUETOOTH_PERMISSIONS);
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_BLUETOOTH_PERMISSIONS) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            
            if (allGranted) {
                startHttpServer();
            } else {
                updateStatus("❌ Permissions required for Bluetooth printing");
                Toast.makeText(this, "Please grant all permissions for printer bridge to work", Toast.LENGTH_LONG).show();
            }
        }
    }
    
    private void startHttpServer() {
        try {
            httpServer = new PrinterServer(HTTP_PORT);
            httpServer.start();
            updateStatus("✅ HTTP Server running on port " + HTTP_PORT);
            addLog("Ready to receive print requests from MenuCA web app");
            addLog("Tablet IP: " + getLocalIpAddress());
        } catch (IOException e) {
            updateStatus("❌ Failed to start HTTP server: " + e.getMessage());
            Log.e(TAG, "Server start failed", e);
        }
    }
    
    private void updateStatus(String status) {
        mainHandler.post(() -> {
            statusText.setText(status);
            Log.i(TAG, status);
        });
    }
    
    private void addLog(String message) {
        mainHandler.post(() -> {
            String timestamp = java.text.DateFormat.getTimeInstance().format(new java.util.Date());
            String logEntry = timestamp + ": " + message + "\n";
            logText.append(logEntry);
            Log.i(TAG, message);
        });
    }
    
    private String getLocalIpAddress() {
        try {
            for (java.util.Enumeration<java.net.NetworkInterface> en = java.net.NetworkInterface.getNetworkInterfaces(); en.hasMoreElements();) {
                java.net.NetworkInterface intf = en.nextElement();
                for (java.util.Enumeration<java.net.InetAddress> enumIpAddr = intf.getInetAddresses(); enumIpAddr.hasMoreElements();) {
                    java.net.InetAddress inetAddress = enumIpAddr.nextElement();
                    if (!inetAddress.isLoopbackAddress() && inetAddress instanceof java.net.Inet4Address) {
                        return inetAddress.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "IP detection failed", e);
        }
        return "Unknown";
    }
    
    /**
     * HTTP Server that receives print requests from MenuCA web app
     */
    private class PrinterServer extends NanoHTTPD {
        
        public PrinterServer(int port) {
            super(port);
        }
        
        @Override
        public Response serve(IHTTPSession session) {
            String uri = session.getUri();
            Method method = session.getMethod();
            
            addLog("Received " + method + " request to " + uri);
            
            if (Method.POST.equals(method) && "/print".equals(uri)) {
                return handlePrintRequest(session);
            } else if (Method.GET.equals(method) && "/status".equals(uri)) {
                return handleStatusRequest();
            } else if (Method.OPTIONS.equals(method)) {
                // CORS preflight
                Response response = newFixedLengthResponse(Response.Status.OK, MIME_PLAINTEXT, "OK");
                addCorsHeaders(response);
                return response;
            }
            
            Response response = newFixedLengthResponse(Response.Status.NOT_FOUND, MIME_PLAINTEXT, "404 Not Found");
            addCorsHeaders(response);
            return response;
        }
        
        private Response handlePrintRequest(IHTTPSession session) {
            try {
                // Parse request body
                session.parseBody(new java.util.HashMap<>());
                String postData = session.getQueryParameterString();
                
                if (postData == null) {
                    // Try to read from input stream
                    java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(session.getInputStream())
                    );
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    postData = sb.toString();
                }
                
                Gson gson = new Gson();
                PrintRequest printRequest = gson.fromJson(postData, PrintRequest.class);
                
                if (printRequest.escposCommands == null) {
                    Response response = newFixedLengthResponse(Response.Status.BAD_REQUEST, MIME_PLAINTEXT, 
                        "{\"success\": false, \"error\": \"Missing escposCommands\"}");
                    addCorsHeaders(response);
                    return response;
                }
                
                // Decode base64 commands
                byte[] commands = Base64.decode(printRequest.escposCommands, Base64.DEFAULT);
                
                // Send to printer
                boolean success = sendToPrinter(commands, printRequest.printerMAC);
                
                String responseJson = success ? 
                    "{\"success\": true, \"message\": \"Receipt printed successfully\"}" :
                    "{\"success\": false, \"error\": \"Failed to print receipt\"}";
                
                Response response = newFixedLengthResponse(Response.Status.OK, "application/json", responseJson);
                addCorsHeaders(response);
                return response;
                
            } catch (Exception e) {
                addLog("❌ Print request failed: " + e.getMessage());
                String errorJson = "{\"success\": false, \"error\": \"" + e.getMessage() + "\"}";
                Response response = newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", errorJson);
                addCorsHeaders(response);
                return response;
            }
        }
        
        private Response handleStatusRequest() {
            String statusJson = "{\"status\": \"online\", \"bluetooth\": " + 
                (bluetoothAdapter != null && bluetoothAdapter.isEnabled()) + 
                ", \"server\": \"running\"}";
            
            Response response = newFixedLengthResponse(Response.Status.OK, "application/json", statusJson);
            addCorsHeaders(response);
            return response;
        }
        
        private void addCorsHeaders(Response response) {
            response.addHeader("Access-Control-Allow-Origin", "*");
            response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.addHeader("Access-Control-Allow-Headers", "Content-Type");
        }
    }
    
    /**
     * Send ESC/POS commands to NETUM printer via Bluetooth
     */
    private boolean sendToPrinter(byte[] commands, String printerMAC) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            addLog("❌ Bluetooth not available or disabled");
            return false;
        }
        
        BluetoothDevice printer = null;
        
        // Find printer by MAC address or use first paired NETUM printer
        if (printerMAC != null && !printerMAC.isEmpty()) {
            printer = bluetoothAdapter.getRemoteDevice(printerMAC);
        } else {
            // Find first NETUM printer
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH) == PackageManager.PERMISSION_GRANTED) {
                for (BluetoothDevice device : bluetoothAdapter.getBondedDevices()) {
                    if (device.getName() != null && device.getName().toUpperCase().contains("NETUM")) {
                        printer = device;
                        break;
                    }
                }
            }
        }
        
        if (printer == null) {
            addLog("❌ NETUM printer not found. Ensure printer is paired.");
            return false;
        }
        
        BluetoothSocket socket = null;
        try {
            addLog("📡 Connecting to printer: " + printer.getName());
            
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH) != PackageManager.PERMISSION_GRANTED) {
                addLog("❌ Bluetooth permission not granted");
                return false;
            }
            
            socket = printer.createRfcommSocketToServiceRecord(PRINTER_UUID);
            socket.connect();
            
            OutputStream outputStream = socket.getOutputStream();
            outputStream.write(commands);
            outputStream.flush();
            
            addLog("✅ Receipt sent to printer successfully (" + commands.length + " bytes)");
            return true;
            
        } catch (IOException e) {
            addLog("❌ Printer connection failed: " + e.getMessage());
            return false;
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (IOException e) {
                    Log.e(TAG, "Socket close failed", e);
                }
            }
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (httpServer != null) {
            httpServer.stop();
        }
    }
    
    /**
     * Print request from MenuCA web app
     */
    private static class PrintRequest {
        @SerializedName("escposCommands")
        String escposCommands; // Base64 encoded ESC/POS commands
        
        @SerializedName("printerMAC") 
        String printerMAC; // Optional specific printer MAC address
    }
}