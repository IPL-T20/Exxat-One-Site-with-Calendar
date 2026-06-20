import { ReactNode } from 'react';
import { FontAwesomeIcon, FontAwesomeIconName } from './font-awesome-icon';
import { TabBar } from './TabBar';

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: FontAwesomeIconName;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  mobileLabel?: string; // Optional shorter label for mobile
}

interface PageHeaderProps {
  icon?: FontAwesomeIconName;
  title: string;
  description?: string;
  tabs?: string[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  actions?: PageHeaderAction[];
  actionsContent?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  icon,
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  actions = [],
  actionsContent,
  children,
}: PageHeaderProps) {
  const primaryAction = actions.find(a => a.variant === 'primary' || a.variant === undefined);
  const secondaryActions = actions.filter(a => a.variant !== 'primary' && a.variant !== undefined);

  return (
    <div className="bg-white border-b border-gray-200 w-full">
      <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile Layout: Stack vertically */}
        <div className="flex flex-col space-y-4 lg:hidden">
          {/* Mobile Title and Primary Action */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {icon && (
                <div className="p-2 bg-[#3F51B5]/10 rounded-lg flex-shrink-0">
                  <FontAwesomeIcon name={icon} className="w-6 h-6 text-[#3F51B5]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-medium text-gray-900 font-['Roboto'] truncate">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm sm:text-base text-gray-600 mt-1 font-['Roboto'] truncate">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Primary Action Button */}
            {primaryAction && (
              <div className="flex-shrink-0 ml-4">
                <button
                  onClick={primaryAction.onClick}
                  className={`
                    bg-[#3F51B5] hover:bg-[#3544a5] text-white px-3 py-2 h-9 
                    rounded-md font-['Roboto'] font-medium text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-2
                    transition-colors duration-200
                    flex items-center gap-1
                    ${primaryAction.className || ''}
                  `}
                  aria-label={primaryAction.label}
                >
                  {primaryAction.icon && (
                    <FontAwesomeIcon
                      name={primaryAction.icon}
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                  )}
                  <span>{primaryAction.mobileLabel || primaryAction.label}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Tab Navigation */}
          {tabs && activeTab && onTabChange && (
            <div className="w-full">
              <TabBar
                activeTab={activeTab}
                onTabChange={onTabChange}
                tabs={tabs}
              />
            </div>
          )}

          {/* Mobile Secondary Actions */}
          {secondaryActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {secondaryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-3 py-2 h-9 rounded-md font-['Roboto'] font-medium text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-2
                    transition-colors duration-200 flex items-center gap-2
                    ${
                      action.variant === 'secondary'
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                    ${action.className || ''}
                  `}
                  aria-label={action.label}
                >
                  {action.icon && (
                    <FontAwesomeIcon
                      name={action.icon}
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                  )}
                  <span>{action.mobileLabel || action.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Custom children for mobile */}
          {children && <div className="w-full">{children}</div>}
        </div>

        {/* Desktop Layout: Single row */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          {/* Title Section */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {icon && (
              <div className="w-10 h-10 bg-[#3F51B5]/10 rounded-lg flex items-center justify-center">
                <FontAwesomeIcon name={icon} className="w-6 h-6 text-[#3F51B5]" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-medium text-gray-900 font-['Roboto']">
                {title}
              </h1>
              {description && (
                <p className="text-base text-gray-600 mt-1 font-['Roboto']">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          {tabs && activeTab && onTabChange && (
            <TabBar
              activeTab={activeTab}
              onTabChange={onTabChange}
              tabs={tabs}
            />
          )}

          {/* Custom children for desktop */}
          {children && !tabs && <div className="flex-1 flex items-center justify-center">{children}</div>}

          {/* Desktop Actions */}
          {(actionsContent || actions.length > 0) && (
            <div className="flex-shrink-0 flex items-center gap-3">
              {actionsContent}
              {!actionsContent && secondaryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-4 py-2 h-10 rounded-md font-['Roboto'] font-medium
                    focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-2
                    transition-colors duration-200 flex items-center gap-2
                    ${
                      action.variant === 'secondary'
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                    ${action.className || ''}
                  `}
                  aria-label={action.label}
                >
                  {action.icon && (
                    <FontAwesomeIcon
                      name={action.icon}
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                  )}
                  <span>{action.label}</span>
                </button>
              ))}
              {!actionsContent && primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className={`
                    bg-[#3F51B5] hover:bg-[#3544a5] text-white px-4 py-2 h-10 
                    rounded-md font-['Roboto'] font-medium
                    focus:outline-none focus:ring-2 focus:ring-[#3F51B5] focus:ring-offset-2
                    transition-colors duration-200 flex items-center gap-2
                    ${primaryAction.className || ''}
                  `}
                  aria-label={primaryAction.label}
                >
                  {primaryAction.icon && (
                    <FontAwesomeIcon
                      name={primaryAction.icon}
                      className="w-4 h-4"
                      aria-hidden="true"
                    />
                  )}
                  <span>{primaryAction.label}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}