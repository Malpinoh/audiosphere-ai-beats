
import { useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { EqBand, EQ_PRESETS } from "@/hooks/use-audio-engine";
import { cn } from "@/lib/utils";

interface AudioEqualizerProps {
  bands: EqBand[];
  eqEnabled: boolean;
  currentPreset: string;
  onBandChange: (index: number, gain: number) => void;
  onPresetChange: (preset: string) => void;
  onToggleEq: (enabled: boolean) => void;
}

function EqSlider({
  band,
  index,
  disabled,
  onChange,
}: {
  band: EqBand;
  index: number;
  disabled: boolean;
  onChange: (index: number, gain: number) => void;
}) {
  const range = 12;
  const percentage = ((band.gain + range) / (range * 2)) * 100;
  const midPoint = 50;
  const isPositive = band.gain > 0;
  const isZero = band.gain === 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(index, Number(e.target.value));
    },
    [index, onChange]
  );

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      {/* Gain value */}
      <span
        className={cn(
          "text-[11px] font-mono font-semibold tabular-nums h-5 flex items-center",
          disabled
            ? "text-muted-foreground/40"
            : isPositive
            ? "text-emerald-400"
            : isZero
            ? "text-muted-foreground"
            : "text-orange-400"
        )}
      >
        {band.gain > 0 ? "+" : ""}
        {band.gain}
      </span>

      {/* Vertical slider track */}
      <div className="relative h-36 w-8 flex items-center justify-center">
        {/* Background track */}
        <div className="absolute inset-x-0 mx-auto w-1.5 h-full rounded-full bg-muted/60 overflow-hidden">
          {/* Fill bar from center */}
          {!disabled && (
            <div
              className={cn(
                "absolute left-0 right-0 rounded-full transition-all duration-100",
                isPositive
                  ? "bg-gradient-to-t from-primary/60 to-primary"
                  : isZero
                  ? ""
                  : "bg-gradient-to-b from-orange-400/60 to-orange-400"
              )}
              style={{
                top: isPositive ? `${100 - percentage}%` : `${midPoint}%`,
                bottom: isPositive
                  ? `${midPoint}%`
                  : `${100 - percentage}%`,
              }}
            />
          )}
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground/30" />
        </div>

        {/* Native range input (vertical via rotation) */}
        <input
          type="range"
          min={-range}
          max={range}
          step={1}
          value={band.gain}
          disabled={disabled}
          onChange={handleChange}
          className="absolute h-36 w-36 appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            writingMode: "vertical-lr" as any,
            direction: "rtl",
            WebkitAppearance: "slider-vertical" as any,
          }}
        />

        {/* Thumb indicator overlay */}
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 pointer-events-none transition-all duration-100 shadow-md",
            disabled
              ? "bg-muted border-muted-foreground/20"
              : "bg-background border-primary shadow-primary/20"
          )}
          style={{
            top: `calc(${100 - percentage}% - 10px)`,
          }}
        />
      </div>

      {/* Frequency label */}
      <span
        className={cn(
          "text-[10px] font-medium",
          disabled ? "text-muted-foreground/40" : "text-muted-foreground"
        )}
      >
        {band.label}
      </span>
    </div>
  );
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
    <div className="space-y-5">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Equalizer</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Customize your sound profile
          </p>
        </div>
        <Switch checked={eqEnabled} onCheckedChange={onToggleEq} />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {Object.keys(EQ_PRESETS).map((preset) => (
          <Button
            key={preset}
            variant={currentPreset === preset ? "default" : "outline"}
            size="sm"
            onClick={() => onPresetChange(preset)}
            disabled={!eqEnabled}
            className={cn(
              "text-[11px] h-7 px-3 rounded-full font-medium transition-all",
              currentPreset === preset && eqEnabled
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : ""
            )}
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* EQ Visualizer */}
      <div className="relative rounded-xl bg-muted/30 border border-border/50 p-4 pt-3">
        {/* dB scale on left */}
        <div className="absolute left-1 top-[42px] bottom-[30px] flex flex-col justify-between items-end pr-1">
          <span className="text-[8px] text-muted-foreground/50 font-mono">+12</span>
          <span className="text-[8px] text-muted-foreground/50 font-mono">0</span>
          <span className="text-[8px] text-muted-foreground/50 font-mono">-12</span>
        </div>

        {/* Sliders */}
        <div className="flex items-end justify-around gap-1 ml-6">
          {bands.map((band, index) => (
            <EqSlider
              key={band.frequency}
              band={band}
              index={index}
              disabled={!eqEnabled}
              onChange={onBandChange}
            />
          ))}
        </div>
      </div>

      {/* Current preset info */}
      {eqEnabled && currentPreset !== "Flat" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>
            Active preset: <span className="font-medium text-foreground">{currentPreset}</span>
          </span>
        </div>
      )}
    </div>
  );
};
