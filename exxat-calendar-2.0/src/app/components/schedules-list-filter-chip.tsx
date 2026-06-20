import { useMemo, useState } from "react"
import { FontAwesomeIcon, type FontAwesomeIconName } from "./font-awesome-icon"

interface SchedulesListFilterChipProps {
  label: string
  icon: FontAwesomeIconName
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
}

export function SchedulesListFilterChip({
  label,
  icon,
  options,
  selected,
  onChange,
}: SchedulesListFilterChipProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value))
    else onChange([...selected, value])
  }

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-['Roboto'] bg-white border rounded transition-colors whitespace-nowrap ${
          selected.length > 0
            ? "text-[#3F51B5] border-[#3F51B5] bg-blue-50"
            : "text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FontAwesomeIcon name={icon} className="w-3 h-3 text-gray-400" aria-hidden="true" />
        {label}
        {selected.length > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 bg-[#3F51B5] text-white rounded text-[10px] leading-none">
            {selected.length}
          </span>
        )}
        <FontAwesomeIcon name="chevronDown" className="w-2.5 h-2.5 text-gray-400" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close filter menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-72 max-h-80 overflow-hidden rounded border border-gray-200 bg-white shadow-lg flex flex-col">
            <div className="px-2 py-2 border-b border-gray-100 flex-shrink-0">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}`}
                className="w-full px-2 py-1 text-xs border border-gray-200 rounded font-['Roboto']"
                aria-label={`Search ${label}`}
              />
            </div>
            <div className="overflow-y-auto py-1 flex-1" role="listbox" aria-label={`${label} options`}>
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-500 font-['Roboto']">No matches</p>
              ) : (
                filtered.map((option) => {
                  const checked = selected.includes(option)
                  return (
                    <label
                      key={option}
                      className="flex items-start gap-2 px-3 py-1.5 text-xs font-['Roboto'] hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(option)}
                        className="mt-0.5 rounded border-gray-300 text-[#3F51B5]"
                      />
                      <span className="text-gray-800 leading-snug">{option}</span>
                    </label>
                  )
                })
              )}
            </div>
            {selected.length > 0 && (
              <div className="border-t border-gray-100 px-2 py-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[11px] font-['Roboto'] text-[#3F51B5] hover:underline"
                >
                  Clear {label}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
