import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from './font-awesome-icon';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDiscipline: string;
  onDisciplineChange: (value: string) => void;
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  selectedJobType: string;
  onJobTypeChange: (value: string) => void;
  selectedStatus?: string;
  onStatusChange?: (value: string) => void;
  selectedExperienceType?: string;
  onExperienceTypeChange?: (value: string) => void;
  disciplineOptions: string[];
  locationOptions: string[];
  jobTypeOptions: string[];
  statusOptions?: string[];
  experienceTypeOptions?: string[];
  onClearFilters: () => void;
}

type FilterType = {
  id: string;
  label: string;
  icon: string;
  selectedValues: string[];
  options: string[];
  onChange: (values: string[]) => void;
};

function MultiSelectFilterDropdown({
  label,
  selectedValues,
  options,
  onChange,
  icon,
  onRemove,
  autoOpen = false,
}: {
  label: string;
  selectedValues: string[];
  options: string[];
  onChange: (values: string[]) => void;
  icon: string;
  onRemove?: () => void;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
    }
  }, [autoOpen]);

  // Filter out "All" from options for display
  const selectableOptions = options.filter((opt) => opt !== 'All');

  const filteredOptions = selectableOptions.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggle = (option: string) => {
    const newSelected = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];

    // If no values selected, set to empty array (will be handled by parent)
    onChange(newSelected.length === 0 ? [] : newSelected);
  };

  const handleClearSelection = () => {
    onChange([]);
    setOpen(false);
    setSearchTerm('');
  };

  const displayText =
    selectedValues.length === 0
      ? label
      : selectedValues.length === 1
      ? selectedValues[0]
      : `${label} (${selectedValues.length})`;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="box-border content-stretch flex items-center px-[9px] py-[7px] relative rounded-[4px] shrink-0 cursor-pointer border border-[#888888] hover:bg-gray-50 transition-colors bg-transparent group"
          type="button"
        >
          <div className="box-border content-stretch flex flex-col h-[20px] items-start pl-0 pr-[8px] py-0 relative shrink-0 w-[28px]">
            <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[20px]">
              <FontAwesomeIcon
                name={icon as any}
                className="w-5 h-5 text-[#5D779A]"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="box-border content-stretch flex flex-col items-start pl-0 pr-[8px] py-0 relative shrink-0">
            <div className="content-stretch flex items-center relative shrink-0">
              <div className="content-stretch flex flex-col items-center relative shrink-0">
                <div className="flex flex-col font-['Roboto',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-gray-900 text-nowrap">
                  <p className="leading-[20px] whitespace-pre">{displayText}</p>
                </div>
              </div>
            </div>
          </div>
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRemove();
              }}
              className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
              aria-label={`Remove ${label} filter`}
            >
              <FontAwesomeIcon
                name="x"
                className="w-3 h-3 text-gray-500 hover:text-gray-700"
                aria-hidden="true"
              />
            </button>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 p-0 font-['Roboto']"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex-shrink-0">
          <div className="px-3 pt-3 pb-2 border-b border-gray-200">
            <div className="text-xs text-gray-500 mb-2">{label}</div>
            <div className="relative">
              <Input
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-sm font-['Roboto'] pr-8"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon name="x" className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="max-h-80 overflow-y-auto py-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const isChecked = selectedValues.includes(option);
              return (
                <div
                  key={`${option}-${index}`}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(option);
                  }}
                >
                  <div className="flex items-center justify-center min-w-[20px] min-h-[20px]">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleToggle(option)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <label className="flex-1 cursor-pointer font-['Roboto'] text-sm text-gray-900">
                    {option}
                  </label>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center font-['Roboto']">
              No options found
            </div>
          )}
        </div>

        {/* Footer - Clear Selection */}
        {selectedValues.length > 0 && (
          <div className="border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-['Roboto']"
              type="button"
            >
              Clear selection
            </button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AddFilterMenu({
  availableFilters,
  onAddFilter,
}: {
  availableFilters: FilterType[];
  onAddFilter: (filterId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFilters = availableFilters.filter((filter) =>
    filter.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="box-border content-stretch flex items-center px-[9px] py-[7px] relative rounded-[4px] shrink-0 border border-[#3f51b5] cursor-pointer hover:bg-blue-50 transition-colors bg-transparent"
        >
          <div className="box-border content-stretch flex flex-col h-[16px] items-start pl-0 pr-[8px] py-0 relative shrink-0 w-[24px]">
            <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[16px]">
              <FontAwesomeIcon
                name="plus"
                className="w-4 h-4 text-[#3F51B5]"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="content-stretch flex flex-col items-center relative shrink-0">
            <div className="flex flex-col font-['Roboto',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#3f51b5] text-[12.8px] text-center text-nowrap">
              <p className="leading-[19.2px] whitespace-pre">Add Filter</p>
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-0 font-['Roboto']">
        {availableFilters.length > 5 && (
          <div className="px-3 pt-3 pb-2 border-b border-gray-200">
            <div className="relative">
              <Input
                placeholder="Search filters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 text-sm font-['Roboto'] pr-8"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                  aria-label="Clear search"
                >
                  <FontAwesomeIcon name="x" className="w-3 h-3" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="max-h-80 overflow-y-auto py-1">
          {filteredFilters.length > 0 ? (
            filteredFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onAddFilter(filter.id);
                  setOpen(false);
                  setSearchTerm('');
                }}
              >
                <FontAwesomeIcon
                  name={filter.icon as any}
                  className="w-4 h-4 text-[#5D779A]"
                  aria-hidden="true"
                />
                <span className="font-['Roboto'] text-sm text-gray-900">
                  {filter.label}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center font-['Roboto']">
              No filters found
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  selectedDiscipline,
  onDisciplineChange,
  selectedLocation,
  onLocationChange,
  selectedJobType,
  onJobTypeChange,
  selectedStatus,
  onStatusChange,
  selectedExperienceType,
  onExperienceTypeChange,
  disciplineOptions,
  locationOptions,
  jobTypeOptions,
  statusOptions,
  experienceTypeOptions,
  onClearFilters,
}: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(['discipline', 'location', 'jobType']),
  );
  const [justAddedFilter, setJustAddedFilter] = useState<string | null>(null);

  // Convert single values to arrays for multi-select
  const convertToArray = (value: string): string[] => {
    if (!value || value === 'All') return [];
    return value.includes(', ') ? value.split(', ') : [value];
  };

  const convertFromArray = (values: string[]): string => {
    if (values.length === 0) return 'All';
    return values.join(', ');
  };

  // Define all possible filters
  const allFilters: FilterType[] = [
    {
      id: 'discipline',
      label: 'Discipline',
      icon: 'stethoscope',
      selectedValues: convertToArray(selectedDiscipline),
      options: disciplineOptions,
      onChange: (values: string[]) => onDisciplineChange(convertFromArray(values)),
    },
    {
      id: 'location',
      label: 'Location Groups',
      icon: 'locationDot',
      selectedValues: convertToArray(selectedLocation),
      options: locationOptions,
      onChange: (values: string[]) => onLocationChange(convertFromArray(values)),
    },
    {
      id: 'jobType',
      label: 'Job Type',
      icon: 'briefcase',
      selectedValues: convertToArray(selectedJobType),
      options: jobTypeOptions,
      onChange: (values: string[]) => onJobTypeChange(convertFromArray(values)),
    },
  ];

  // Add optional filters if they have data
  if (statusOptions && onStatusChange && selectedStatus !== undefined) {
    allFilters.push({
      id: 'status',
      label: 'Status',
      icon: 'circleCheck',
      selectedValues: convertToArray(selectedStatus),
      options: statusOptions,
      onChange: (values: string[]) => onStatusChange(convertFromArray(values)),
    });
  }

  if (experienceTypeOptions && onExperienceTypeChange && selectedExperienceType !== undefined) {
    allFilters.push({
      id: 'experience',
      label: 'Experience',
      icon: 'graduationCap',
      selectedValues: convertToArray(selectedExperienceType),
      options: experienceTypeOptions,
      onChange: (values: string[]) =>
        onExperienceTypeChange(convertFromArray(values)),
    });
  }

  const availableFilters = allFilters.filter(
    (filter) => !activeFilters.has(filter.id),
  );

  const handleAddFilter = (filterId: string) => {
    setActiveFilters((prev) => new Set([...prev, filterId]));
    setJustAddedFilter(filterId);
    // Reset the auto-open state after a short delay
    setTimeout(() => setJustAddedFilter(null), 100);
  };

  const handleRemoveFilter = (filterId: string) => {
    // Don't allow removing default filters (discipline, location, jobType)
    if (['discipline', 'location', 'jobType'].includes(filterId)) {
      return;
    }
    
    setActiveFilters((prev) => {
      const newSet = new Set(prev);
      newSet.delete(filterId);
      return newSet;
    });
    
    // Reset the filter value to 'All'
    const filter = allFilters.find((f) => f.id === filterId);
    if (filter) {
      filter.onChange([]);
    }
  };

  const hasActiveFilters =
    selectedDiscipline !== 'All' ||
    selectedLocation !== 'All' ||
    selectedJobType !== 'All' ||
    (selectedStatus && selectedStatus !== 'All') ||
    (selectedExperienceType && selectedExperienceType !== 'All');

  return (
    <div className="bg-white relative w-full">
      <div className="relative w-full">
        {/* Main Filter Container */}
        <div className="content-stretch flex items-start relative shrink-0 w-full px-[0px] py-[4px] mx-[0px] my-[4px]">
          <div className="h-[34px] relative shrink-0 w-full flex items-center px-[0px] py-[4px] mx-[0px] my-[4px]">
            {/* Search Input */}
            <div className="relative w-[240px]">
              <FontAwesomeIcon
                name="magnifyingGlass"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                placeholder="Search by Job Title, Location..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-[36px] border-0 outline-none ring-0 focus:ring-0 focus:outline-none focus:border-0 rounded-md bg-white text-sm font-['Roboto'] placeholder:text-gray-500 shadow-none"
              />
            </div>

            {/* Separator */}
            <div className="h-[24px] w-px bg-gray-300 mx-3 py-[4px] mx-[12px] my-[4px] p-[0px]"></div>

            {/* Filter Buttons Container */}
            <div className="flex items-center gap-3 flex-1">
              {allFilters
                .filter((filter) => activeFilters.has(filter.id))
                .map((filter) => (
                  <MultiSelectFilterDropdown
                    key={filter.id}
                    label={filter.label}
                    selectedValues={filter.selectedValues}
                    options={filter.options}
                    onChange={filter.onChange}
                    icon={filter.icon}
                    onRemove={
                      ['discipline', 'location', 'jobType'].includes(filter.id)
                        ? undefined
                        : () => handleRemoveFilter(filter.id)
                    }
                    autoOpen={justAddedFilter === filter.id}
                  />
                ))}

              {/* Reset Button */}
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="box-border content-stretch flex items-center px-0 py-[7.4px] text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                  aria-label="Reset all filters"
                >
                  <div className="box-border content-stretch flex flex-col h-[16px] items-start pl-0 pr-[8px] py-0 relative shrink-0 w-[24px]">
                    <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 size-[16px]">
                      <FontAwesomeIcon
                        name="arrowRotateLeft"
                        className="w-4 h-4 text-current"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-center relative shrink-0">
                    <div className="flex flex-col font-['Roboto',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[12.8px] text-center text-nowrap">
                      <p className="leading-[19.2px] whitespace-pre">Reset</p>
                    </div>
                  </div>
                </button>
              )}

              {/* Add Filter Button */}
              {availableFilters.length > 0 && (
                <AddFilterMenu
                  availableFilters={availableFilters}
                  onAddFilter={handleAddFilter}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
