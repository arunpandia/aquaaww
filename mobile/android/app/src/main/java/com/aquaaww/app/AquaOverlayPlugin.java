package com.aquaaww.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;
import android.util.Base64;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

import java.io.File;
import java.io.FileOutputStream;

@CapacitorPlugin(name = "AquaOverlay")
public class AquaOverlayPlugin extends Plugin {

    @PluginMethod
    public void status(PluginCall call) {
        Context c = getContext();
        SharedPreferences p = OverlayService.prefs(c);
        JSObject o = new JSObject();
        o.put("canDraw", OverlayService.canDraw(c));
        o.put("enabled", p.getBoolean("enabled", false));
        o.put("nextAt", p.getLong("nextAt", 0));
        o.put("todayCount", p.getInt("count_" + OverlayService.today(), 0));
        o.put("corner", p.getString("corner", "bottom-right"));
        o.put("customAt", p.getLong("customAt", 0));
        call.resolve(o);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    /** Opens this app's notification settings (used when notifications were turned off and Android will not ask again). */
    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Context c = getContext();
        try {
            Intent i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
            call.resolve();
        } catch (Exception ex) {
            call.reject(ex.getMessage());
        }
    }

    @PluginMethod
    public void configure(PluginCall call) {
        Context c = getContext();
        SharedPreferences p = OverlayService.prefs(c);
        boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        SharedPreferences.Editor e = p.edit();
        e.putBoolean("enabled", enabled);
        e.putInt("interval", call.getInt("interval", 45));
        e.putInt("snooze", call.getInt("snooze", 15));
        e.putString("from", call.getString("from", "09:00"));
        e.putString("to", call.getString("to", "21:00"));
        e.putBoolean("paused", Boolean.TRUE.equals(call.getBoolean("paused", false)));
        e.putString("src", call.getString("src", ""));
        e.putBoolean("keyed", !Boolean.FALSE.equals(call.getBoolean("keyed", true)));
        e.putString("mode", call.getString("mode", "white"));
        e.putBoolean("pass", Boolean.TRUE.equals(call.getBoolean("pass", false)));
        e.putBoolean("notify", !Boolean.FALSE.equals(call.getBoolean("notify", true)));
        e.putString("corner", call.getString("corner", "bottom-right"));
        e.apply();
        try {
            if (enabled) {
                boolean resched = Boolean.TRUE.equals(call.getBoolean("reschedule", false));
                ContextCompat.startForegroundService(c, new Intent(c, OverlayService.class)
                        .setAction(resched ? OverlayService.ACTION_RESCHEDULE : OverlayService.ACTION_START));
            } else {
                c.stopService(new Intent(c, OverlayService.class));
            }
            call.resolve();
        } catch (Exception ex) {
            call.reject("Could not start the floating buddy: " + ex.getMessage());
        }
    }

    @PluginMethod
    public void testIn(PluginCall call) {
        Context c = getContext();
        try {
            ContextCompat.startForegroundService(c, new Intent(c, OverlayService.class)
                    .setAction(OverlayService.ACTION_TEST).putExtra("seconds", call.getInt("seconds", 30)));
            call.resolve();
        } catch (Exception ex) {
            call.reject(ex.getMessage());
        }
    }

    @PluginMethod
    public void editPosition(PluginCall call) {
        Context c = getContext();
        try {
            ContextCompat.startForegroundService(c, new Intent(c, OverlayService.class).setAction(OverlayService.ACTION_EDIT));
            call.resolve();
        } catch (Exception ex) {
            call.reject(ex.getMessage());
        }
    }

    @PluginMethod
    public void showNow(PluginCall call) {
        Context c = getContext();
        try {
            ContextCompat.startForegroundService(c, new Intent(c, OverlayService.class).setAction(OverlayService.ACTION_SHOW));
            call.resolve();
        } catch (Exception ex) {
            call.reject(ex.getMessage());
        }
    }

    /** Writes an uploaded video to app storage in chunks so the overlay (a separate WebView) can play it. */
    @PluginMethod
    public void saveVideoChunk(PluginCall call) {
        try {
            String name = call.getString("name", "buddy.mp4");
            boolean append = Boolean.TRUE.equals(call.getBoolean("append", false));
            byte[] bytes = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
            File f = new File(getContext().getFilesDir(), name);
            try (FileOutputStream out = new FileOutputStream(f, append)) { out.write(bytes); }
            JSObject o = new JSObject();
            o.put("path", f.getAbsolutePath());
            call.resolve(o);
        } catch (Exception ex) {
            call.reject("Could not save video: " + ex.getMessage());
        }
    }

    @PluginMethod
    public void cleanupVideos(PluginCall call) {
        String keep = call.getString("keep", "");
        File[] files = getContext().getFilesDir().listFiles();
        if (files != null) for (File f : files) if (f.getName().startsWith("buddy-") && !f.getName().equals(keep)) f.delete();
        call.resolve();
    }
}
