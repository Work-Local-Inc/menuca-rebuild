package com.cojotech.commission.menu.restotool;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.util.Log;
import com.cojotech.commission.menu.printer.Command;
import com.cojotech.commission.menu.printer.PrintPicture;
import com.cojotech.commission.menu.printer.PrinterCommand;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

/* loaded from: classes.dex */
public class Printer {
    private static int CONNECTION_TRIES = 1;
    public static final int HORIZONTAL_RESOLUTION = 384;
    private static final UUID MY_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    private static String TAG = "Printer";
    BluetoothDevice m_btd;
    MainActivity m_context;
    InputStream m_istream;
    OutputStream m_ostream;
    Thread m_read_thread;
    BluetoothSocket m_sock;

    public static class PrinterInfo {
        String address;
        String name;
    }

    Printer(MainActivity mainActivity) {
        this.m_context = mainActivity;
        findPrinter();
    }

    public synchronized void findPrinter() {
        if (hasPrinter()) {
            return;
        }
        String string = this.m_context.m_preferences.getString("printer_address", null);
        if (string != null) {
            for (BluetoothDevice bluetoothDevice : this.m_context.m_bt_adapter.getBondedDevices()) {
                if (bluetoothDevice.getAddress().equals(string)) {
                    this.m_btd = bluetoothDevice;
                } else {
                    Log.d(TAG, "Couldn't find previously associated printer.");
                }
            }
        }
        if (hasPrinter()) {
            this.m_context.notifyBTChange(true);
        }
    }

    public synchronized boolean setPrinter(String str, String str2) {
        for (BluetoothDevice bluetoothDevice : this.m_context.m_bt_adapter.getBondedDevices()) {
            if (bluetoothDevice.getAddress().equals(str2)) {
                if (this.m_btd == null || !bluetoothDevice.getAddress().equals(this.m_btd.getAddress())) {
                    close();
                    this.m_btd = bluetoothDevice;
                    SharedPreferences.Editor editorEdit = this.m_context.m_preferences.edit();
                    editorEdit.putString("printer_name", bluetoothDevice.getName());
                    editorEdit.putString("printer_address", bluetoothDevice.getAddress());
                    editorEdit.commit();
                }
                return true;
            }
        }
        return false;
    }

    public synchronized PrinterInfo getPrinterInfo() {
        PrinterInfo printerInfo;
        printerInfo = new PrinterInfo();
        if (this.m_btd != null) {
            printerInfo.name = this.m_btd.getName();
            printerInfo.address = this.m_btd.getAddress();
        }
        return printerInfo;
    }

    public synchronized boolean hasPrinter() {
        return this.m_btd != null;
    }

    public synchronized boolean ensureConnection() {
        if (!this.m_context.m_bt_adapter.isEnabled()) {
            return false;
        }
        findPrinter();
        if (!hasPrinter()) {
            return false;
        }
        for (int i = 0; i < CONNECTION_TRIES; i++) {
            try {
                if (this.m_sock == null || !this.m_sock.isConnected()) {
                    stopReadThread();
                    this.m_sock = this.m_btd.createRfcommSocketToServiceRecord(MY_UUID);
                    this.m_sock.connect();
                    this.m_ostream = this.m_sock.getOutputStream();
                    this.m_istream = this.m_sock.getInputStream();
                    startReadThread();
                    send(Command.ESC_Init);
                }
                return true;
            } catch (IOException unused) {
            }
        }
        return false;
    }

    private void startReadThread() {
        this.m_read_thread = new Thread(new Runnable() { // from class: com.cojotech.commission.menu.restotool.Printer.1
            @Override // java.lang.Runnable
            public void run() throws IOException {
                while (!Thread.interrupted()) {
                    try {
                        byte[] bArr = new byte[10];
                        int i = Printer.this.m_istream.read(bArr);
                        String str = BuildConfig.FLAVOR;
                        for (int i2 = 0; i2 < i; i2++) {
                            str = str + Integer.toHexString(bArr[i2] & Command.PIECE);
                        }
                        Log.d(Printer.TAG, str);
                    } catch (IOException unused) {
                        Log.d(Printer.TAG, "Input stream disconnected.");
                        Printer.this.close();
                        return;
                    }
                }
            }
        });
        this.m_read_thread.start();
    }

