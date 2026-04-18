import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMusicPlayer } from "@/contexts/music-player";
import { useAudioPreferences } from "@/hooks/use-audio-preferences";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Map a 3-band UI (Bass/Mid/Treble) onto the 5-band engine
const BASS_INDICES = [0, 1];
const MID_INDICES = [2];
const TREBLE_INDICES = [3, 4];

const PRESETS_3BAND: Record<string, { bass: number; mid: number; treble: number }> = {
  Normal: { bass: 0, mid: 0, treble: 0 },
  "Bass Boost": { bass: 6, mid: 0, treble: -1 },
  "Treble Boost": { bass: -1, mid: 0, treble: 5 },
  Vocal: { bass: -1, mid: 4, treble: 2 },
  Dance: { bass: 4, mid: -1, treble: 4 },
  Flat: { bass: 0, mid: 0, treble: 0 },
};

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
const QUALITY_OPTIONS: Array<{ value: "auto" | "high" | "normal" | "low"; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "high", label: "High" },
  { value: "normal", label: "Medium" },
  { value: "low", label: "Low" },
];

export function PlaybackSettingsDrawer({ open, onOpenChange }: Props) {
  const {
    audioEngine, crossfadeEnabled, crossfadeDuration,
    setCrossfadeEnabled, setCrossfadeDuration,
    playbackRate, setPlaybackRate,
  } = useMusicPlayer();
  const { preferences, updatePreference } = useAudioPreferences();

  const bandAvg = (indices: number[]) =>
    Math.round(indices.reduce((s, i) => s + (audioEngine.bands[i]?.gain || 0), 0) / indices.length);

  const setGroup = (indices: number[], gain: number) => {
    indices.forEach((i) => audioEngine.setEqBand(i, gain));
  };

  const applyPreset3 = (name: keyof typeof PRESETS_3BAND) => {
    const p = PRESETS_3BAND[name];
    setGroup(BASS_INDICES, p.bass);
    setGroup(MID_INDICES, p.mid);
    setGroup(TREBLE_INDICES, p.treble);
    if (!audioEngine.eqEnabled) audioEngine.toggleEq(true);
  };

  const handleQualityChange = (q: "auto" | "high" | "normal" | "low") => {
    if (q === "auto") {
      updatePreference("autoQuality", true);
    } else if (q === "low") {
      updatePreference("preferredQuality", "normal");
      updatePreference("autoQuality", false);
    } else {
      updatePreference("preferredQuality", q);
      updatePreference("autoQuality", false);
    }
  };

  const currentQuality: "auto" | "high" | "normal" | "low" = preferences.autoQuality
    ? "auto"
    : (preferences.preferredQuality as any) === "normal"
    ? "normal"
    : (preferences.preferredQuality as any) === "high"
    ? "high"
    : "high";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="h-[85vh] rounded-b-2xl p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4 pb-10">
            <div className="text-center pt-2 pb-1">
              <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-3" />
              <h2 className="text-lg font-semibold">Playback Settings</h2>
            </div>

            {/* EQ */}
            <Card className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Equalizer</h3>
                <Switch
                  checked={audioEngine.eqEnabled}
                  onCheckedChange={(v) => audioEngine.toggleEq(v)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PRESETS_3BAND).map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset3(name as any)}
                    className="min-h-11"
                  >
                    {name}
                  </Button>
                ))}
              </div>
              {(["Bass", "Mid", "Treble"] as const).map((label) => {
                const indices = label === "Bass" ? BASS_INDICES : label === "Mid" ? MID_INDICES : TREBLE_INDICES;
                const value = bandAvg(indices);
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{label}</span>
                      <span className="tabular-nums text-muted-foreground">{value > 0 ? `+${value}` : value} dB</span>
                    </div>
                    <Slider
                      value={[value]}
                      min={-12}
                      max={12}
                      step={1}
                      className="touch-none"
                      onValueChange={(v) => setGroup(indices, v[0])}
                    />
                  </div>
                );
              })}
            </Card>

            {/* Crossfade */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Crossfade</h3>
                <Switch checked={crossfadeEnabled} onCheckedChange={setCrossfadeEnabled} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="tabular-nums">
                    {crossfadeDuration === 0 ? "Off" : `${crossfadeDuration}s`}
                  </span>
                </div>
                <Slider
                  value={[crossfadeDuration]}
                  min={0}
                  max={12}
                  step={2}
                  onValueChange={(v) => setCrossfadeDuration(v[0])}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Off</span><span>2s</span><span>4s</span><span>6s</span><span>8s</span><span>10s</span><span>12s</span>
                </div>
              </div>
            </Card>

            {/* Playback Speed */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Playback Speed</h3>
              <div className="grid grid-cols-5 gap-2">
                {SPEED_OPTIONS.map((s) => (
                  <Button
                    key={s}
                    variant={playbackRate === s ? "default" : "outline"}
                    onClick={() => setPlaybackRate(s)}
                    className="min-h-11"
                  >
                    {s}x
                  </Button>
                ))}
              </div>
            </Card>

            {/* Audio Quality */}
            <Card className="p-4 space-y-3">
              <h3 className="font-semibold">Audio Quality</h3>
              <div className="grid grid-cols-4 gap-2">
                {QUALITY_OPTIONS.map((q) => (
                  <Button
                    key={q.value}
                    variant={currentQuality === q.value ? "default" : "outline"}
                    onClick={() => handleQualityChange(q.value)}
                    className="min-h-11"
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Auto adjusts quality based on your network speed.
              </p>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
