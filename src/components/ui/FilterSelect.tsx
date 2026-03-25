"use client";

import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type DropdownPhase = "visible" | "exiting" | "hidden";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onSelect: (selected: string[]) => void;
}

export function FilterSelect({
  label,
  options,
  selected,
  onSelect,
}: FilterSelectProps) {
  const [phase, setPhase] = useState<DropdownPhase>("hidden");
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = phase === "visible";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPhase((currentPhase) =>
          currentPhase === "visible" ? "exiting" : currentPhase,
        );
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onSelect(selected.filter((v) => v !== value));
    } else {
      onSelect([...selected, value]);
    }
  };

  const handleClearAll = () => {
    onSelect([]);
  };

  const isPanelVisible = phase !== "hidden";
  const isExiting = phase === "exiting";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setPhase((currentPhase) => (currentPhase === "visible" ? "exiting" : "visible"))}
        className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <span className="text-neutral-700">{label}</span>
        {selected.length > 0 && (
          <span className="flex items-center justify-center rounded-full bg-brand-100 min-w-5 h-5 text-xs font-medium text-brand-700">
            {selected.length}
          </span>
        )}
        <ChevronDown
          size={16}
          className={cn("text-neutral-400", isOpen ? "rotate-180" : "")}
        />
      </button>

      {isPanelVisible && (
        <div
          className={cn(
            "absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-neutral-200 bg-white",
            isExiting ? "animate-dropdown-out" : "animate-dropdown-in",
          )}
          onAnimationEnd={(e) => {
            if (e.currentTarget === e.target && isExiting) {
              setPhase("hidden");
            }
          }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100">
            <span className="text-xs font-medium text-neutral-600">
              {selected.length === 0 ? "All" : `${selected.length} selected`}
            </span>
            {selected.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="flex-1 text-sm text-neutral-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
