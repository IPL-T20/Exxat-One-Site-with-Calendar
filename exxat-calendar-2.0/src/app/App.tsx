import { useEffect, useState } from "react";
import { RubixSidebar } from "./components/RubixSidebar";
import { RubixHeader } from "./components/RubixHeader";
import { JobsPage } from "./components/JobsPage";
import { SlotRequestsPage } from "./components/SlotRequestsPage";
import { SchedulesPage } from "./components/SchedulesPage";
import { currentAppPath, withAppBasePath } from "./lib/app-base-path";
import "../styles/globals.css";

const DEFAULT_PATH = "/slot-requests/list";

function pathFromLocation(): string {
  if (typeof window === "undefined") return DEFAULT_PATH;
  const appPath = currentAppPath();
  return appPath === "/" ? DEFAULT_PATH : appPath;
}

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPath, setCurrentPath] = useState(pathFromLocation);
  const [showEmptyStates, setShowEmptyStates] = useState(false);
  const [emptyStateCase, setEmptyStateCase] = useState<'no-jobs' | 'has-jobs'>('has-jobs');

  useEffect(() => {
    const onPopState = () => setCurrentPath(pathFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigate = (href: string) => {
    setCurrentPath(href);
    if (typeof window !== "undefined") {
      const target = withAppBasePath(href);
      if (window.location.pathname !== target) {
        window.history.pushState(null, "", target);
      }
    }
  };

  const renderPageContent = () => {
    switch (currentPath) {
      case '/jobs':
      case '/jobs/overview':
      case '/jobs/list':
        return <JobsPage currentPath={currentPath} onNavigate={handleNavigate} />;
      case '/slot-requests':
      case '/slot-requests/list':
      case '/slot-requests/reports':
        return <SlotRequestsPage currentPath={currentPath} onNavigate={handleNavigate} />;
      case '/schedules':
      case '/schedules/list':
      case '/schedules/report':
        return <SchedulesPage currentPath={currentPath} onNavigate={handleNavigate} />;
      default:
        return (
          <div className="p-6 bg-gray-50 h-full">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="text-center">
                  <h1 className="text-gray-900 mb-4">
                    Job Management System
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Welcome to the job management base. Use the sidebar to navigate through different sections.
                  </p>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm text-gray-700">
                      Current Path: <strong className="text-[#3F51B5]">{currentPath}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      {/* Header */}
      <RubixHeader
        showEmptyStates={showEmptyStates}
        onToggleEmptyStates={setShowEmptyStates}
        emptyStateCase={emptyStateCase}
        onToggleEmptyStateCase={setEmptyStateCase}
      />

      {/* Main Layout with Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <RubixSidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onNavigate={handleNavigate}
          currentPath={currentPath}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
}