package com.cojotech.commission.menu.restotool;

import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.bluetooth.BluetoothDevice;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Environment;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.text.Html;
import android.text.SpannableString;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import androidx.core.internal.view.SupportMenu;
import com.cojotech.commission.menu.restotool.Printer;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.concurrent.Callable;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/* loaded from: classes.dex */
public class WebAppInterface {
    NotificationChannel m_channel;
    MainActivity m_context;
    Printer m_printer;
    WebAppInterface self = this;
    int m_notification_id = 0;
    private String TAG = "WAI";

    private int getChannelWidth(int i) {
        if (i == 0) {
            return 20;
        }
        if (i == 1) {
            return 40;
        }
        if (i == 2) {
            return 80;
        }
        if (i != 3) {
            return i != 4 ? 0 : 81;
        }
        return 160;
    }

    @JavascriptInterface
    public boolean queryPrinterFeature(int i) {
        return false;
    }

    @JavascriptInterface
    public int version() {
        return 13;
    }

    WebAppInterface(MainActivity mainActivity) {
        this.m_context = mainActivity;
        this.m_printer = this.m_context.m_printer;
    }

    @JavascriptInterface
    public void showToast(String str, boolean z) {
        Toast.makeText(this.m_context, str, z ? 1 : 0).show();
    }

    @JavascriptInterface
    public void showToast(String str) {
        showToast(str, false);
    }

    @JavascriptInterface
    public void vibrate() {
        Vibrator vibrator = (Vibrator) this.m_context.getSystemService("vibrator");
        if (vibrator != null) {
            if (Build.VERSION.SDK_INT >= 26) {
                vibrator.vibrate(VibrationEffect.createOneShot(500L, -1));
            } else {
                vibrator.vibrate(500L);
            }
        }
    }

    @JavascriptInterface
    public int notify(String str, String str2, boolean z) {
        SpannableString spannableString;
        this.m_notification_id++;
        if (Build.VERSION.SDK_INT < 24) {
            spannableString = new SpannableString(Html.fromHtml(str2));
        } else {
            spannableString = new SpannableString(Html.fromHtml(str2, 0));
        }
        PowerManager powerManager = (PowerManager) this.m_context.getSystemService("power");
        powerManager.isInteractive();
        PowerManager.WakeLock wakeLockNewWakeLock = powerManager.newWakeLock(805306378, "RestoTool:WakeLock");
        wakeLockNewWakeLock.acquire();
        Intent intent = new Intent(this.m_context, (Class<?>) MainActivity.class);
        intent.setAction("android.intent.action.MAIN");
        intent.addCategory("android.intent.category.LAUNCHER");
        PendingIntent activity = PendingIntent.getActivity(this.m_context, 0, intent, 0);
        Intent intent2 = new Intent(MainActivity.class.getSimpleName() + "::DismissedNotification");
        intent2.putExtra(MainActivity.NOTIFICATION_ID, this.m_notification_id);
        PendingIntent broadcast = PendingIntent.getBroadcast(this.m_context, this.m_notification_id, intent2, 0);
        ensureChannel();
        MainActivity mainActivity = this.m_context;
        Notification notificationBuild = new NotificationCompat.Builder(mainActivity, Integer.toString(mainActivity.m_preferences.getInt("notification_channel", 0))).setSmallIcon(R.drawable.ic_logo_transparent_m).setContentTitle(str).setContentText(spannableString).setContentIntent(activity).setDeleteIntent(broadcast).setPriority(1).setVisibility(1).setAutoCancel(z).setSound(this.m_context.m_ringtone).setLights(SupportMenu.CATEGORY_MASK, 1000, 500).build();
        notificationBuild.flags |= 4;
        NotificationManagerCompat.from(this.m_context).notify(this.m_notification_id, notificationBuild);
        wakeLockNewWakeLock.release();
        return this.m_notification_id;
    }

