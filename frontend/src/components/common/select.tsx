"use client";

import * as RadixSelect from "@radix-ui/react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar",
  disabled,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={
          "flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-900 outline-none transition hover:border-zinc-400 focus:border-zinc-900 data-[placeholder]:text-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 " +
          (className ?? "")
        }
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <svg className="h-4 w-4 shrink-0 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          <RadixSelect.Viewport className="p-1">
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className="flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none data-[highlighted]:bg-zinc-50 data-[state=checked]:font-semibold data-[state=checked]:text-red-600"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator>
                  <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
