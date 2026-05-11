package com.maudio.online;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

public class MaudioPlaybackNotificationService extends Service {
    static final int NOTIFICATION_ID = 7824;
    static final String CHANNEL_ID = "maudio_playback";
    static final String ACTION_SHOW = "com.maudio.online.PLAYBACK_SHOW";
    static final String ACTION_PLAY = "music-controls-play";
    static final String ACTION_PAUSE = "music-controls-pause";
    static final String ACTION_PREVIOUS = "music-controls-previous";
    static final String ACTION_NEXT = "music-controls-next";
    static final String ACTION_DESTROY = "music-controls-destroy";

    private static final String TAG = "MAUDIOPlaybackSvc";
    private static final String EXTRA_TRACK = "track";
    private static final String EXTRA_ARTIST = "artist";
    private static final String EXTRA_ALBUM = "album";
    private static final String EXTRA_DURATION = "duration";
    private static final String EXTRA_ELAPSED = "elapsed";
    private static final String EXTRA_PLAYING = "isPlaying";

    private MediaSession mediaSession;
    private String track = "MAUDIO";
    private String artist = "Now playing";
    private String album = "";
    private double duration = 0;
    private double elapsed = 0;
    private boolean isPlaying = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        mediaSession = new MediaSession(this, "MAUDIO playback");
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setActive(true);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : ACTION_SHOW;
        if (isControlAction(action)) {
            MaudioPlaybackNotificationPlugin.handleNotificationAction(action);
            if (ACTION_DESTROY.equals(action)) {
                stopForegroundService();
                return START_NOT_STICKY;
            }
            if (ACTION_PLAY.equals(action)) isPlaying = true;
            if (ACTION_PAUSE.equals(action)) isPlaying = false;
            showForegroundNotification();
            return START_STICKY;
        }

        readExtras(intent);
        showForegroundNotification();
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }

    private void readExtras(Intent intent) {
        if (intent == null) return;
        track = intent.getStringExtra(EXTRA_TRACK) != null ? intent.getStringExtra(EXTRA_TRACK) : track;
        artist = intent.getStringExtra(EXTRA_ARTIST) != null ? intent.getStringExtra(EXTRA_ARTIST) : artist;
        album = intent.getStringExtra(EXTRA_ALBUM) != null ? intent.getStringExtra(EXTRA_ALBUM) : album;
        duration = intent.getDoubleExtra(EXTRA_DURATION, duration);
        elapsed = intent.getDoubleExtra(EXTRA_ELAPSED, elapsed);
        isPlaying = intent.getBooleanExtra(EXTRA_PLAYING, isPlaying);
    }

    private void showForegroundNotification() {
        updateMediaSession();
        Notification notification = buildNotification();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (SecurityException e) {
            Log.w(TAG, "Android refused playback notification permission", e);
            stopSelf();
        } catch (Exception e) {
            Log.w(TAG, "Unable to start playback foreground service", e);
            stopSelf();
        }
    }

    private Notification buildNotification() {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setAction(Intent.ACTION_MAIN);
        openIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, openIntent, pendingFlags());

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);

        return builder
                .setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle(track)
                .setContentText(artist)
                .setSubText(album)
                .setContentIntent(contentIntent)
                .setDeleteIntent(controlIntent(ACTION_DESTROY))
                .setCategory(Notification.CATEGORY_TRANSPORT)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setPriority(Notification.PRIORITY_LOW)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setOngoing(isPlaying)
                .addAction(android.R.drawable.ic_media_previous, "Previous", controlIntent(ACTION_PREVIOUS))
                .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Pause" : "Play", controlIntent(isPlaying ? ACTION_PAUSE : ACTION_PLAY))
                .addAction(android.R.drawable.ic_media_next, "Next", controlIntent(ACTION_NEXT))
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Close", controlIntent(ACTION_DESTROY))
                .setStyle(new Notification.MediaStyle().setShowActionsInCompactView(0, 1, 2).setMediaSession(mediaSession.getSessionToken()))
                .build();
    }

    private PendingIntent controlIntent(String action) {
        Intent intent = new Intent(this, MaudioPlaybackNotificationService.class).setAction(action);
        return PendingIntent.getService(this, action.hashCode(), intent, pendingFlags());
    }

    private int pendingFlags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
    }

    private void updateMediaSession() {
        if (mediaSession == null) return;
        long durationMs = Math.max(0, Math.round(duration * 1000));
        long elapsedMs = Math.max(0, Math.round(elapsed * 1000));
        MediaMetadata.Builder metadata = new MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, track)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, artist)
                .putString(MediaMetadata.METADATA_KEY_ALBUM, album);
        if (durationMs > 0) metadata.putLong(MediaMetadata.METADATA_KEY_DURATION, durationMs);
        mediaSession.setMetadata(metadata.build());
        mediaSession.setPlaybackState(new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_STOP | PlaybackState.ACTION_SEEK_TO)
                .setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, elapsedMs, 1.0f)
                .build());
        mediaSession.setActive(true);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "MAUDIO playback", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Playback controls");
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.createNotificationChannel(channel);
    }

    private boolean isControlAction(String action) {
        return ACTION_PLAY.equals(action) || ACTION_PAUSE.equals(action) || ACTION_PREVIOUS.equals(action) || ACTION_NEXT.equals(action) || ACTION_DESTROY.equals(action);
    }

    private void stopForegroundService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    static Intent createIntent(Context context, com.getcapacitor.JSObject info, boolean playing) {
        Intent intent = new Intent(context, MaudioPlaybackNotificationService.class).setAction(ACTION_SHOW);
        intent.putExtra(EXTRA_TRACK, info.getString("track", "MAUDIO"));
        intent.putExtra(EXTRA_ARTIST, info.getString("artist", "Now playing"));
        intent.putExtra(EXTRA_ALBUM, info.getString("album", ""));
        intent.putExtra(EXTRA_DURATION, info.optDouble("duration", 0.0));
        intent.putExtra(EXTRA_ELAPSED, info.optDouble("elapsed", 0.0));
        intent.putExtra(EXTRA_PLAYING, playing);
        return intent;
    }
}