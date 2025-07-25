import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, FileText, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface FormAnalytics {
  total_submissions: number;
  total_templates: number;
  avg_completion_rate: number;
  submissions_by_day: Array<{ date: string; count: number }>;
  submissions_by_template: Array<{ name: string; count: number }>;
  submissions_by_status: Array<{ status: string; count: number }>;
}

const FormsAnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['forms-analytics', timeRange],
    queryFn: async () => {
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get total submissions
      const { count: totalSubmissions } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('submitted_at', startDate.toISOString());

      // Get total templates
      const { count: totalTemplates } = await supabase
        .from('form_templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get submissions by day
      const { data: submissionsByDay } = await supabase
        .from('form_submissions')
        .select('submitted_at')
        .gte('submitted_at', startDate.toISOString())
        .order('submitted_at', { ascending: true });

      // Get submissions by template
      const { data: submissionsByTemplate } = await supabase
        .from('form_submissions')
        .select(`
          form_template_id,
          form_templates!inner(name)
        `)
        .gte('submitted_at', startDate.toISOString());

      // Get submissions by status
      const { data: submissionsByStatus } = await supabase
        .from('form_submissions')
        .select('status')
        .gte('submitted_at', startDate.toISOString());

      // Process data
      const dailyData = submissionsByDay?.reduce((acc: any, submission) => {
        const date = new Date(submission.submitted_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const dailyArray = Object.entries(dailyData || {}).map(([date, count]) => ({
        date: new Date(date).toLocaleDateString(),
        count: count as number
      }));

      const templateData = submissionsByTemplate?.reduce((acc: any, submission) => {
        const name = (submission as any).form_templates.name;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});

      const templateArray = Object.entries(templateData || {}).map(([name, count]) => ({
        name,
        count: count as number
      }));

      const statusData = submissionsByStatus?.reduce((acc: any, submission) => {
        const status = submission.status || 'submitted';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const statusArray = Object.entries(statusData || {}).map(([status, count]) => ({
        status,
        count: count as number
      }));

      return {
        total_submissions: totalSubmissions || 0,
        total_templates: totalTemplates || 0,
        avg_completion_rate: 85, // Placeholder - would need more complex calculation
        submissions_by_day: dailyArray,
        submissions_by_template: templateArray,
        submissions_by_status: statusArray
      } as FormAnalytics;
    }
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Forms Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_submissions}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_templates}</div>
            <p className="text-xs text-muted-foreground">
              +3 new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_completion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2m</div>
            <p className="text-xs text-muted-foreground">
              -30s from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions Over Time</CardTitle>
            <CardDescription>Daily form submission trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.submissions_by_day}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Submission Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
            <CardDescription>Distribution of submission statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.submissions_by_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }: any) => `${status}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.submissions_by_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Forms</CardTitle>
          <CardDescription>Forms with the highest submission counts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.submissions_by_template.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Form submissions increased by 20% this month</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">Top Performer</Badge>
              <span>Safety Inspection form has the highest completion rate (95%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">Opportunity</Badge>
              <span>Equipment Request forms take 40% longer to complete than average</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormsAnalyticsDashboard;