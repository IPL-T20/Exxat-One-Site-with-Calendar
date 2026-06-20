interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs?: string[];
  isNavigation?: boolean; // If true, tabs act as navigation
}

export function TabBar({ 
  activeTab, 
  onTabChange, 
  tabs = ['Setup', 'Standards', 'Communication', 'User Roles', 'Learning', 'Calendar'],
  isNavigation = false
}: TabBarProps) {
  return (
    <div className="bg-white relative rounded-[4px] inline-block" data-name="TabBar">
      <div className="box-border inline-flex items-start overflow-clip p-[2px] border border-gray-200 rounded-[4px]">
        <div className="flex flex-col items-start overflow-clip relative shrink-0">
          <div className="flex items-start relative shrink-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`box-border content-stretch flex h-[40px] items-center justify-center overflow-clip px-[16px] py-0 relative shrink-0 cursor-pointer transition-colors ${
                    isActive ? 'bg-[#3f51b5] rounded-[4px]' : 'hover:bg-gray-100 rounded-[4px]'
                  }`}
                  data-name="Tab"
                  aria-label={`${tab} tab`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="content-stretch flex flex-col items-center relative shrink-0">
                    <div className={`capitalize flex flex-col font-['Roboto'] justify-center leading-[0] not-italic relative shrink-0 text-[14px] text-center text-nowrap tracking-[-0.1px] ${
                      isActive ? 'text-white' : 'text-[rgba(0,0,0,0.87)]'
                    }`}>
                      <p className="leading-[19.6px] whitespace-pre">{tab}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}