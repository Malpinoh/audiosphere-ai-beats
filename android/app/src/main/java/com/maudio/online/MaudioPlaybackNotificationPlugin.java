package com.maudio.online;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "MaudioPlaybackNotification")
public class MaudioPlaybackNotificationPlugin extends Plugin {
    private static final String TAG = "MAUDIOPlayback";
    private static final int NOTIFICATION_ID = 7824;
    private static final String CHANNEL_ID = "maudio_playback";
    private static final String ACTION_PLAY = "music-controls-play";
    private static final String ACTION_PAUSE = "music-controls-pause";
    private static final String ACTION_PREVIOUS = "music-controls-previous";
    private static final String ACTION_NEXT = "music-controls-next";
    private static final String ACTION_DESTROY = "music-controls-destroy";
    private static MaudioPlaybackNotificationPlugin instance;

    private MediaSession mediaSession;
    private JSObject lastInfo;
    private boolean isPlaying;

    @Override
    public void load() {
        instance = this;
        createNotificationChannel();
        mediaSession = new MediaSession(getContext(), "MAUDIO playback");
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setActive(true);
    }

    @PluginMethod
    public void create(PluginCall call) {
        lastInfo = call.getData();
        isPlaying = lastInfo.getBoolean("isPlaying", false);
        showNotification();
        call.resolve();
    }

    @PluginMethod
    public void updateIsPlaying(PluginCall call) {
        isPlaying = call.getBoolean("isPlaying", isPlaying);
        if (lastInfo != null) {
            lastInfo.put("isPlaying", isPlaying);
            showNotification();
        }
        call.resolve();
    }

    @PluginMethod
    public void updateElapsed(PluginCall call) {
        if (lastInfo != null) {
            lastInfo.put("elapsed", call.getDouble("elapsed", 0.0));
            isPlaying = call.getBoolean("isPlaying", isPlaying);
        }
        call.resolve();
    }

    @PluginMethod
    public void destroy(PluginCall call) {
        getNotificationManager().cancel(NOTIFICATION_ID);
        call.resolve();
    }

    static void handleNotificationAction(String action) {
        if (instance == null) return;
        JSObject event = new JSObject();
        event.put("message", action);
        instance.notifyListeners("controlsNotification", event);
        instance.bridge.triggerJSEvent("controlsNotification", "document", event.toString());
        if (ACTION_DESTROY.equals(action)) {
            instance.getNotificationManager().cancel(NOTIFICATION_ID);
        }
    }

    private void showNotification() {
        if (lastInfo == null) return;
        Context context = getContext();
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setAction(Intent.ACTION_MAIN);
        openIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        PendingIntent contentIntent = PendingIntent.getActivity(context, 0, openIntent, pendingFlags());

        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(context, CHANNEL_ID)
                : new Notification.Builder(context);
        Bitmap cover = loadCover(lastInfo.getString("cover", ""));
        updateMediaSession(cover);

        builder
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle(lastInfo.getString("track", "MAUDIO"))
                .setContentText(lastInfo.getString("artist", "Now playing"))
                .setContentIntent(contentIntent)
                .setDeleteIntent(actionIntent(ACTION_DESTROY))
                .setCategory(Notification.CATEGORY_TRANSPORT)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setPriority(Notification.PRIORITY_LOW)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setOngoing(isPlaying)
                .addAction(android.R.drawable.ic_media_previous, "Previous", actionIntent(ACTION_PREVIOUS))
                .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Pause" : "Play", actionIntent(isPlaying ? ACTION_PAUSE : ACTION_PLAY))
                .addAction(android.R.drawable.ic_media_next, "Next", actionIntent(ACTION_NEXT))
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close", actionIntent(ACTION_DESTROY))
                .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(0, 1, 2).setMediaSession(mediaSession.getSessionToken()));

        if (cover != null) builder.setLargeIcon(cover);
        Notification notification = builder.build();
        try {
            getNotificationManager().notify(NOTIFICATION_ID, notification);
        } catch (SecurityException e) {
            Log.w(TAG, "Notification permission denied by Android", e);
        } catch (Exception e) {
            Log.w(TAG, "Unable to show playback notification", e);
        }
    }

    private void updateMediaSession(Bitmap cover) {
        if (mediaSession == null || lastInfo == null) return;
        long durationMs = Math.max(0, Math.round(lastInfo.optDouble("duration", 0.0) * 1000));
        long elapsedMs = Math.max(0, Math.round(lastInfo.optDouble("elapsed", 0.0) * 1000));
        MediaMetadata.Builder metadata = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, lastInfo.getString("track", "MAUDIO"))
                .putString(MediaMetadata.METADATA_KEY_ARTIST, lastInfo.getString("artist", "Now playing"))
                .putString(MediaMetadata.METADATA_KEY_ALBUM, lastInfo.getString("album", ""));
        if (durationMs > 0) metadata.putLong(MediaMetadata.METADATA_KEY_DURATION, durationMs);
        if (cover != null) metadata.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, cover);
        mediaSession.setMetadata(metadata.build());

        long actions = PlaybackState.ACTION_PLAY
                | PlaybackState.ACTION_PAUSE
                | PlaybackState.ACTION_PLAY_PAUSE
                | PlaybackState.ACTION_SKIP_TO_PREVIOUS
                | PlaybackState.ACTION_SKIP_TO_NEXT
                | PlaybackState.ACTION_STOP
                | PlaybackState.ACTION_SEEK_TO;
        mediaSession.setPlaybackState(new PlaybackState.Builder()
                .setActions(actions)
                .setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, elapsedMs, 1.0f)
                .build());
        mediaSession.setActive(true);
    }

    private PendingIntent actionIntent(String action) {
        Intent intent = new Intent(getContext(), MaudioPlaybackNotificationReceiver.class).setAction(action);
        return PendingIntent.getBroadcast(getContext(), action.hashCode(), intent, pendingFlags());
    }

    private int pendingFlags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "MAUDIO playback", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Playback controls");
        NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        manager.createNotificationChannel(channel);
    }

    private NotificationManager getNotificationManager() {
        return (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private Bitmap loadCover(String coverUrl) {
        if (coverUrl == null || coverUrl.isEmpty() || !coverUrl.startsWith("http")) return null;
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(coverUrl).openConnection();
            connection.setConnectTimeout(2500);
            connection.setReadTimeout(2500);
            InputStream input = connection.getInputStream();
            return BitmapFactory.decodeStream(input);
        } catch (Exception ignored) {
            return null;
        }
    }
}