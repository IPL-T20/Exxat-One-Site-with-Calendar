import { useState } from 'react';
import { mockJobs, mockCandidates, CANDIDATE_STAGES } from '../../data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Briefcase,
  Users,
  Eye,
  Clock,
  TrendingUp,
  Trophy,
  Sparkles,
  Target,
  BarChart3,
  Zap,
} from 'lucide-react@0.487.0';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function JobsOverview() {
  // Calculate insights from the data
  const insights = {
    activeJobs: mockJobs.filter((j) => j.status === 'Active').length,
    draftJobs: mockJobs.filter((j) => j.status === 'Draft').length,
    closedJobs: mockJobs.filter((j) => j.status === 'Closed').length,
    totalApplications: mockCandidates.length,
    avgApplications: Math.round(mockCandidates.length / mockJobs.length),
    totalViews: mockJobs.reduce((sum, job) => sum + job.views, 0),
    avgViews: Math.round(
      mockJobs.reduce((sum, job) => sum + job.views, 0) / mockJobs.length,
    ),
    avgDaysToClose: (() => {
      const closedJobs = mockJobs.filter((j) => j.status === 'Closed');
      if (closedJobs.length === 0) return 0;
      const totalDays = closedJobs.reduce((sum, job) => {
        const posted = new Date(job.postedDate);
        const closed = new Date(job.lastUpdated);
        const days = Math.floor(
          (closed.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24),
        );
        return sum + days;
      }, 0);
      return Math.round(totalDays / closedJobs.length);
    })(),
    topJobs: mockJobs
      .map((job) => ({
        id: job.id,
        title: job.title,
        applications: mockCandidates.filter((c) => c.jobId === job.id).length,
        views: job.views,
      }))
      .sort((a, b) => b.applications - a.applications),
    lowApplicationJobs: mockJobs.filter(
      (job) => mockCandidates.filter((c) => c.jobId === job.id).length < 5,
    ),
    highViewsLowApps: mockJobs.filter((job) => {
      const apps = mockCandidates.filter((c) => c.jobId === job.id).length;
      return job.views > 100 && apps < 10;
    }),
  };

  // Chart data
  const chartData = {
    statusData: [
      {
        name: 'Active',
        value: insights.activeJobs,
        color: '#10B981',
      },
      {
        name: 'Draft',
        value: insights.draftJobs,
        color: '#F59E0B',
      },
      {
        name: 'Closed',
        value: insights.closedJobs,
        color: '#EF4444',
      },
      {
        name: 'On Hold',
        value: mockJobs.filter((j) => j.status === 'On Hold').length,
        color: '#9CA3AF',
      },
    ].filter((item) => item.value > 0),

    disciplineData: (() => {
      const disciplineCounts: Record<string, number> = {};
      mockJobs.forEach((job) => {
        disciplineCounts[job.discipline] =
          (disciplineCounts[job.discipline] || 0) + 1;
      });
      return Object.entries(disciplineCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    })(),

    jobTypeData: (() => {
      const typeCounts: Record<string, number> = {};
      mockJobs.forEach((job) => {
        typeCounts[job.jobType] = (typeCounts[job.jobType] || 0) + 1;
      });
      return Object.entries(typeCounts).map(([name, value]) => ({
        name,
        value,
      }));
    })(),

    locationData: (() => {
      const locationCounts: Record<string, number> = {};
      mockJobs.forEach((job) => {
        locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
      });
      return Object.entries(locationCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    })(),
  };

  return (
    <div className="w-full sm:px-6 sm:py-6 px-[0px] py-[24px]">
      <div className="space-y-6 px-[24px] pt-[0px] pr-[0px] pb-[24px] pl-[0px] mt-[0px] mr-[24px] mb-[24px] ml-[24px]">
        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-['Roboto'] text-gray-600 flex items-center gap-2">
                <Briefcase className="w-4 h-4" aria-hidden="true" />
                Total Job Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['Roboto'] font-bold text-gray-900 text-[24px]">
                {mockJobs.length}
              </div>
              <p className="font-['Roboto'] text-gray-600 mt-1">
                {insights.activeJobs} active • {insights.draftJobs} draft •{' '}
                {insights.closedJobs} closed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-['Roboto'] text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" aria-hidden="true" />
                Total Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['Roboto'] font-bold text-[#3F51B5] text-[24px]">
                {insights.totalApplications}
              </div>
              <p className="font-['Roboto'] text-gray-600 mt-1">
                {insights.avgApplications} avg per job
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-['Roboto'] text-gray-600 flex items-center gap-2">
                <Eye className="w-4 h-4" aria-hidden="true" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['Roboto'] font-bold text-blue-600 text-[24px]">
                {insights.totalViews.toLocaleString()}
              </div>
              <p className="font-['Roboto'] text-gray-600 mt-1">
                {insights.avgViews} avg per job
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-['Roboto'] text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4" aria-hidden="true" />
                Avg Time to Close
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['Roboto'] font-bold text-green-600 text-[24px]">
                {insights.avgDaysToClose > 0
                  ? `${insights.avgDaysToClose} days`
                  : 'N/A'}
              </div>
              <p className="font-['Roboto'] text-gray-600 mt-1">
                {insights.closedJobs} job{insights.closedJobs !== 1 ? 's' : ''}{' '}
                filled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="font-['Roboto'] flex items-center gap-2">
                <TrendingUp
                  className="w-5 h-5 text-[#3F51B5]"
                  aria-hidden="true"
                />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <p className="font-['Roboto'] font-medium text-gray-900">
                    Top Performing Jobs
                  </p>
                </div>
                <div className="space-y-3">
                  {insights.topJobs.slice(0, 3).map((job, index) => (
                    <div key={job.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#3F51B5]/10 flex items-center justify-center">
                        <span className="font-['Roboto'] text-xs font-medium text-[#3F51B5]">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-['Roboto'] text-[#212121] font-medium truncate">
                          {job.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="font-['Roboto'] text-[#616161] text-sm">
                            {job.applications || 0} applications
                          </p>
                          {job.views && (
                            <>
                              <span className="text-gray-300">•</span>
                              <p className="font-['Roboto'] text-[#616161] text-sm">
                                {job.views} views
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Smart Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="font-['Roboto'] flex items-center gap-2">
                <Sparkles
                  className="w-5 h-5 text-[#3F51B5]"
                  aria-hidden="true"
                />
                Smart Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-gray-200">
              {insights.draftJobs > 0 && (
                <div className="flex items-start gap-3 py-4 first:pt-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 pt-0.5">
                    <Zap className="w-5 h-5 text-[#212121]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Roboto'] font-medium text-[#212121] mb-1">
                      Publish Draft Jobs
                    </p>
                    <p className="font-['Roboto'] text-[#616161]">
                      You have {insights.draftJobs} draft job
                      {insights.draftJobs > 1 ? 's' : ''} waiting to be
                      published. Complete and publish to start receiving
                      applications.
                    </p>
                  </div>
                </div>
              )}

              {insights.activeJobs > 0 && (
                <div className="flex items-start gap-3 py-4 first:pt-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 pt-0.5">
                    <Sparkles className="w-5 h-5 text-[#212121]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Roboto'] font-medium text-[#212121] mb-1">
                      Use AI Matching
                    </p>
                    <p className="font-['Roboto'] text-[#616161]">
                      Let AI find the best candidates for your{' '}
                      {insights.activeJobs} active job
                      {insights.activeJobs > 1 ? 's' : ''}. Save time and
                      improve hiring quality.
                    </p>
                  </div>
                </div>
              )}

              {insights.lowApplicationJobs.length > 0 && (
                <div className="flex items-start gap-3 py-4 first:pt-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 pt-0.5">
                    <TrendingUp className="w-5 h-5 text-[#212121]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Roboto'] font-medium text-[#212121] mb-1">
                      Boost Low-Performing Jobs
                    </p>
                    <p className="font-['Roboto'] text-[#616161]">
                      {insights.lowApplicationJobs.length} job
                      {insights.lowApplicationJobs.length > 1 ? 's have' : ' has'}{' '}
                      fewer than 5 applications. Consider updating descriptions
                      or using AI discovery.
                    </p>
                  </div>
                </div>
              )}

              {insights.highViewsLowApps.length > 0 && (
                <div className="flex items-start gap-3 py-4 first:pt-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 pt-0.5">
                    <Target className="w-5 h-5 text-[#212121]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Roboto'] font-medium text-[#212121] mb-1">
                      Optimize High-Traffic Jobs
                    </p>
                    <p className="font-['Roboto'] text-[#616161]">
                      {insights.highViewsLowApps.length} job
                      {insights.highViewsLowApps.length > 1 ? 's are' : ' is'}{' '}
                      getting views but low applications. Review requirements and
                      application process.
                    </p>
                  </div>
                </div>
              )}

              {insights.closedJobs > 0 && insights.avgDaysToClose > 0 && (
                <div className="flex items-start gap-3 py-4 first:pt-0">
                  <div className="flex-shrink-0 pt-0.5">
                    <Trophy className="w-5 h-5 text-[#212121]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Roboto'] font-medium text-[#212121] mb-1">
                      Great Hiring Performance
                    </p>
                    <p className="font-['Roboto'] text-[#616161]">
                      You're filling positions in an average of{' '}
                      {insights.avgDaysToClose} days. Keep up the momentum!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 py-4 first:pt-0 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex-shrink-0 pt-0.5">
                  <BarChart3 className="w-5 h-5 text-[#212121]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Roboto'] font-medium text-[#212121] mb-1">
                    Review Detailed Analytics
                  </p>
                  <p className="font-['Roboto'] text-[#616161]">
                    Dive deeper into your {insights.totalApplications} total
                    applications and recruitment metrics below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Status Distribution - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-['Roboto']">
                Job Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4 flex-wrap">
                {chartData.statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: item.color,
                      }}
                    ></div>
                    <span className="font-['Roboto'] text-gray-700">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Jobs by Discipline - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-['Roboto']">
                Jobs by Discipline (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.disciplineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontFamily: 'Roboto' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontFamily: 'Roboto' }} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: 'Roboto',
                    }}
                  />
                  <Bar dataKey="value" fill="#3F51B5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Jobs by Type - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-['Roboto']">Jobs by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.jobTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontFamily: 'Roboto' }} />
                  <YAxis tick={{ fontFamily: 'Roboto' }} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: 'Roboto',
                    }}
                  />
                  <Bar dataKey="value" fill="#5C6BC0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Jobs by Location - Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="font-['Roboto']">
                Jobs by Location (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.locationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontFamily: 'Roboto' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontFamily: 'Roboto' }} />
                  <Tooltip
                    contentStyle={{
                      fontFamily: 'Roboto',
                    }}
                  />
                  <Bar dataKey="value" fill="#0F996B" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
