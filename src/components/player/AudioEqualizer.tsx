import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EqBand, EQ_PRESETS } from "@/hooks/use-audio-engine";

interface AudioEqualizerProps {
  bands: EqBand[];
  eqEnabled: boolean;
  currentPreset: string;
  onBandChange: (index: number, gain: number) => void;
  onPresetChange: (preset: string) => void;
  onToggleEq: (enabled: boolean) => void;
}

export const AudioEqualizer = ({
  bands,
  eqEnabled,
  currentPreset,
  onBandChange,
  onPresetChange,
  onToggleEq,
}: AudioEqualizerProps) => {
  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">Equalizer</h3>
          <p className="text-sm text-muted-foreground">Customize your sound</p>
        </div>
        <Switch checked={eqEnabled} onCheckedChange={onToggleEq} />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(EQ_PRESETS).map((preset) => (
          <Button
            key={preset}
            variant={currentPreset === preset ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetChange(preset)}
            disabled={!eqEnabled}
            className="text-xs"
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* 5-band EQ sliders */}
      <div className="flex items-end justify-between gap-2 h-44 px-2">
        {bands.map((band, index) => (
          <div key={band.frequency} className="flex flex-col items-center gap-2 flex-1">
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {band.gain > 0 ? '+' : ''}{band.gain}dB
            </span>
            <div className="h-28 flex items-center">
              <Slider
                orientation="vertical"
                value={[band.gain]}
                min={-12}
                max={12}
                step={1}
                disabled={!eqEnabled}
                onValueChange={(v) => onBandChange(index, v[0])}
                className="h-full"
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{band.label}</span>
          </div>
        ))}
      </div>

      {/* dB scale hint */}
      <div className="flex justify-between text-[9px] text-muted-foreground/50 px-2">
        <span>-12 dB</span>
        <span>0 dB</span>
        <span>+12 dB</span>
      </div>
    </div>
  );
};
