package com.twototango.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(TangoOverlayPlugin.class);   // our floating-buddy plugin
        super.onCreate(savedInstanceState);
    }
}
