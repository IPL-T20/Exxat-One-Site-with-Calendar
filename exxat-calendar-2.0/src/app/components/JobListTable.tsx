import { FontAwesomeIcon } from './font-awesome-icon';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { JobOpening } from '../data/mockData';

interface JobListTableProps {
  jobs: JobOpening[];
  selectedJobs: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectJob: (jobId: string, checked: boolean) => void;
  onRowClick?: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
  onViewCandidates: (jobId: string) => void;
  onEdit: (jobId: string) => void;
  onClone: (jobId: string) => void;
  onDelete: (jobId: string) => void;
  formatDate: (date: string) => string;
  formatRelativeDate: (date: string) => string;
  getJobTypeBadgeColor: (jobType: string) => string;
}

export function JobListTable({
  jobs,
  selectedJobs,
  onSelectAll,
  onSelectJob,
  onRowClick,
  onViewDetails,
  onViewCandidates,
  onEdit,
  onClone,
  onDelete,
  formatDate,
  formatRelativeDate,
  getJobTypeBadgeColor,
}: JobListTableProps) {
  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  const handleSelectJob = (jobId: string, checked: boolean) => {
    onSelectJob(jobId, checked);
  };

  const handleViewDetailsWrapper = (jobId: string) => {
    onViewDetails(jobId);
  };

  // Calculate indeterminate state for select all checkbox
  const allChecked = jobs.length > 0 && selectedJobs.length === jobs.length;
  const someChecked = selectedJobs.length > 0 && selectedJobs.length < jobs.length;
  const selectAllChecked: true | false | "indeterminate" = allChecked
    ? true
    : someChecked
    ? "indeterminate"
    : false;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F1E9FE]">
            <TableHead className="w-11 min-w-11 max-w-11 border-r border-gray-200 text-center !px-0">
              <div className="inline-flex items-center justify-center w-full h-full">
                <Checkbox
                  checked={selectAllChecked}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                  aria-label="Select all jobs"
                />
              </div>
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Title
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Job Type
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Location
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Discipline
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Status
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Posted On
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Views
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto'] w-20">
              Candidates
            </TableHead>
            <TableHead className="font-medium border-r border-gray-200 text-xs tracking-wider uppercase font-['Roboto']">
              Last Updated
            </TableHead>
            <TableHead className="font-medium w-16 text-xs tracking-wider uppercase font-['Roboto']">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onRowClick?.(job.id)}
            >
              <TableCell
                className="border-r border-gray-200 w-11 min-w-11 max-w-11 text-center !p-0"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '44px', minWidth: '44px', maxWidth: '44px' }}
              >
                <div className="inline-flex items-center justify-center w-full h-full">
                  <Checkbox
                    checked={selectedJobs.includes(job.id)}
                    onCheckedChange={(checked) =>
                      handleSelectJob(job.id, checked as boolean)
                    }
                    aria-label={`Select ${job.title}`}
                  />
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="space-y-1.5">
                  <div className="font-medium text-gray-900 font-['Roboto']">
                    {job.title}
                  </div>
                  {job.atsSource && job.atsSourceName && (
                    <Badge variant="secondary" className="text-xs">
                      {job.atsSourceName}
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <Badge
                  className={`${getJobTypeBadgeColor(job.jobType)} font-['Roboto']`}
                  variant="secondary"
                >
                  {job.jobType}
                </Badge>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="space-y-1">
                  <div className="font-medium text-gray-900 flex items-center gap-1 font-['Roboto']">
                    <FontAwesomeIcon name="building" className="w-3 h-3 text-gray-400" />
                    {job.hospitalName}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 font-['Roboto']">
                    <FontAwesomeIcon name="locationDot" className="w-3 h-3 text-gray-400" />
                    {job.location}
                  </div>
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="space-y-1">
                  <div className="font-medium text-gray-900 font-['Roboto']">
                    {job.discipline}
                  </div>
                  <div className="text-sm text-gray-600 font-['Roboto']">
                    {job.department}
                  </div>
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <Badge
                  className={`font-['Roboto'] ${
                    job.status === 'Active'
                      ? 'bg-green-100 text-green-800 hover:bg-green-100'
                      : job.status === 'Draft'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                      : job.status === 'Closed'
                      ? 'bg-red-100 text-red-800 hover:bg-red-100'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                  }`}
                  variant="secondary"
                >
                  {job.status}
                </Badge>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-600 font-['Roboto']">
                  <FontAwesomeIcon name="calendar" className="w-3 h-3" />
                  {formatDate(job.postedDate)}
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-600 font-['Roboto']">
                  <FontAwesomeIcon name="eye" className="w-3 h-3" />
                  {job.views.toLocaleString()}
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-600 font-['Roboto']">
                  <FontAwesomeIcon name="users" className="w-3 h-3" />
                  {job.activeCandidates}
                </div>
              </TableCell>

              <TableCell className="border-r border-gray-200">
                <div className="text-sm text-gray-600 font-['Roboto']">
                  {formatRelativeDate(job.lastUpdated)}
                </div>
              </TableCell>

              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                      aria-label={`Actions for ${job.title}`}
                    >
                      <FontAwesomeIcon name="ellipsisVertical" className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="font-['Roboto']">
                    <DropdownMenuItem onClick={() => handleViewDetailsWrapper(job.id)}>
                      <FontAwesomeIcon name="eye" className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewCandidates(job.id)}>
                      <FontAwesomeIcon name="users" className="mr-2 h-4 w-4" />
                      View Candidates
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(job.id)}>
                      <FontAwesomeIcon name="penToSquare" className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onClone(job.id)}>
                      <FontAwesomeIcon name="copy" className="mr-2 h-4 w-4" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(job.id)} className="text-red-600">
                      <FontAwesomeIcon name="trash" className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}