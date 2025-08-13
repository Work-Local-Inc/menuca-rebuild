package com.cojotech.commission.menu.restotool;

import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.text.Html;
import android.text.SpannableString;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import androidx.core.internal.view.SupportMenu;
import java.io.File;

/* loaded from: classes.dex */
public class WebAppInterface {
    NotificationChannel m_channel;
    MainActivity m_context;
    WebAppInterface self = this;
    int m_notification_id = 0;

    @JavascriptInterface
    public int version() {
        return 1;
    }

    WebAppInterface(MainActivity mainActivity) {
        this.m_context = mainActivity;
    }

    @JavascriptInterface
    public void showToast(String str) {
        Toast.makeText(this.m_context, str, 0).show();
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
        Notification notificationBuild = new NotificationCompat.Builder(this.m_context, "0").setSmallIcon(R.drawable.ic_logo_transparent_m).setContentTitle(str).setContentText(spannableString).setContentIntent(activity).setDeleteIntent(broadcast).setPriority(1).setVisibility(1).setAutoCancel(z).setSound(this.m_context.m_ringtone).setLights(SupportMenu.CATEGORY_MASK, 1000, 500).build();
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
        if (this.m_channel != null || Build.VERSION.SDK_INT <= 26) {
            return;
        }
        this.m_channel = new NotificationChannel("0", "RestoTool", 4);
        this.m_channel.enableVibration(true);
        this.m_channel.setLockscreenVisibility(1);
        this.m_channel.setImportance(4);
        this.m_channel.setBypassDnd(true);
        this.m_channel.enableLights(true);
        ((NotificationManager) this.m_context.getSystemService(NotificationManager.class)).createNotificationChannel(this.m_channel);
        cancelAllNotifications();
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
    public int getRingtoneDuration() throws SecurityException, IllegalArgumentException {
        MediaMetadataRetriever mediaMetadataRetriever = new MediaMetadataRetriever();
        mediaMetadataRetriever.setDataSource(this.m_context.getApplicationContext(), this.m_context.m_ringtone);
        return Integer.parseInt(mediaMetadataRetriever.extractMetadata(9));
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