    @JavascriptInterface
    public int notify(String str, String str2) {
        return notify(str, str2, false);
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            if (this.m_context.m_ringtone_changed) {
                int i = this.m_context.m_preferences.getInt("notification_channel", 0);
                ((NotificationManager) this.m_context.getSystemService(NotificationManager.class)).deleteNotificationChannel(Integer.toString(i));
                SharedPreferences.Editor editorEdit = this.m_context.m_preferences.edit();
                editorEdit.putInt("notification_channel", i + 1);
                editorEdit.commit();
                this.m_context.m_ringtone_changed = false;
                this.m_channel = null;
            }
            if (this.m_channel == null) {
                this.m_channel = new NotificationChannel(Integer.toString(this.m_context.m_preferences.getInt("notification_channel", 0)), "RestoTool", 4);
                this.m_channel.enableVibration(true);
                this.m_channel.setLockscreenVisibility(1);
                this.m_channel.setImportance(4);
                this.m_channel.setBypassDnd(true);
                this.m_channel.enableLights(true);
                this.m_channel.setSound(this.m_context.m_ringtone, new AudioAttributes.Builder().setContentType(4).setUsage(5).build());
                ((NotificationManager) this.m_context.getSystemService(NotificationManager.class)).createNotificationChannel(this.m_channel);
                cancelAllNotifications();
            }
        }
    }

    @JavascriptInterface
    public void cancelNotification(int i) {
        NotificationManagerCompat.from(this.m_context).cancel(i);
    }

    @JavascriptInterface
    public void setScreenAlwaysOn(final boolean z) {
        this.m_context.runOnUiThread(new Runnable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.1
            @Override // java.lang.Runnable
            public void run() {
                if (z) {
                    WebAppInterface.this.m_context.getWindow().addFlags(128);
                } else {
                    WebAppInterface.this.m_context.getWindow().clearFlags(128);
                }
            }
        });
    }

    @JavascriptInterface
    public void updateApp(String str) {
        File updateFileLocation = getUpdateFileLocation(true);
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(str));
        request.setTitle(this.m_context.getString(R.string.app_name));
        request.setDescription("Downloading update...");
        request.setDestinationUri(Uri.parse("file://" + updateFileLocation.getAbsolutePath()));
        this.m_context.registerReceiver(new AnonymousClass2(((DownloadManager) this.m_context.getSystemService("download")).enqueue(request), updateFileLocation), new IntentFilter("android.intent.action.DOWNLOAD_COMPLETE"));
    }

    /* renamed from: com.cojotech.commission.menu.restotool.WebAppInterface$2, reason: invalid class name */
    class AnonymousClass2 extends BroadcastReceiver {
        final /* synthetic */ long val$download_id;
        final /* synthetic */ File val$file;

        AnonymousClass2(long j, File file) {
            this.val$download_id = j;
            this.val$file = file;
        }

        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) {
            if (intent.getLongExtra("extra_download_id", -1L) == this.val$download_id) {
                Intent intent2 = new Intent("android.intent.action.VIEW");
                intent2.setDataAndType(FileProvider.getUriForFile(WebAppInterface.this.m_context, "com.cojotech.commission.menu.restotool.provider", this.val$file), "application/vnd.android.package-archive");
                intent2.setFlags(268435456);
                intent2.setFlags(1);
                WebAppInterface.this.m_context.startActivity(intent2);
                WebAppInterface.this.m_context.unregisterReceiver(this);
                WebAppInterface webAppInterface = WebAppInterface.this.self;
                WebAppInterface.setTimeout(new Runnable() { // from class: com.cojotech.commission.menu.restotool.-$$Lambda$WebAppInterface$2$9FmaZpdNbDj9cqBC4ci0LBsO6n4
                    @Override // java.lang.Runnable
                    public final void run() {
                        this.f$0.lambda$onReceive$0$WebAppInterface$2();
                    }
                }, 1000);
            }
        }

        public /* synthetic */ void lambda$onReceive$0$WebAppInterface$2() {
            WebAppInterface.this.self.notify("MENU.CA app update.", "A new update is available. Please follow the instructions on the screen.");
        }
    }

    @JavascriptInterface
    public void changeRingtone() {
        this.m_context.changeRingtone();
    }

    @JavascriptInterface
    public void setRingtone(final String str) {
        this.m_context.runOnUiThread(new Runnable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.3
            @Override // java.lang.Runnable
            public void run() {
                String strSubstring = str;
                if (strSubstring.indexOf(".") > 0) {
                    strSubstring = strSubstring.substring(0, strSubstring.indexOf("."));
                }
                int identifier = WebAppInterface.this.m_context.getResources().getIdentifier(strSubstring, "raw", WebAppInterface.this.m_context.getPackageName());
                if (identifier != 0) {
                    WebAppInterface.this.m_context.setRingtone("android.resource://" + WebAppInterface.this.m_context.getPackageName() + "/" + Integer.toString(identifier));
                    return;
                }
                WebAppInterface.this.m_context.setRingtone(WebAppInterface.this.m_context.m_default_ringtone.toString());
            }
        });
    }

    @JavascriptInterface
    public String getRingtone() throws NumberFormatException {
        if (!this.m_context.m_ringtone.toString().startsWith("android.resource://")) {
            return null;
        }
        try {
            return this.m_context.getResources().getResourceEntryName(Integer.parseInt(this.m_context.m_ringtone.getLastPathSegment()));
        } catch (NumberFormatException unused) {
            return null;
        }
    }

    @JavascriptInterface
    public int getRingtoneDuration() throws SecurityException, IllegalArgumentException {
        try {
            MediaMetadataRetriever mediaMetadataRetriever = new MediaMetadataRetriever();
            mediaMetadataRetriever.setDataSource(this.m_context.getApplicationContext(), this.m_context.m_ringtone);
            return Integer.parseInt(mediaMetadataRetriever.extractMetadata(9));
        } catch (Exception unused) {
            return 10000;
        }
    }

    @JavascriptInterface
    public String getPreference(String str) {
        return this.m_context.m_preferences.getString("_wv_" + str, null);
    }

    @JavascriptInterface
    public void setPreference(String str, String str2) {
        SharedPreferences.Editor editorEdit = this.m_context.m_preferences.edit();
        editorEdit.putString("_wv_" + str, str2);
        editorEdit.commit();
    }

    @JavascriptInterface
    public boolean hasBluetooth() {
        return this.m_context.m_bt_adapter != null;
    }

    @JavascriptInterface
    public boolean isBluetoothEnabled() {
        return this.m_context.m_bt_adapter.isEnabled();
    }

    @JavascriptInterface
    public void showBluetoothSettings() {
        Intent intent = new Intent();
        intent.setAction("android.settings.BLUETOOTH_SETTINGS");
        this.m_context.startActivity(intent);
    }

    @JavascriptInterface
    public String getBTDevices() throws JSONException {
        JSONArray jSONArray = new JSONArray();
        for (BluetoothDevice bluetoothDevice : this.m_context.m_bt_adapter.getBondedDevices()) {
            try {
                JSONObject jSONObject = new JSONObject();
                jSONObject.put("name", bluetoothDevice.getName());
                jSONObject.put("address", bluetoothDevice.getAddress());
                jSONArray.put(jSONObject);
            } catch (JSONException unused) {
            }
        }
        return jSONArray.toString();
    }

    @JavascriptInterface
    public boolean hasPrinter() {
        return this.m_printer.hasPrinter();
    }

    @JavascriptInterface
    public boolean selectPrinter(String str, String str2) {
        Log.d(this.TAG, "Selecting printer '" + str + "'.");
        return this.m_printer.setPrinter(str, str2);
    }

    @JavascriptInterface
    public String getSelectedPrinter() throws JSONException {
        JSONObject jSONObject = new JSONObject();
        try {
            Printer.PrinterInfo printerInfo = this.m_printer.getPrinterInfo();
            jSONObject.put("name", printerInfo.name);
            jSONObject.put("address", printerInfo.address);
        } catch (JSONException unused) {
            Log.d(this.TAG, "JSON Exception that will never happen.");
        }
        return jSONObject.toString();
    }

    @JavascriptInterface
    public JSPromise ensurePrinterConnection() {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.4
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                return Boolean.valueOf(WebAppInterface.this.m_printer.ensureConnection());
            }
        });
    }

    @JavascriptInterface
    public JSPromise startPrinterJob() {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.5
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                return Boolean.valueOf(WebAppInterface.this.m_printer.beginPrint());
            }
        });
    }

    @JavascriptInterface
    public JSPromise endPrinterJob() {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.6
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                return Boolean.valueOf(WebAppInterface.this.m_printer.endPrint());
            }
        });
    }

    @JavascriptInterface
    public JSPromise print(final String str, final String str2, final String str3) {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.7
            /* JADX WARN: Failed to restore switch over string. Please report as a decompilation issue */
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                JSONObject jSONObject;
                Bitmap bitmapDecodeResource = null;
                try {
                    jSONObject = new JSONObject(str3);
                } catch (JSONException unused) {
                    jSONObject = null;
                }
                if (str.equals("text")) {
                    return Boolean.valueOf(WebAppInterface.this.m_printer.text(str2, jSONObject.optString("charset", "US-ASCII"), jSONObject.optInt("codepage", 0), jSONObject.optInt("width", 0), jSONObject.optInt("height", 0), jSONObject.optInt("font", 0), jSONObject.optBoolean("bold", false), jSONObject.optBoolean("underline", false)));
                }
                if (str.equals("image")) {
                    int iOptInt = jSONObject.optInt("width", 0);
                    int iOptInt2 = jSONObject.optInt("padding", 0);
                    boolean zOptBoolean = jSONObject.optBoolean("centered", false);
                    String str4 = str2;
                    if (str4 == null || str4.isEmpty()) {
                        return false;
                    }
                    String str5 = str2;
                    char c = 65535;
                    switch (str5.hashCode()) {
                        case -1279982965:
                            if (str5.equals("preorder")) {
                                c = 0;
                                break;
                            }
                            break;
                        case -1252809906:
                            if (str5.equals("preorder-fr")) {
                                c = 1;
                                break;
                            }
                            break;
                        case -467366669:
                            if (str5.equals("preorder-fr-informal")) {
                                c = 3;
                                break;
                            }
                            break;
                        case -111279530:
                            if (str5.equals("preorder-informal")) {
                                c = 2;
                                break;
                            }
                            break;
                    }
                    if (c == 0) {
                        bitmapDecodeResource = BitmapFactory.decodeResource(WebAppInterface.this.m_context.getResources(), R.raw.preorder);
                    } else if (c == 1) {
                        bitmapDecodeResource = BitmapFactory.decodeResource(WebAppInterface.this.m_context.getResources(), R.raw.preorder_fr);
                    } else if (c == 2) {
                        bitmapDecodeResource = BitmapFactory.decodeResource(WebAppInterface.this.m_context.getResources(), R.raw.preorder_informal);
                    } else if (c == 3) {
                        bitmapDecodeResource = BitmapFactory.decodeResource(WebAppInterface.this.m_context.getResources(), R.raw.preorder_fr_informal);
                    }
                    if (bitmapDecodeResource == null) {
                        Log.d(WebAppInterface.this.TAG, "Failed to load image.");
                        return false;
                    }
                    if (iOptInt > 0 && zOptBoolean) {
                        iOptInt2 = (int) Math.floor((384 - iOptInt) / 2);
                    }
                    return Boolean.valueOf(WebAppInterface.this.m_printer.printBitmap(bitmapDecodeResource, iOptInt, iOptInt2));
                }
                return false;
            }
        });
    }

    @JavascriptInterface
    public JSPromise asyncTest() {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.8
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                Thread.sleep(2000L);
                return true;
            }
        });
    }

    @JavascriptInterface
    public void setWifiState(boolean z) {
        ((WifiManager) this.m_context.getApplicationContext().getSystemService("wifi")).setWifiEnabled(z);
    }

    @JavascriptInterface
    public String getWifiStatus() throws JSONException {
        WifiManager wifiManager = (WifiManager) this.m_context.getApplicationContext().getSystemService("wifi");
        try {
            JSONObject jSONObject = new JSONObject();
            WifiInfo connectionInfo = wifiManager.getConnectionInfo();
            jSONObject.put("SSID", connectionInfo.getSSID());
            jSONObject.put("BSSID", connectionInfo.getBSSID());
            jSONObject.put("freq", connectionInfo.getFrequency());
            jSONObject.put("ip", connectionInfo.getIpAddress());
            jSONObject.put("mac", connectionInfo.getMacAddress());
            jSONObject.put("network", connectionInfo.getNetworkId());
            jSONObject.put("speed", connectionInfo.getLinkSpeed());
            jSONObject.put("level", connectionInfo.getRssi());
            JSONObject jSONObject2 = new JSONObject();
            jSONObject2.put("enabled", wifiManager.isWifiEnabled());
            jSONObject2.put("conn", jSONObject);
            JSONArray jSONArray = new JSONArray();
            for (ScanResult scanResult : wifiManager.getScanResults()) {
                JSONObject jSONObject3 = new JSONObject();
                jSONObject3.put("SSID", scanResult.SSID);
                jSONObject3.put("BSSID", scanResult.BSSID);
                jSONObject3.put("freq", scanResult.frequency);
                if (Build.VERSION.SDK_INT >= 23) {
                    jSONObject3.put("width", getChannelWidth(scanResult.channelWidth));
                }
                jSONObject3.put("level", scanResult.level);
                jSONArray.put(jSONObject3);
            }
            jSONObject2.put("scan", jSONArray);
            return jSONObject2.toString();
        } catch (JSONException unused) {
            return BuildConfig.FLAVOR;
        }
    }

    @JavascriptInterface
    public JSPromise ping(final String str) {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.9
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                try {
                    Process processExec = Runtime.getRuntime().exec("/system/bin/ping -c 1 " + str);
                    if (processExec.waitFor() == 0) {
                        InputStream inputStream = processExec.getInputStream();
                        StringBuilder sb = new StringBuilder();
                        while (true) {
                            int i = inputStream.read();
                            if (i != -1) {
                                sb.append((char) i);
                            } else {
                                return sb.toString();
                            }
                        }
                    } else {
                        return false;
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                    return false;
                } catch (InterruptedException e2) {
                    e2.printStackTrace();
                    return false;
                }
            }
        });
    }

    @JavascriptInterface
    public JSPromise resolve(final String str) {
        return new JSPromise(this.m_context.m_wv, new Callable() { // from class: com.cojotech.commission.menu.restotool.WebAppInterface.10
            @Override // java.util.concurrent.Callable
            public Object call() throws Exception {
                try {
                    String string = InetAddress.getByName(str).toString();
                    return string.substring(string.indexOf(47) + 1);
                } catch (UnknownHostException unused) {
                    return BuildConfig.FLAVOR;
                }
            }
        });
    }

    @JavascriptInterface
    public void reload() {
        this.m_context.reload();
    }

    public void cancelAllNotifications() {
        NotificationManagerCompat.from(this.m_context).cancelAll();
    }

    public void stopNotificationSound() {
        NotificationCompat.Builder sound = new NotificationCompat.Builder(this.m_context, "0").setSmallIcon(R.drawable.ic_logo_transparent_m).setSound(Uri.parse(BuildConfig.FLAVOR));
        NotificationManagerCompat notificationManagerCompatFrom = NotificationManagerCompat.from(this.m_context);
        this.m_notification_id++;
        notificationManagerCompatFrom.notify(this.m_notification_id, sound.build());
        cancelNotification(this.m_notification_id);
    }

    public File getUpdateFileLocation(boolean z) {
        File file = new File(Environment.getExternalStorageDirectory() + "/restotool");
        file.mkdirs();
        File file2 = new File(file, "update.apk");
        if (z && file2.exists()) {
            file2.delete();
        }
        return file2;
    }

    public static void setTimeout(final Runnable runnable, final int i) {
        new Thread(new Runnable() { // from class: com.cojotech.commission.menu.restotool.-$$Lambda$WebAppInterface$0NEEa1_JUNzDP1XwBqFXcKPX7xE
            @Override // java.lang.Runnable
            public final void run() throws InterruptedException {
                WebAppInterface.lambda$setTimeout$0(i, runnable);
            }
        }).start();
    }

    static /* synthetic */ void lambda$setTimeout$0(int i, Runnable runnable) throws InterruptedException {
        try {
            Thread.sleep(i);
            runnable.run();
        } catch (Exception e) {
            System.err.println(e);
        }
    }
}
