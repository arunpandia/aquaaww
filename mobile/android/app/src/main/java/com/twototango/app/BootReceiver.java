package com.twototango.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import androidx.core.content.ContextCompat;

/** Restarts the floating buddy after the phone reboots (if it was switched on). */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;
        if (!OverlayService.prefs(context).getBoolean("enabled", false)) return;
        try {
            ContextCompat.startForegroundService(context, new Intent(context, OverlayService.class).setAction(OverlayService.ACTION_START));
        } catch (Exception ignored) { }
    }
}
