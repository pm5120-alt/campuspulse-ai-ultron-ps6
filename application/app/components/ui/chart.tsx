"use client";

import * as React from "react";

import { clsx } from "clsx";

// Format helper
interface ChartTooltipItem { dataKey?: string | number; name?: string | number; color?: string; value?: number | string; unit?: string; payload?: { fill?: string } }
interface ChartTooltipProps {
  active?: boolean; payload?: ChartTooltipItem[]; label?: string | number; hideLabel?: boolean;
  indicator?: "dot" | "line" | "dashed"; className?: string;
  formatter?: (value?: number | string, name?: string | number, item?: ChartTooltipItem, index?: number) => React.ReactNode;
}
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  );
};

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactNode;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <div
      data-chart={chartId}
      className={clsx(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-400 [&_.recharts-cartesian-grid_line]:stroke-slate-100 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-slate-200 [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-slate-200 [&_.recharts-radial-bar-background-sector]:fill-slate-100 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-slate-100/60 [&_.recharts-reference-line_[stroke='#ccc']]:stroke-slate-200 [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: Object.entries(config)
            .map(([key, item]) => {
              const color = item.color;
              return color ? `[data-chart=${chartId}] { --color-${key}: ${color}; }` : "";
            })
            .join("\n"),
        }}
      />
      {children}
    </div>
  );
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  indicator = "dot",
  formatter,
  className,
}: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      className={clsx(
        "min-w-[12rem] rounded-2xl border border-slate-200/90 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {!hideLabel && label && (
        <div className="mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs">{label}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Telemetry</span>
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index: number) => {
          const key = item.dataKey || item.name;
          const color = item.color || item.payload?.fill || "#f97316";

          return (
            <div key={index} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {indicator === "dot" && (
                  <span
                    className="h-2.5 w-2.5 rounded-full shadow-xs shrink-0"
                    style={{ backgroundColor: color }}
                  />
                )}
                {indicator === "line" && (
                  <span
                    className="h-0.5 w-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="font-bold text-slate-600 dark:text-slate-300 capitalize">
                  {item.name || key}
                </span>
              </div>
              <span className="font-black text-slate-900 dark:text-white tracking-tight">
                {formatter ? formatter(item.value, item.name, item, index) : item.value?.toLocaleString()}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
