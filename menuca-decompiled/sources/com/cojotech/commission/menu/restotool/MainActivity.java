package com.cojotech.commission.menu.restotool;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothProfile;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.cojotech.commission.menu.restotool.Printer;
import java.util.Iterator;
import java.util.List;

/* loaded from: classes.dex */
public class MainActivity extends AppCompatActivity {
    public static final String APP_PATH = "https://tablet.menu.ca/app.php";
    public static final String DBG_APP_PATH = "https://tablet.menu.ca/app.php";
    public static final String NOTIFICATION_ID = "com.cojotech.commission.menu.restotool.notification_id";
    public static final String RLS_APP_PATH = "https://tablet.menu.ca/app.php";
    private Button m_btn;
    Uri m_default_ringtone;
    private View m_dlg_view;
    SharedPreferences m_preferences;
    Printer m_printer;
    Uri m_ringtone;
    SharedPreferences m_secrets;
    private TextView m_tv;
    private WebAppInterface m_wai;
    public WebView m_wv;
    private PowerManager.WakeLock wakeLock;
    private static final String TAG = MainActivity.class.getName();
    public static final String DISMISSED_NOTIFICATION = MainActivity.class.getSimpleName() + "::DismissedNotification";
    private boolean m_app_loaded = false;
    BluetoothAdapter m_bt_adapter = BluetoothAdapter.getDefaultAdapter();
    boolean m_ringtone_changed = false;
    private boolean m_error = false;

