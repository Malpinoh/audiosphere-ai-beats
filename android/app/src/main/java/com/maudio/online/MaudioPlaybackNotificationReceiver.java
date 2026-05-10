package com.maudio.online;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class MaudioPlaybackNotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;
        MaudioPlaybackNotificationPlugin.handleNotificationAction(intent.getAction());
    }
}