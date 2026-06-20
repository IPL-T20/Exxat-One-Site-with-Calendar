import { PageHeader } from './PageHeader';
import { JobsOverview } from './jobs/JobsOverview';
import { JobsList } from './jobs/JobsList';

interface JobsPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function JobsPage({ currentPath, onNavigate }: JobsPageProps) {
  // Determine active tab from current path
  const getActiveTab = () => {
    if (currentPath === '/jobs/list') return 'List';
    return 'Overview'; // Default to Overview for /jobs or /jobs/overview
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: string) => {
    const tabRoutes: Record<string, string> = {
      'Overview': '/jobs/overview',
      'List': '/jobs/list',
    };
    onNavigate(tabRoutes[tab] || '/jobs/overview');
  };

  const handlePostJob = () => {
    console.log('Post Job clicked');
    // Handle job posting logic
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'List':
        return <JobsList />;
      default:
        return <JobsOverview />;
    }
  };

  return (
    <div className="bg-gray-50 font-['Roboto'] w-full min-h-screen">
      <PageHeader
        icon="briefcase"
        title="Job Post"
        description="Manage and track your job postings"
        tabs={["Overview", "List"]}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        actions={[
          {
            label: 'Post Job',
            mobileLabel: 'Post',
            onClick: handlePostJob,
            icon: 'plus',
            variant: 'primary',
          },
        ]}
      />

      {/* Page Content */}
      {renderTabContent()}
    </div>
  );
}