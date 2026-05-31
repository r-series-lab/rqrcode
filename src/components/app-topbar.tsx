import { Chip, ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { PanelMode } from "../lib/types";

const MODE_LABELS: Record<PanelMode, string> = {
  generate: "生成",
  recognize: "识别",
};

type AppTopbarProps = {
  mode: PanelMode;
  statusLabel: string;
  onModeChange: (mode: PanelMode) => void;
};

export function AppTopbar({ mode, statusLabel, onModeChange }: AppTopbarProps) {
  return (
    <div className="topbar-layout">
      <div className="brand-block">
        <div className="brand-mark">R</div>
        <div className="brand-copy">
          <strong className="brand-title">rQrcode</strong>
        </div>
      </div>

      <div className="topbar-center">
        <ToggleButtonGroup
          exclusive
          color="primary"
          value={mode}
          className="mode-switch"
          onChange={(_, nextMode: PanelMode | null) => {
            if (nextMode) {
              onModeChange(nextMode);
            }
          }}
        >
          {(Object.keys(MODE_LABELS) as PanelMode[]).map((entry) => (
            <ToggleButton key={entry} value={entry}>
              {MODE_LABELS[entry]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <div className="toolbar-meta">
        {statusLabel ? <Chip label={statusLabel} className="toolbar-status-chip" /> : null}
      </div>
    </div>
  );
}
