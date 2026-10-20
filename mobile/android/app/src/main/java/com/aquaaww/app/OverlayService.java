package com.aquaaww.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.app.NotificationCompat;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Keeps the reminder clock and draws the buddy over other apps.
 * Two small overlay windows: the buddy video (NOT touchable, so touches fall through to the app below)
 * and the poster with the buttons (touchable only inside its own small rectangle).
 */
public class OverlayService extends Service {
    static final String ACTION_START = "wb.start", ACTION_RESCHEDULE = "wb.resched", ACTION_SHOW = "wb.show",
            ACTION_TICK = "wb.tick", ACTION_TEST = "wb.test", ACTION_EDIT = "wb.edit", ACTION_DRANK = "wb.drank", ACTION_LATER = "wb.later";
    private static final String CHANNEL = "wb_service";
    private static final int NOTIF_ID = 42;
    private static final String CHANNEL_ALERT = "wb_alert";
    private static final int ALERT_ID = 77;
    private static final long AUTO_HIDE_MS = 3 * 60 * 1000L;

    private final Handler h = new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private WebView posterView, buddyView;
    private WindowManager.LayoutParams posterLp, buddyLp;
    private boolean editing = false;
    private int posterH, buddyH, boxW;
    private final Runnable tickRunnable = this::onTick;
    private final Runnable autoHide = () -> { hideOverlay(); reschedule(interval()); };