    private void stopReadThread() throws InterruptedException, IOException {
        Thread thread = this.m_read_thread;
        if (thread == null || !thread.isAlive()) {
            return;
        }
        try {
            try {
                this.m_istream.close();
            } catch (IOException unused) {
            }
            this.m_read_thread.interrupt();
            this.m_read_thread.join(100L);
        } catch (InterruptedException unused2) {
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void close() throws IOException {
        try {
            if (this.m_sock != null) {
                this.m_sock.close();
                Log.d(TAG, "Socket closed.");
            }
        } catch (IOException unused) {
            Log.d(TAG, "Failed to close bluetooth socket.");
        }
    }

    private void send(byte[] bArr) throws IOException {
        this.m_ostream.write(bArr);
        this.m_ostream.flush();
    }

    /* JADX WARN: Removed duplicated region for block: B:19:0x0031 A[Catch: IOException -> 0x003e, all -> 0x0043, TRY_LEAVE, TryCatch #1 {IOException -> 0x003e, blocks: (B:16:0x001d, B:17:0x0028, B:19:0x0031), top: B:29:0x001d, outer: #0 }] */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct add '--show-bad-code' argument
    */
    public synchronized boolean text(java.lang.String r7, java.lang.String r8, int r9, int r10, int r11, int r12, boolean r13, boolean r14) {
        /*
            r6 = this;
            monitor-enter(r6)
            java.io.OutputStream r0 = r6.m_ostream     // Catch: java.lang.Throwable -> L43
            r1 = 0
            if (r0 != 0) goto L8
            monitor-exit(r6)
            return r1
        L8:
            if (r13 == 0) goto Ld
            r13 = 8
            goto Le
        Ld:
            r13 = 0
        Le:
            byte r13 = (byte) r13
            if (r14 == 0) goto L14
            r13 = r13 | 128(0x80, float:1.8E-43)
            byte r13 = (byte) r13
        L14:
            r14 = 2
            r0 = 33
            r2 = 27
            r3 = 3
            r4 = 1
            if (r13 == 0) goto L28
            byte[] r5 = new byte[r3]     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r5[r1] = r2     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r5[r4] = r0     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r5[r14] = r13     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r6.send(r5)     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
        L28:
            byte[] r7 = com.cojotech.commission.menu.printer.PrinterCommand.POS_Print_Text(r7, r8, r9, r10, r11, r12)     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r6.send(r7)     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            if (r13 == 0) goto L3c
            byte[] r7 = new byte[r3]     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r7[r1] = r2     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r7[r4] = r0     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r7[r14] = r1     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
            r6.send(r7)     // Catch: java.io.IOException -> L3e java.lang.Throwable -> L43
        L3c:
            monitor-exit(r6)
            return r4
        L3e:
            r6.close()     // Catch: java.lang.Throwable -> L43
            monitor-exit(r6)
            return r1
        L43:
            r7 = move-exception
            monitor-exit(r6)
            throw r7
        */
        throw new UnsupportedOperationException("Method not decompiled: com.cojotech.commission.menu.restotool.Printer.text(java.lang.String, java.lang.String, int, int, int, int, boolean, boolean):boolean");
    }

    public synchronized boolean printBitmap(Bitmap bitmap, int i, int i2) {
        if (this.m_ostream == null) {
            return false;
        }
        int i3 = HORIZONTAL_RESOLUTION;
        if (bitmap != null) {
            if (i > 0 && i2 > 0) {
                try {
                    Bitmap bitmapCreateBitmap = Bitmap.createBitmap(bitmap.getWidth() + i2, bitmap.getHeight(), bitmap.getConfig());
                    Canvas canvas = new Canvas(bitmapCreateBitmap);
                    Paint paint = new Paint();
                    paint.setStyle(Paint.Style.FILL);
                    paint.setColor(-1);
                    canvas.drawRect(0.0f, 0.0f, bitmap.getWidth() + i2, bitmap.getHeight(), paint);
                    canvas.drawBitmap(bitmap, i2, 0.0f, paint);
                    bitmap = bitmapCreateBitmap;
                } catch (IOException unused) {
                    close();
                    return false;
                }
            }
            if (i != 0) {
                i3 = i + i2;
            }
            byte[] bArrPOS_PrintBMP = PrintPicture.POS_PrintBMP(bitmap, i3, 0);
            send(Command.ESC_Init);
            send(bArrPOS_PrintBMP);
            send(Command.LF);
        }
        return true;
    }

    public synchronized boolean beginPrint() {
        return true;
    }

    public synchronized boolean endPrint() {
        if (this.m_ostream == null) {
            return false;
        }
        try {
            send(PrinterCommand.POS_Set_Cut(1));
            send(PrinterCommand.POS_Set_PrtInit());
            return true;
        } catch (IOException unused) {
            close();
            return false;
        }
    }

    public synchronized boolean selfTest() {
        if (this.m_ostream == null) {
            return false;
        }
        try {
            send(PrinterCommand.POS_Set_PrtSelfTest());
            return true;
        } catch (IOException unused) {
            close();
            return false;
        }
    }
}
