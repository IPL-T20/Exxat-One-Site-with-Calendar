import { FontAwesomeIcon } from "./font-awesome-icon";

interface RubixSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate?: (href: string) => void;
  currentPath?: string;
}

interface NavItem {
  icon: string;
  label: string;
  href?: string;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { icon: "home", label: "Home", href: "/home" },
  { icon: "mapPin", label: "Locations", href: "/locations" },
  { icon: "user", label: "Personnel", href: "/personnel" },
  { icon: "graduationCap", label: "School Partners", href: "/partners" },
];

const availabilityItems: NavItem[] = [
  { icon: "calendar", label: "Availability", href: "/availability" },
  { icon: "clipboardCheck", label: "Slot Requests", href: "/slot-requests" },
  { icon: "clock", label: "Schedules", href: "/schedules" },
  { icon: "chartBar", label: "Reports", href: "/reports" },
];

const jobManagementItems: NavItem[] = [
  { icon: "briefcase", label: "Jobs", href: "/jobs", badge: "New" },
];

export function RubixSidebar({
  isCollapsed,
  onToggle,
  onNavigate,
  currentPath,
}: RubixSidebarProps) {
  const renderNavItem = (item: NavItem) => {
    const isActive =
      currentPath === item.href ||
      (item.href === "/slot-requests" && currentPath?.startsWith("/slot-requests")) ||
      (item.href === "/schedules" && currentPath?.startsWith("/schedules")) ||
      (item.href === "/jobs" && currentPath?.startsWith("/jobs"));

    return (
      <button
        key={item.label}
        className={`
          flex items-center transition-all duration-200 font-['Roboto'] w-full
          focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-1
          ${
            isActive
              ? "bg-[#3F51B5] text-white"
              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          }
          ${
            isCollapsed
              ? "w-10 h-10 justify-center rounded-lg mx-auto"
              : "gap-3 px-3 py-2 min-h-[40px] rounded"
          }
        `}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (item.href && onNavigate) {
            onNavigate(item.href);
          }
        }}
        aria-label={`Navigate to ${item.label}`}
        aria-current={isActive ? "page" : undefined}
        type="button"
      >
        <FontAwesomeIcon
          name={item.icon as any}
          className={`flex-shrink-0 ${isCollapsed ? "w-5 h-5" : "w-4 h-4"}`}
          aria-hidden="true"
        />
        {!isCollapsed && (
          <span className="font-['Roboto'] text-sm flex-1 text-left">
            {item.label}
          </span>
        )}
        {!isCollapsed && item.badge && (
          <span className="bg-green-500 text-white text-[10px] font-['Roboto'] font-semibold px-1.5 py-0.5 rounded-sm leading-none">
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const renderSection = (title: string, items: NavItem[]) => (
    <div className="space-y-0.5">
      {!isCollapsed && (
        <p className="px-3 pt-3 pb-1 text-[11px] font-['Roboto'] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
      )}
      {isCollapsed && <div className="py-1" />}
      {items.map((item) => renderNavItem(item))}
    </div>
  );

  return (
    <div
      className={`
        transition-all duration-300 ease-in-out flex-shrink-0
        ${isCollapsed ? "w-14" : "w-56"}
        h-full bg-white border-r border-gray-200 flex flex-col
      `}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between min-h-[52px]">
        {!isCollapsed && (
          <span className="font-['Roboto'] font-medium text-sm text-gray-700">
            Menu
          </span>
        )}
        <button
          onClick={onToggle}
          className={`
            p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700
            focus:outline-none focus:ring-2 focus:ring-[#3F51B5]
            transition-colors
            ${isCollapsed ? "mx-auto" : ""}
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          <FontAwesomeIcon
            name={isCollapsed ? "chevronRight" : "x"}
            className="w-4 h-4"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {/* Main Navigation */}
        <div className="space-y-0.5">
          {navigationItems.map((item) => renderNavItem(item))}
        </div>

        <div className="border-t border-gray-100 my-2" />

        {/* Availability Management */}
        {renderSection("Availability Management", availabilityItems)}

        <div className="border-t border-gray-100 my-2" />

        {/* Job Management */}
        {renderSection("Job Management", jobManagementItems)}
      </div>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-gray-200">
        <button
          className={`
            flex items-center transition-all duration-200 font-['Roboto'] w-full
            focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-1
            ${
              currentPath === "/site-configuration"
                ? "bg-[#3F51B5] text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }
            ${
              isCollapsed
                ? "w-10 h-10 justify-center rounded-lg mx-auto"
                : "gap-3 px-3 py-2 min-h-[40px] rounded"
            }
          `}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onNavigate) onNavigate("/site-configuration");
          }}
          aria-label="Navigate to Site Configuration"
          aria-current={currentPath === "/site-configuration" ? "page" : undefined}
          type="button"
        >
          <FontAwesomeIcon
            name="settings"
            className={`flex-shrink-0 ${isCollapsed ? "w-5 h-5" : "w-4 h-4"}`}
            aria-hidden="true"
          />
          {!isCollapsed && (
            <span className="font-['Roboto'] text-sm">Site Configuration</span>
          )}
        </button>
      </div>
    </div>
  );
}
