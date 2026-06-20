import { useState } from 'react';
import { FontAwesomeIcon } from './font-awesome-icon';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { DatabaseResetButton } from './DatabaseResetButton';
import svgPaths from '../imports/svg-c6av7jqbc5';
import exxatOneLogo from 'figma:asset/1526ed003237aba95ce6a081caba2895b42ab4ed.png';

// Preserved icon components from original header
function LeadingIcon() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g clipPath="url(#clip0_1_3696)">
          <g id="Vector"></g>
          <path d={svgPaths.pc44b000} fill="#6D28D9" />
        </g>
        <defs>
          <clipPath id="clip0_1_3696">
            <rect fill="white" height="16" width="16" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function AllSitesButton() {
  return (
    <div className="box-border content-stretch flex gap-[8px] h-[32px] items-center min-w-[80px] px-[8px] py-[7px] relative rounded-[4px] shrink-0">
      <FontAwesomeIcon name="tableCells" className="text-[#6D28D9] text-[16px]" aria-hidden="true" />
      <p className="basis-0 font-semibold grow leading-normal min-h-px min-w-px relative shrink-0 text-[#4355b6] text-[14px] text-center">
        All Sites
      </p>
    </div>
  );
}

function VerticalSeparator() {
  return (
    <div className="flex h-[24px] items-center justify-center relative shrink-0 w-[0px]">
      <div className="flex-none rotate-[270deg]">
        <div className="h-0 relative w-[24px]">
          <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 1">
              <line stroke="#D1D1D1" x2="24" y1="0.5" y2="0.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RubixHeaderProps {
  onMenuToggle?: () => void;
  sourceInfo?: {
    type: 'link' | 'file';
    value: string;
    onClear?: () => void;
  };
  showEmptyStates?: boolean;
  onToggleEmptyStates?: (show: boolean) => void;
  emptyStateCase?: 'no-jobs' | 'has-jobs';
  onToggleEmptyStateCase?: (caseType: 'no-jobs' | 'has-jobs') => void;
}

export function RubixHeader({ onMenuToggle, sourceInfo, showEmptyStates, onToggleEmptyStates, emptyStateCase = 'has-jobs', onToggleEmptyStateCase }: RubixHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <header className="h-12">
        <div className="flex flex-row items-center max-h-inherit min-h-inherit relative size-full">
          <div className="box-border content-stretch flex gap-[16px] items-center max-h-inherit min-h-inherit pb-[9px] pl-[16px] pr-[16.01px] pt-[7px] relative size-full">
            {/* Logo */}
            <div className="h-[16px] shrink-0 w-[64px] flex items-center justify-center">
              <img src={exxatOneLogo} alt="ExxatOne" className="h-full w-auto object-contain" />
            </div>
            
            {/* Separator */}
            <VerticalSeparator />
            
            {/* Tenant name */}
            <div className="flex flex-col font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-black text-center text-nowrap">
              <p className="leading-normal whitespace-pre">Mapple Health</p>
            </div>
            
            {/* Source Info Display */}
            {sourceInfo && (
              <>
                <VerticalSeparator />
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-md border border-blue-200 max-w-xs">
                  {sourceInfo.type === 'link' ? (
                    <FontAwesomeIcon name="link" className="w-4 h-4 text-[#3F51B5] shrink-0" />
                  ) : (
                    <FontAwesomeIcon name="paperclip" className="w-4 h-4 text-[#3F51B5] shrink-0" />
                  )}
                  <span 
                    className="text-sm text-gray-700 font-['Roboto'] truncate"
                    title={sourceInfo.value}
                  >
                    {sourceInfo.type === 'link' 
                      ? (() => {
                          try {
                            return new URL(sourceInfo.value).hostname;
                          } catch {
                            return sourceInfo.value;
                          }
                        })()
                      : sourceInfo.value}
                  </span>
                  {sourceInfo.onClear && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={sourceInfo.onClear}
                      className="h-5 w-5 hover:bg-blue-100 text-gray-500 hover:text-gray-700"
                    >
                      <FontAwesomeIcon name="x" className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </>
            )}
            
            {/* Flex spacer */}
            <div className="basis-0 grow h-[32px] min-h-px min-w-px shrink-0" />
            
            {/* All Sites Button */}
            <AllSitesButton />
            
            {/* Separator */}
            <VerticalSeparator />
            
            {/* Icon Group */}
            <div className="flex items-center gap-4">
              <FontAwesomeIcon name="circleQuestion" className="w-6 h-6 text-[#E31C79] cursor-pointer hover:opacity-75 transition-opacity" />
              <FontAwesomeIcon name="headset" className="w-6 h-6 text-black cursor-pointer hover:opacity-75 transition-opacity" />
              <FontAwesomeIcon name="bullhorn" className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-75 transition-opacity" />
              <FontAwesomeIcon name="bell" className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-75 transition-opacity" />
            </div>
            
            {/* Separator */}
            <VerticalSeparator />
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto p-2 hover:bg-gray-50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback className="bg-[#4355b6] text-white text-sm">
                      KM
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium text-black">Kierra Mango</p>
                  </div>
                  <div className="relative shrink-0 size-[16px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <g>
                        <path d={svgPaths.p3e4aee30} fill="black" />
                      </g>
                    </svg>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-['Roboto']">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FontAwesomeIcon name="user" className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FontAwesomeIcon name="settings" className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500 font-normal">Developer Options</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showEmptyStates}
                  onCheckedChange={(checked) => onToggleEmptyStates?.(checked)}
                  className="cursor-pointer"
                >
                  {showEmptyStates ? (
                    <FontAwesomeIcon name="eye" className="w-4 h-4 mr-2" />
                  ) : (
                    <FontAwesomeIcon name="eyeOff" className="w-4 h-4 mr-2" />
                  )}
                  <span>Show Empty States</span>
                </DropdownMenuCheckboxItem>
                
                {/* Empty State Case Switcher */}
                {showEmptyStates && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-gray-500 font-normal px-2">Empty State Mode</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onToggleEmptyStateCase?.('no-jobs')}
                      className={`cursor-pointer ${emptyStateCase === 'no-jobs' ? 'bg-blue-50 text-[#3F51B5]' : ''}`}
                    >
                      <FontAwesomeIcon name="briefcase" className="w-4 h-4 mr-2" />
                      <span>No Jobs Posted</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onToggleEmptyStateCase?.('has-jobs')}
                      className={`cursor-pointer ${emptyStateCase === 'has-jobs' ? 'bg-blue-50 text-[#3F51B5]' : ''}`}
                    >
                      <FontAwesomeIcon name="users" className="w-4 h-4 mr-2" />
                      <span>Has Jobs, No Candidates</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuSeparator />
                <div className="px-2 py-2">
                  <DatabaseResetButton />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </div>
  );
}