"use client"

import { useState, useRef, useEffect, useMemo, useLayoutEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboOption {
  value: string | number
  label: string
  disabled?: boolean
  group?: string
}

type ComboValue = string | number | null | (string | number)[]

interface ComboSelectProps {
  options: ComboOption[]
  value: ComboValue
  onChange: (value: ComboValue) => void
  multiple?: boolean
  searchable?: boolean
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  label?: string
  required?: boolean
  error?: { message?: string }
  allOptionLabel?: string
  variant?: "form" | "filter"
  className?: string
}

export function ComboSelect({
  options,
  value,
  onChange,
  multiple = false,
  searchable = true,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  disabled = false,
  label,
  required = false,
  error,
  allOptionLabel,
  variant = "form",
  className,
}: ComboSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [mounted, setMounted] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isFilter = variant === "filter"

  useEffect(() => { setMounted(true) }, [])

  const selectedValues = useMemo<(string | number)[]>(() => {
    if (multiple) return Array.isArray(value) ? value : []
    return value === null || value === undefined || value === "" ? [] : [value as string | number]
  }, [value, multiple])

  const filtered = useMemo(() => {
    if (!searchable || !search) return options
    return options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
  }, [options, search, searchable])

  const hasGroups = useMemo(() => options.some((o) => o.group), [options])

  const groupedFiltered = useMemo(() => {
    if (!hasGroups) return []
    const map = new Map<string, ComboOption[]>()
    for (const o of filtered) {
      const g = o.group ?? ""
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(o)
    }
    return Array.from(map, ([group, items]) => ({ group, items }))
  }, [filtered, hasGroups])

  const enabledOptions = useMemo(() => options.filter((o) => !o.disabled), [options])
  const allSelected = multiple && enabledOptions.length > 0 && enabledOptions.every((o) => selectedValues.includes(o.value))

  const displayText = useMemo(() => {
    if (selectedValues.length === 0) return ""
    const labels = options.filter((o) => selectedValues.includes(o.value)).map((o) => o.label)
    if (!multiple) return labels[0] ?? ""
    if (labels.length <= 3) return labels.join(", ")
    return `${labels.length} dipilih`
  }, [selectedValues, options, multiple])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPanelStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
      zIndex: 9999,
    })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) { setPanelStyle(null); return }
    updatePosition()
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    const handler = () => updatePosition()
    window.addEventListener("resize", handler)
    window.addEventListener("scroll", handler, true)
    return () => {
      window.removeEventListener("resize", handler)
      window.removeEventListener("scroll", handler, true)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    function onDown(e: MouseEvent) {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setIsOpen(false)
      setSearch("")
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [isOpen])

  useEffect(() => {
    if (isOpen && searchable) searchRef.current?.focus()
  }, [isOpen, searchable])

  const handleSelect = (val: string | number, isDisabled?: boolean) => {
    if (isDisabled) return
    if (multiple) {
      const next = selectedValues.includes(val)
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val]
      onChange(next)
    } else {
      onChange(val)
      setIsOpen(false)
      setSearch("")
    }
  }

  const handleSelectAll = () => {
    onChange(allSelected ? [] : enabledOptions.map((o) => o.value))
  }

  const renderOption = (opt: ComboOption) => {
    const selected = selectedValues.includes(opt.value)
    const isDisabled = !!opt.disabled
    return (
      <button
        key={opt.value}
        type="button"
        onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.value, isDisabled) }}
        disabled={isDisabled}
        className={cn(
          "flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm",
          isDisabled ? "cursor-not-allowed opacity-40" : "hover:bg-gray-100",
          !multiple && selected && !isDisabled && "bg-gray-100",
        )}
      >
        {multiple && <OptionCheckbox checked={selected} disabled={isDisabled} />}
        <span className="flex-1 truncate text-gray-900">{opt.label}</span>
        {!multiple && selected && <Check size={16} className="shrink-0 text-blue-600" />}
      </button>
    )
  }

  const triggerClass = cn(
    "flex items-center justify-between gap-2 rounded-lg border outline-none transition disabled:cursor-not-allowed disabled:opacity-60 text-left text-sm w-full",
    isFilter
      ? "bg-transparent px-3 py-2.5 border-blue-600 text-blue-600"
      : "bg-white px-4 py-2.5 border-gray-300 text-gray-900 disabled:bg-gray-100",
    error && !isFilter && "border-red-500",
    isOpen && !error && "border-blue-600",
  )

  const panel = mounted && isOpen && panelStyle && createPortal(
    <div
      ref={panelRef}
      style={panelStyle}
      className="w-max max-w-xs overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg"
    >
      {searchable && (
        <div className="relative border-b border-gray-300 p-2">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-md border border-gray-300 bg-transparent py-1.5 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-600"
          />
        </div>
      )}

      <div className="max-h-60 overflow-auto p-1">
        {multiple && allOptionLabel && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleSelectAll() }}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-gray-100"
          >
            <OptionCheckbox checked={allSelected} />
            <span className="text-gray-900">{allOptionLabel}</span>
          </button>
        )}

        {filtered.length > 0 ? (
          hasGroups ? (
            groupedFiltered.map(({ group, items }) => (
              <div key={group || "__ungrouped"}>
                {group && (
                  <div className="top-0 z-10 -mx-1 mb-1 border-y border-gray-300 bg-gray-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-900">
                    {group}
                  </div>
                )}
                {items.map(renderOption)}
              </div>
            ))
          ) : (
            filtered.map(renderOption)
          )
        ) : (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            {search ? "Tidak ada hasil" : "Tidak ada pilihan"}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      disabled={disabled}
      onClick={() => { if (!disabled) setIsOpen((o) => !o) }}
      className={triggerClass}
    >
      <span className={cn("truncate", selectedValues.length === 0 && (isFilter ? "text-blue-600" : "text-gray-400"))}>
        {displayText || placeholder}
      </span>
      <ChevronDown
        size={18}
        className={cn(
          "shrink-0 transition-transform",
          isFilter ? "text-blue-600" : "text-gray-400",
          isOpen && "rotate-180",
        )}
      />
    </button>
  )

  if (isFilter) {
    return (
      <div ref={containerRef} className={cn("relative min-w-32", className)}>
        {trigger}
        {panel}
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {trigger}
      {panel}
      {error?.message && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  )
}

function OptionCheckbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border",
        checked ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white",
        disabled && "opacity-40",
      )}
    >
      {checked && <Check size={12} className="text-white" />}
    </span>
  )
}