    static SharedPreferences prefs(Context c) { return c.getSharedPreferences("wb_overlay", Context.MODE_PRIVATE); }
    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }
    static boolean canDraw(Context c) { return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(c); }

    private int interval() { return prefs(this).getInt("interval", 45); }
    private int snooze() { return prefs(this).getInt("snooze", 15); }
    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? ACTION_START : intent.getAction();
        goForeground();
        if (ACTION_RESCHEDULE.equals(action)) {
            hideOverlay();
            reschedule(interval());
        } else if (ACTION_SHOW.equals(action)) {
            showOverlay(false);
        } else if (ACTION_TICK.equals(action)) {
            onTick();
        } else if (ACTION_DRANK.equals(action)) {                // "I drank" button on the reminder notification
            onDrank();
        } else if (ACTION_LATER.equals(action)) {                // "Remind me later" button
            onLater();
        } else if (ACTION_EDIT.equals(action)) {                 // drag-to-place mode
            showOverlay(true);
        } else if (ACTION_TEST.equals(action)) {                 // "test in N seconds": bypasses pause and active hours once
            prefs(this).edit().putBoolean("force", true).apply();
            setNext(System.currentTimeMillis() + Math.max(1, intent.getIntExtra("seconds", 30)) * 1000L);
        } else {                                              // start / sticky restart: keep a still-valid schedule
            long next = prefs(this).getLong("nextAt", 0);
            if (next > System.currentTimeMillis()) setNext(next); else reschedule(interval());
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        hideOverlay();
        h.removeCallbacks(tickRunnable);
        cancelAlarm();
        super.onDestroy();
    }

    /* ---------------- schedule ---------------- */
    private static int mins(String s) { String[] p = s.split(":"); return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]); }

    private boolean inWindow(long t) {
        try {
            Calendar c = Calendar.getInstance(); c.setTimeInMillis(t);
            int m = c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
            int a = mins(prefs(this).getString("from", "09:00")), b = mins(prefs(this).getString("to", "21:00"));
            return a <= b ? (m >= a && m <= b) : (m >= a || m <= b);
        } catch (Exception e) { return true; }
    }

    private void reschedule(int minutes) {
        long t = System.currentTimeMillis() + minutes * 60000L;
        int guard = 0;
        while (!inWindow(t) && guard++ < 600) t += 5 * 60000L;   // skip ahead until the active window opens
        setNext(t);
    }

    private void setNext(long t) {
        prefs(this).edit().putLong("nextAt", t).apply();
        h.removeCallbacks(tickRunnable);
        h.postDelayed(tickRunnable, Math.max(0, t - System.currentTimeMillis()));
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am != null) {
            try {
                if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, alarmIntent());
                else am.set(AlarmManager.RTC_WAKEUP, t, alarmIntent());
            } catch (Exception ignored) { }
        }
        updateNotification();
    }

    private PendingIntent alarmIntent() {
        Intent i = new Intent(this, OverlayService.class).setAction(ACTION_TICK);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return Build.VERSION.SDK_INT >= 26 ? PendingIntent.getForegroundService(this, 1, i, fl) : PendingIntent.getService(this, 1, i, fl);
    }

    private void cancelAlarm() {
        AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
        if (am != null) { try { am.cancel(alarmIntent()); } catch (Exception ignored) { } }
    }

    private void onTick() {
        SharedPreferences p = prefs(this);
        long now = System.currentTimeMillis(), next = p.getLong("nextAt", 0);
        if (next > now + 3000) { h.removeCallbacks(tickRunnable); h.postDelayed(tickRunnable, next - now); return; }
        if (p.getBoolean("force", false)) { p.edit().remove("force").apply(); showOverlay(false); return; }
        if (p.getBoolean("paused", false) || !inWindow(now)) { reschedule(interval()); return; }
        showOverlay(false);
    }

    /* ---------------- overlay ---------------- */
    private WindowManager.LayoutParams params(int w, int hgt, int gravity, int x, int y, boolean touchable) {
        int type = Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        int fl = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED;
        if (!touchable) fl |= WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;     // touches pass straight through to Instagram etc.
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(w, hgt, type, fl, PixelFormat.TRANSLUCENT);
        lp.gravity = gravity; lp.x = x; lp.y = y;
        return lp;
    }

    private WebView makeWebView(boolean poster, boolean edit) {
        SharedPreferences p = prefs(this);
        WebView wv = new WebView(this);
        wv.setBackgroundColor(Color.TRANSPARENT);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        wv.addJavascriptInterface(new Bridge(), "WBNative");
        String url = "file:///android_asset/public/overlay.html?mode=" + (poster ? "poster" : "buddy")
                + "&keyed=" + (p.getBoolean("keyed", true) ? 1 : 0) + "&km=" + Uri.encode(p.getString("mode", p.getBoolean("keyed", true) ? "white" : "raw")) + "&snooze=" + snooze()
                + "&src=" + Uri.encode(p.getString("src", "")) + (edit ? "&edit=1" : "");
        wv.setTag(url);                                          // loaded after the window is attached, so the page sees a real size
        return wv;
    }

    private void showOverlay(boolean edit) {
        if (!edit) postReminderNotification();                  // a normal notification as well, so a reminder is never missed
        if (!canDraw(this)) {                                  // permission missing: keep the clock running, tell the user
            if (!edit) reschedule(interval());
            updateNotification();
            return;
        }
        hideOverlay();
        SharedPreferences p = prefs(this);
        String corner = p.getString("corner", "bottom-right");
        boolean bottom = corner.startsWith("bottom"), right = corner.endsWith("right");
        DisplayMetrics dm = getResources().getDisplayMetrics();
        int sw = dm.widthPixels, sh = dm.heightPixels;
        boxW = dp(200); buddyH = dp(200); posterH = dp(150);
        int m = dp(6);
        try {
            if (edit || ("custom".equals(corner) && p.contains("fx"))) {
                int px, py;
                if ("custom".equals(corner) && p.contains("fx")) {
                    px = Math.round(p.getFloat("fx", 0f) * sw); py = Math.round(p.getFloat("fy", 0f) * sh);
                } else {                                       // start the drag from wherever the chosen corner would put it
                    px = right ? sw - boxW - m : m;
                    py = bottom ? sh - buddyH - posterH - m - dp(48) : m + dp(32);
                }
                px = Math.max(0, Math.min(px, sw - boxW)); py = Math.max(0, Math.min(py, sh - buddyH - posterH));
                int g = Gravity.TOP | Gravity.START;
                buddyLp = params(boxW, buddyH, g, px, py + posterH, !p.getBoolean("pass", false));
                posterLp = params(boxW, posterH, g, px, py, true);
            } else {
                int g = (bottom ? Gravity.BOTTOM : Gravity.TOP) | (right ? Gravity.END : Gravity.START);
                buddyLp = params(boxW, buddyH, g, m, bottom ? m : m + posterH, !p.getBoolean("pass", false));
                posterLp = params(boxW, posterH, g, m, bottom ? m + buddyH : m, true);
            }
            buddyView = makeWebView(false, edit);
            posterView = makeWebView(true, edit);
            editing = edit;
            if (edit) attachDrag(sw, sh);
            wm.addView(buddyView, buddyLp);
            wm.addView(posterView, posterLp);
            buddyView.post(() -> { if (buddyView != null) buddyView.loadUrl((String) buddyView.getTag()); });
            posterView.post(() -> { if (posterView != null) posterView.loadUrl((String) posterView.getTag()); });
        } catch (Exception e) {
            hideOverlay();
            if (!edit) reschedule(interval());
            return;
        }
        h.removeCallbacks(autoHide);
        if (edit) return;                                       // no timers while the user is placing it
        h.postDelayed(autoHide, AUTO_HIDE_MS);                  // ignored for 3 min: tidy away, try again later
        // keep the clock moving so a missed reminder never stalls the schedule
        prefs(this).edit().putLong("nextAt", System.currentTimeMillis() + interval() * 60000L).apply();
    }

    /** Drag the poster to move both windows together; taps still reach the Save button. */
    private void attachDrag(final int sw, final int sh) {
        final float[] st = new float[4];                        // downX, downY, startX, startY
        final boolean[] dragging = {false};
        posterView.setOnTouchListener((v, e) -> {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    st[0] = e.getRawX(); st[1] = e.getRawY(); st[2] = posterLp.x; st[3] = posterLp.y; dragging[0] = false;
                    return false;
                case MotionEvent.ACTION_MOVE: {
                    float dx = e.getRawX() - st[0], dy = e.getRawY() - st[1];
                    if (!dragging[0] && Math.hypot(dx, dy) > dp(8)) dragging[0] = true;
                    if (!dragging[0]) return false;
                    int nx = Math.max(0, Math.min(Math.round(st[2] + dx), sw - boxW));
                    int ny = Math.max(0, Math.min(Math.round(st[3] + dy), sh - buddyH - posterH));
                    posterLp.x = nx; posterLp.y = ny; buddyLp.x = nx; buddyLp.y = ny + posterH;
                    try { wm.updateViewLayout(posterView, posterLp); wm.updateViewLayout(buddyView, buddyLp); } catch (Exception ignored) { }
                    return true;
                }
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL: {
                    boolean was = dragging[0]; dragging[0] = false;
                    return was;
                }
            }
            return false;
        });
    }

    private void onSavePos() {
        if (posterLp != null && editing) {
            DisplayMetrics dm = getResources().getDisplayMetrics();
            prefs(this).edit().putString("corner", "custom").putFloat("fx", posterLp.x / (float) dm.widthPixels)
                    .putFloat("fy", posterLp.y / (float) dm.heightPixels).putLong("customAt", System.currentTimeMillis()).apply();
        }
        hideOverlay();
        updateNotification();
    }

    private void hideOverlay() {
        h.removeCallbacks(autoHide);
        for (WebView v : new WebView[]{posterView, buddyView}) {
            if (v == null) continue;
            try { wm.removeView(v); } catch (Exception ignored) { }
            try { v.destroy(); } catch (Exception ignored) { }
        }
        posterView = null; buddyView = null; editing = false;
    }

    private void onDrank() {
        clearReminderNotification();
        hideOverlay();
        SharedPreferences p = prefs(this);
        String k = "count_" + today();
        p.edit().putInt(k, p.getInt(k, 0) + 1).apply();
        reschedule(interval());
    }

    private void onLater() {
        clearReminderNotification();
        hideOverlay();
        reschedule(snooze());
    }

    class Bridge {
        @JavascriptInterface public void drank() { h.post(OverlayService.this::onDrank); }
        @JavascriptInterface public void later() { h.post(OverlayService.this::onLater); }
        @JavascriptInterface public void savePos() { h.post(OverlayService.this::onSavePos); }
    }


    /* ---------------- reminder notification (with I drank / Remind me later) ---------------- */
    private PendingIntent svcIntent(String action, int req) {
        Intent i = new Intent(this, OverlayService.class).setAction(action);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return Build.VERSION.SDK_INT >= 26 ? PendingIntent.getForegroundService(this, req, i, fl) : PendingIntent.getService(this, req, i, fl);
    }

    private void postReminderNotification() {
        if (!prefs(this).getBoolean("notify", true)) return;
        try {
            PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
            Notification n = new NotificationCompat.Builder(this, CHANNEL_ALERT)
                    .setSmallIcon(R.drawable.ic_stat_drop)
                    .setContentTitle("Time to drink some water")
                    .setContentText("Tap to meet your buddy")
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_REMINDER)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setAutoCancel(true)
                    .setContentIntent(open)
                    .addAction(0, "I drank", svcIntent(ACTION_DRANK, 11))
                    .addAction(0, "Remind me later", svcIntent(ACTION_LATER, 12))
                    .build();
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(ALERT_ID, n);
        } catch (Exception ignored) { }
    }

    private void clearReminderNotification() {
        try { ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(ALERT_ID); } catch (Exception ignored) { }
    }

    /* ---------------- foreground notification ---------------- */
    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "AquaAww is running", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            nm.createNotificationChannel(ch);
            NotificationChannel alert = new NotificationChannel(CHANNEL_ALERT, "Water reminders", NotificationManager.IMPORTANCE_HIGH);
            alert.setDescription("Your drink-water reminders");
            alert.enableVibration(true);
            alert.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(alert);
        }
    }

    private Notification buildNotification() {
        SharedPreferences p = prefs(this);
        long next = p.getLong("nextAt", 0);
        String text = !canDraw(this) ? "Allow “Display over other apps” so your buddy can appear."
                : p.getBoolean("paused", false) ? "Paused"
                : next > 0 ? "Next reminder at " + new SimpleDateFormat("h:mm a", Locale.getDefault()).format(new Date(next)) : "Running";
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class),
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
        return new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_drop)
                .setContentTitle("AquaAww")
                .setContentText(text)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(open)
                .build();
    }

    private void goForeground() {
        try {
            Notification n = buildNotification();
            if (Build.VERSION.SDK_INT >= 34) startForeground(NOTIF_ID, n, 0x40000000 /* FOREGROUND_SERVICE_TYPE_SPECIAL_USE */);
            else startForeground(NOTIF_ID, n);
        } catch (Exception e) { /* the system refused (background start limits): keep running, the alarm will try again */ }
    }

    private void updateNotification() {
        try { ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIF_ID, buildNotification()); } catch (Exception ignored) { }
    }
}
