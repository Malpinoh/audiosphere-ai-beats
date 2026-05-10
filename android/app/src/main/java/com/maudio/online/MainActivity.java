package com.maudio.online;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(MaudioPlaybackNotificationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
