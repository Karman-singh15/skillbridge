"use client";

import { useEffect, useRef, useState } from "react";

interface WheelColumnProps {
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
}

function WheelColumn({ options, selectedValue, onChange }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ignoreScrollEvent = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const itemHeight = 40; // 40px item height matching h-10

  // Scroll to active index on mount or when selectedValue changes externally
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeIndex = options.indexOf(selectedValue);
    if (activeIndex === -1) return;

    const targetScrollTop = activeIndex * itemHeight;

    // Check if we are already close enough to avoid unnecessary scrolls
    if (Math.abs(container.scrollTop - targetScrollTop) > 1) {
      ignoreScrollEvent.current = true;
      container.scrollTop = targetScrollTop;

      // Allow scroll events again after a short delay
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        ignoreScrollEvent.current = false;
      }, 100);
    }
  }, [selectedValue, options]);

  // Handle scroll behavior and select the element in the center
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || ignoreScrollEvent.current) return;

    const scrollTop = container.scrollTop;
    const activeIndex = Math.round(scrollTop / itemHeight);

    if (activeIndex >= 0 && activeIndex < options.length) {
      const newValue = options[activeIndex];
      if (newValue !== selectedValue) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="relative w-16 h-40 flex-1 overflow-hidden select-none">
      {/* Scrollable List Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto scrollbar-none snap-y snap-mandatory py-[60px]"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {options.map((option, index) => {
          const isSelected = option === selectedValue;
          return (
            <div
              key={index}
              className={`h-10 flex items-center justify-center snap-center text-sm font-semibold transition-all duration-150 ${
                isSelected
                  ? "text-teal-400 text-base font-bold scale-110"
                  : "text-zinc-500 scale-90 opacity-40"
              }`}
            >
              {option}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TimePickerScrollProps {
  value: string; // "HH:MM" in 24h format, e.g. "09:30" or "21:15"
  onChange: (value: string) => void;
}

export function TimePickerScroll({ value, onChange }: TimePickerScrollProps) {
  // Parse initial 24h value to 12h states
  const parse24To12 = (val24: string) => {
    if (!val24 || !val24.includes(":")) {
      return { hour: "09", minute: "00", period: "AM" };
    }
    const [hStr, mStr] = val24.split(":");
    let hNum = parseInt(hStr, 10);
    const m = mStr || "00";
    let period = "AM";

    if (hNum >= 12) {
      period = "PM";
      if (hNum > 12) {
        hNum -= 12;
      }
    } else if (hNum === 0) {
      hNum = 12;
    }

    const h = hNum.toString().padStart(2, "0");
    return { hour: h, minute: m, period };
  };

  const { hour: initialHour, minute: initialMinute, period: initialPeriod } = parse24To12(value);

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState(initialPeriod);

  // Sync state with prop updates
  useEffect(() => {
    const { hour: h, minute: m, period: p } = parse24To12(value);
    setHour(h);
    setMinute(m);
    setPeriod(p);
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
  const periods = ["AM", "PM"];

  const updateTime = (newH: string, newM: string, newP: string) => {
    let hNum = parseInt(newH, 10);
    if (newP === "PM") {
      if (hNum < 12) hNum += 12;
    } else {
      if (hNum === 12) hNum = 0;
    }
    const final24H = hNum.toString().padStart(2, "0");
    const finalTime = `${final24H}:${newM}`;
    onChange(finalTime);
  };

  return (
    <div className="relative flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-[260px] p-2 overflow-hidden shadow-2xl">
      {/* iOS Selection Highlighter Zone */}
      <div className="absolute top-1/2 left-4 right-4 h-10 -translate-y-1/2 bg-zinc-900/60 border-t border-b border-zinc-800 pointer-events-none rounded-md" />

      {/* Visual fading overlays */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-10" />

      {/* Columns */}
      <div className="flex w-full items-center justify-center gap-1 z-0">
        <WheelColumn
          options={hours}
          selectedValue={hour}
          onChange={(val) => {
            setHour(val);
            updateTime(val, minute, period);
          }}
        />
        <span className="text-zinc-600 font-bold text-sm select-none animate-pulse">:</span>
        <WheelColumn
          options={minutes}
          selectedValue={minute}
          onChange={(val) => {
            setMinute(val);
            updateTime(hour, val, period);
          }}
        />
        <div className="w-1 bg-zinc-900 h-12 self-center rounded pointer-events-none" />
        <WheelColumn
          options={periods}
          selectedValue={period}
          onChange={(val) => {
            setPeriod(val);
            updateTime(hour, minute, val);
          }}
        />
      </div>
    </div>
  );
}
