import { useState } from 'react';
import { FilterBar } from '../FilterBar';
import { JobListTable } from '../JobListTable';
import { mockJobs } from '../../data/mockData';

export function JobsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  // Get unique values for filters
  const getUniqueDisciplines = () => {
    const disciplines = mockJobs.map(job => job.discipline);
    return ['All', ...Array.from(new Set(disciplines))];
  };

  const getUniqueLocations = () => {
    const locations = mockJobs.map(job => job.location);
    return ['All', ...Array.from(new Set(locations))];
  };

  const getUniqueJobTypes = () => {
    const jobTypes = mockJobs.map(job => job.jobType);
    return ['All', ...Array.from(new Set(jobTypes))];
  };

  const getUniqueStatuses = () => {
    const statuses = mockJobs.map(job => job.status);
    return ['All', ...Array.from(new Set(statuses))];
  };

  // Filter jobs based on criteria
  const getFilteredJobs = () => {
    return mockJobs.filter(job => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.hospitalName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDiscipline = selectedDiscipline === 'All' || job.discipline === selectedDiscipline;
      const matchesLocation = selectedLocation === 'All' || job.location === selectedLocation;
      const matchesJobType = selectedJobType === 'All' || job.jobType === selectedJobType;
      const matchesStatus = selectedStatus === 'All' || job.status === selectedStatus;

      return matchesSearch && matchesDiscipline && matchesLocation && matchesJobType && matchesStatus;
    });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDiscipline('All');
    setSelectedLocation('All');
    setSelectedJobType('All');
    setSelectedStatus('All');
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(getFilteredJobs().map(job => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    if (checked) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  const handleRowClick = (jobId: string) => {
    console.log('Row clicked:', jobId);
  };

  const handleViewDetails = (jobId: string) => {
    console.log('View details:', jobId);
  };

  const handleViewCandidates = (jobId: string) => {
    console.log('View candidates:', jobId);
  };

  const handleEdit = (jobId: string) => {
    console.log('Edit job:', jobId);
  };

  const handleClone = (jobId: string) => {
    console.log('Clone job:', jobId);
  };

  const handleDelete = (jobId: string) => {
    console.log('Delete job:', jobId);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeDate = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffInDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return formatDate(date);
  };

  const getJobTypeBadgeColor = (jobType: string) => {
    switch (jobType) {
      case 'Full-Time':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'Part-Time':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      case 'Contract':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Filter Bar - Attached to table */}
          <div className="border-b border-gray-200">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedDiscipline={selectedDiscipline}
              onDisciplineChange={setSelectedDiscipline}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              selectedJobType={selectedJobType}
              onJobTypeChange={setSelectedJobType}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              disciplineOptions={getUniqueDisciplines()}
              locationOptions={getUniqueLocations()}
              jobTypeOptions={getUniqueJobTypes()}
              statusOptions={getUniqueStatuses()}
              onClearFilters={handleClearFilters}
            />
          </div>
          {/* Data Table - No spacing from filter */}
          <JobListTable
            jobs={getFilteredJobs()}
            selectedJobs={selectedJobs}
            onSelectAll={handleSelectAll}
            onSelectJob={handleSelectJob}
            onRowClick={handleRowClick}
            onViewDetails={handleViewDetails}
            onViewCandidates={handleViewCandidates}
            onEdit={handleEdit}
            onClone={handleClone}
            onDelete={handleDelete}
            formatDate={formatDate}
            formatRelativeDate={formatRelativeDate}
            getJobTypeBadgeColor={getJobTypeBadgeColor}
          />
        </div>
      </div>
    </div>
  );
}