    @Override // androidx.appcompat.app.AppCompatActivity, androidx.fragment.app.FragmentActivity, androidx.core.app.ComponentActivity, android.app.Activity
    protected void onCreate(Bundle bundle) {
        super.onCreate(bundle);
        requestWindowFeature(1);
        setContentView(R.layout.activity_main);
        this.m_preferences = getSharedPreferences("settings", 0);
        this.m_secrets = getSharedPreferences("secrets", 0);
        this.m_default_ringtone = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.doublesonar);
        this.m_ringtone = Uri.parse(this.m_preferences.getString("ringtone", this.m_default_ringtone.toString()));
        getWindow().addFlags(1024);
        this.wakeLock = ((PowerManager) getSystemService("power")).newWakeLock(1, "RestoTool::WakelockTag");
        this.wakeLock.acquire();
        this.m_printer = new Printer(this);
        this.m_wv = new WebView(this);
        this.m_wv.getSettings().setJavaScriptEnabled(true);
        this.m_wai = new WebAppInterface(this);
        this.m_wv.addJavascriptInterface(this.m_wai, "Android");
        String cookie = CookieManager.getInstance().getCookie("https://tablet.menu.ca/app.php");
        if (cookie == null || cookie.isEmpty()) {
            CookieManager.getInstance().setCookie("https://tablet.menu.ca/app.php", this.m_secrets.getString("cookies", BuildConfig.FLAVOR));
        }
        CookieManager.getInstance().setAcceptThirdPartyCookies(this.m_wv, true);
        this.m_wv.getSettings().setAllowContentAccess(true);
        this.m_wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
        this.m_wai.getUpdateFileLocation(true);
        this.m_wv.getSettings().setUserAgentString("Mozilla/5.0 (Linux; Android 4.4.4; One Build/KTU84L.H4) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/28.0.0.20.16;]");
        this.m_dlg_view = findViewById(R.id.activity_main);
        this.m_tv = (TextView) findViewById(R.id.textView);
        this.m_btn = (Button) findViewById(R.id.button);
        this.m_btn.setOnClickListener(new View.OnClickListener() { // from class: com.cojotech.commission.menu.restotool.MainActivity.1
            @Override // android.view.View.OnClickListener
            public void onClick(View view) {
                MainActivity.this.m_btn.setVisibility(8);
                MainActivity.this.m_tv.setText("Retrying...");
                MainActivity.this.load();
            }
        });
        this.m_wv.setWebViewClient(new WebViewClient() { // from class: com.cojotech.commission.menu.restotool.MainActivity.2
            @Override // android.webkit.WebViewClient
            public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest webResourceRequest) {
                return webResourceRequest.toString().startsWith("https://tablet.menu.ca/app.php");
            }

            @Override // android.webkit.WebViewClient
            public void onPageFinished(WebView webView, String str) {
                if (MainActivity.this.m_app_loaded) {
                    return;
                }
                if (!MainActivity.this.m_error && !MainActivity.this.m_wv.getTitle().equals("Menu.ca Restaurant Tool")) {
                    Log.d(MainActivity.TAG, "Wrong title.");
                    MainActivity.this.m_error = true;
                }
                if (!MainActivity.this.m_error) {
                    Log.d(MainActivity.TAG, "App loaded.");
                    MainActivity.this.m_wv.clearHistory();
                    MainActivity mainActivity = MainActivity.this;
                    mainActivity.setContentView(mainActivity.m_wv);
                    MainActivity.this.m_app_loaded = true;
                    CookieManager.getInstance().flush();
                    SharedPreferences.Editor editorEdit = MainActivity.this.m_secrets.edit();
                    editorEdit.putString("cookies", CookieManager.getInstance().getCookie("https://tablet.menu.ca/app.php"));
                    editorEdit.commit();
                    return;
                }
                MainActivity.this.m_tv.setText("Failed to connect to the server.\n Please check your connection and try again.");
                MainActivity.this.m_btn.setVisibility(0);
            }

            @Override // android.webkit.WebViewClient
            public void onReceivedError(WebView webView, int i, String str, String str2) {
                Log.d(MainActivity.TAG, "Error: " + Integer.toString(i) + " " + str + " " + str2);
                MainActivity.this.m_error = true;
            }

            @Override // android.webkit.WebViewClient
            public WebResourceResponse shouldInterceptRequest(WebView webView, WebResourceRequest webResourceRequest) {
                if (webResourceRequest.getUrl() != null && webResourceRequest.getUrl().toString().startsWith("https://android_res/raw/")) {
                    String lastPathSegment = webResourceRequest.getUrl().getLastPathSegment();
                    if (lastPathSegment.indexOf(".") > 0) {
                        lastPathSegment = lastPathSegment.substring(0, lastPathSegment.indexOf("."));
                    }
                    int identifier = MainActivity.this.getResources().getIdentifier(lastPathSegment, "raw", MainActivity.this.getPackageName());
                    if (identifier != 0) {
                        return new WebResourceResponse("application/octet-stream", "UTF8", MainActivity.this.getResources().openRawResource(identifier));
                    }
                }
                return super.shouldInterceptRequest(webView, webResourceRequest);
            }
        });
        registerReceiver(new BroadcastReceiver() { // from class: com.cojotech.commission.menu.restotool.MainActivity.3
            @Override // android.content.BroadcastReceiver
            public void onReceive(Context context, Intent intent) {
                MainActivity.this.sendUnnotify(intent.getExtras().getInt(MainActivity.NOTIFICATION_ID));
            }
        }, new IntentFilter(DISMISSED_NOTIFICATION));
        new BluetoothProfile.ServiceListener() { // from class: com.cojotech.commission.menu.restotool.MainActivity.4
            @Override // android.bluetooth.BluetoothProfile.ServiceListener
            public void onServiceDisconnected(int i) {
            }

            @Override // android.bluetooth.BluetoothProfile.ServiceListener
            public void onServiceConnected(int i, BluetoothProfile bluetoothProfile) {
                if (MainActivity.this.m_printer.hasPrinter()) {
                    List<BluetoothDevice> connectedDevices = bluetoothProfile.getConnectedDevices();
                    Printer.PrinterInfo printerInfo = MainActivity.this.m_printer.getPrinterInfo();
                    Iterator<BluetoothDevice> it = connectedDevices.iterator();
                    while (it.hasNext()) {
                        if (it.next().getAddress().equals(printerInfo.address)) {
                            MainActivity.this.notifyBTChange(true);
                        }
                    }
                }
            }
        };
        if (Build.VERSION.SDK_INT >= 23) {
            if (checkSelfPermission("android.permission.WRITE_EXTERNAL_STORAGE") != 0) {
                requestPermissions(new String[]{"android.permission.WRITE_EXTERNAL_STORAGE"}, 0);
            }
            if (checkSelfPermission("android.permission.ACCESS_FINE_LOCATION") != 0) {
                requestPermissions(new String[]{"android.permission.ACCESS_FINE_LOCATION"}, 0);
            }
            if (checkSelfPermission("android.permission.ACCESS_WIFI_STATE") != 0) {
                requestPermissions(new String[]{"android.permission.ACCESS_WIFI_STATE"}, 0);
            }
            if (checkSelfPermission("android.permission.CHANGE_WIFI_STATE") != 0) {
                requestPermissions(new String[]{"android.permission.CHANGE_WIFI_STATE"}, 0);
            }
        }
        load();
    }

    @Override // androidx.appcompat.app.AppCompatActivity, androidx.fragment.app.FragmentActivity, android.app.Activity
    protected void onDestroy() {
        this.wakeLock.release();
        super.onDestroy();
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void load() {
        this.m_app_loaded = false;
        this.m_error = false;
        this.m_wv.clearCache(true);
        this.m_wv.clearHistory();
        this.m_wv.loadUrl("https://tablet.menu.ca/app.php");
    }

    public void reload() {
        runOnUiThread(new Runnable() { // from class: com.cojotech.commission.menu.restotool.MainActivity.5
            @Override // java.lang.Runnable
            public void run() {
                MainActivity.this.m_btn.setVisibility(8);
                MainActivity.this.m_tv.setText("Reloading...");
                MainActivity mainActivity = MainActivity.this;
                mainActivity.setContentView(mainActivity.m_dlg_view);
                MainActivity.this.load();
            }
        });
    }

    public void changeRingtone() {
        Intent intent = new Intent("android.intent.action.RINGTONE_PICKER");
        intent.putExtra("android.intent.extra.ringtone.EXISTING_URI", this.m_ringtone);
        intent.putExtra("android.intent.extra.ringtone.DEFAULT_URI", this.m_default_ringtone);
        startActivityForResult(intent, 1);
    }

    @Override // androidx.fragment.app.FragmentActivity, android.app.Activity
    public void onActivityResult(int i, int i2, Intent intent) {
        if (i == 1 && i2 == -1) {
            setRingtone(intent.getParcelableExtra("android.intent.extra.ringtone.PICKED_URI").toString());
        }
    }

    public void setRingtone(String str) {
        if (this.m_ringtone.toString().equals(str)) {
            return;
        }
        this.m_ringtone = Uri.parse(str);
        SharedPreferences.Editor editorEdit = this.m_preferences.edit();
        editorEdit.putString("ringtone", str);
        editorEdit.commit();
        this.m_ringtone_changed = true;
        this.m_wv.evaluateJavascript("app.onRingtoneChange()", null);
    }

    @Override // androidx.fragment.app.FragmentActivity, android.app.Activity
    public void onBackPressed() {
        this.m_wv.evaluateJavascript("app.back()", null);
    }

    @Override // android.app.Activity
    public void onUserInteraction() {
        stopNotificationSound();
    }

    @Override // androidx.fragment.app.FragmentActivity, android.app.Activity
    public void onResume() {
        super.onResume();
        stopNotificationSound();
    }

    private void stopNotificationSound() {
        this.m_wai.stopNotificationSound();
        sendUnnotify(-1);
    }

    public void sendUnnotify(int i) {
        this.m_wv.evaluateJavascript("app.onUnnotify(" + Integer.toString(i) + ")", null);
    }

    public void notifyBTChange(final boolean z) {
        WebView webView = this.m_wv;
        if (webView == null) {
            return;
        }
        webView.post(new Runnable() { // from class: com.cojotech.commission.menu.restotool.MainActivity.6
            @Override // java.lang.Runnable
            public void run() {
                WebView webView2 = MainActivity.this.m_wv;
                StringBuilder sb = new StringBuilder();
                sb.append("pq.onNotify(");
                sb.append(z ? "true" : "false");
                sb.append(")");
                webView2.evaluateJavascript(sb.toString(), null);
            }
        });
    }
}
