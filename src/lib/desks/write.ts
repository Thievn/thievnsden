import type { Settings } from "./clamp";

export type ColumnInfo = {
  columns: Map<string, { type?: string }>;
  required: Set<string>;
};

function put(row: Record<string, unknown>, cols: ColumnInfo | null, names: string[], value: unknown) {
  if (!cols) {
    row[names[0]] = value;
    return;
  }
  const name = names.find((item) => cols.columns.has(item));
  if (!name) return;
  const type = cols.columns.get(name)?.type;
  if (Array.isArray(value) && type === "string") {
    row[name] = value.join(",");
    return;
  }
  row[name] = value;
}

export function settingsToRow(settings: Settings, cols: ColumnInfo | null): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  put(row, cols, ["enabled"], settings.enabled);
  put(row, cols, ["starting_balance_usd"], settings.starting_balance_usd);
  put(row, cols, ["per_trade_usd"], settings.per_trade_usd);
  put(row, cols, ["daily_loss_halt_usd"], settings.daily_loss_halt_usd);
  put(row, cols, ["max_exposure_usd"], settings.max_exposure_usd);
  put(row, cols, ["pairs"], settings.pairs);
  put(row, cols, ["dca_enabled"], settings.dca.enabled);
  put(row, cols, ["interval_hours"], settings.dca.interval_hours);
  put(row, cols, ["take_profit_pct"], settings.dca.take_profit_pct);
  put(row, cols, ["max_buys_per_pair"], settings.dca.max_buys_per_pair);
  put(row, cols, ["grid_enabled"], settings.grid.enabled);
  put(row, cols, ["width_pct", "grid_width_pct"], settings.grid.width_pct);
  put(row, cols, ["levels", "grid_levels"], settings.grid.levels);
  put(row, cols, ["max_lots_per_pair", "grid_max_lots_per_pair"], settings.grid.max_lots_per_pair);
  if (cols?.columns.has("dca")) row.dca = settings.dca;
  if (cols?.columns.has("grid")) row.grid = settings.grid;
  if (cols?.columns.has("paper")) row.paper = true;
  if (cols?.columns.has("is_paper")) row.is_paper = true;
  if (cols?.columns.has("mode")) row.mode = "PAPER";
  if (!cols) row.paper = true;
  return row;
}

export function minimalSettingsRow(settings: Settings): Record<string, unknown> {
  const row = settingsToRow(settings, null);
  delete row.paper;
  return row;
}
