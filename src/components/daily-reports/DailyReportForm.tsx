import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { WeatherService } from '@/services/weatherService';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  address?: string;
}

interface TeamMember {
  user_id: string;
  hours_worked: number;
  role_description: string;
  tasks_completed: string;
}

interface DailyReportFormProps {
  projects: Project[];
  onSubmit: () => void;
  onCancel: () => void;
  reportId?: string;
}

export function DailyReportForm({ projects, onSubmit, onCancel, reportId }: DailyReportFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    report_date: format(new Date(), 'yyyy-MM-dd'),
    weather_conditions: '',
    temperature_high: '',
    temperature_low: '',
    work_hours_start: '08:00',
    work_hours_end: '17:00',
    crew_count: 0,
    safety_incidents: 0,
    progress_summary: '',
    work_completed: '',
    delays_issues: '',
    materials_delivered: '',
    equipment_status: '',
    visitors: '',
    photos_taken: 0,
    overall_progress_percentage: 0,
    status: 'draft' as 'draft' | 'submitted' | 'approved'
  });
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    loadCompanyUsers();
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadCompanyUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setCompanyUsers(data || []);
    } catch (error) {
      console.error('Error loading company users:', error);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          daily_report_team_members (*)
        `)
        .eq('id', reportId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          project_id: data.project_id,
          report_date: data.report_date,
          weather_conditions: data.weather_conditions || '',
          temperature_high: data.temperature_high?.toString() || '',
          temperature_low: data.temperature_low?.toString() || '',
          work_hours_start: data.work_hours_start || '08:00',
          work_hours_end: data.work_hours_end || '17:00',
          crew_count: data.crew_count || 0,
          safety_incidents: data.safety_incidents || 0,
          progress_summary: data.progress_summary || '',
          work_completed: data.work_completed || '',
          delays_issues: data.delays_issues || '',
          materials_delivered: data.materials_delivered || '',
          equipment_status: data.equipment_status || '',
          visitors: data.visitors || '',
          photos_taken: data.photos_taken || 0,
          overall_progress_percentage: data.overall_progress_percentage || 0,
          status: data.status as 'draft' | 'submitted' | 'approved'
        });

        setTeamMembers(data.daily_report_team_members || []);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: "Error",
        description: "Failed to load report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      toast({
        title: "Error",
        description: "Please select a project.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const reportData = {
        ...formData,
        temperature_high: formData.temperature_high ? parseInt(formData.temperature_high) : null,
        temperature_low: formData.temperature_low ? parseInt(formData.temperature_low) : null,
        created_by: user.user.id
      };

      let reportResponse;
      if (reportId) {
        const { data, error } = await supabase
          .from('daily_reports')
          .update(reportData)
          .eq('id', reportId)
          .select()
          .single();
        
        if (error) throw error;
        reportResponse = data;
      } else {
        const { data, error } = await supabase
          .from('daily_reports')
          .insert(reportData)
          .select()
          .single();
        
        if (error) throw error;
        reportResponse = data;
      }

      // Handle team members
      if (reportResponse) {
        // Delete existing team members if updating
        if (reportId) {
          await supabase
            .from('daily_report_team_members')
            .delete()
            .eq('daily_report_id', reportId);
        }

        // Insert new team members
        if (teamMembers.length > 0) {
          const teamMembersData = teamMembers.map(member => ({
            daily_report_id: reportResponse.id,
            ...member
          }));

          const { error: teamError } = await supabase
            .from('daily_report_team_members')
            .insert(teamMembersData);

          if (teamError) throw teamError;
        }
      }

      onSubmit();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, {
      user_id: '',
      hours_worked: 8,
      role_description: '',
      tasks_completed: ''
    }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const loadWeatherData = async () => {
    const selectedProject = projects.find(p => p.id === formData.project_id);
    
    if (!formData.project_id || !selectedProject?.address) {
      toast({
        title: "Cannot load weather",
        description: "Please select a project with an address first",
        variant: "destructive"
      });
      return;
    }

    setLoadingWeather(true);
    try {
      const weatherData = await WeatherService.getWeatherForProject(formData.project_id, selectedProject.address);
      
      if (weatherData) {
        setFormData(prev => ({
          ...prev,
          temperature_high: weatherData.temperature_high.toString(),
          temperature_low: weatherData.temperature_low.toString(),
          weather_conditions: weatherData.condition
        }));
        
        toast({
          title: "Weather loaded",
          description: "Weather data has been populated from current conditions"
        });
      } else {
        toast({
          title: "Weather unavailable",
          description: "Could not fetch weather data for this location",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading weather:', error);
      toast({
        title: "Error",
        description: "Failed to load weather data",
        variant: "destructive"
      });
    } finally {
      setLoadingWeather(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="project_id">Project *</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData({...formData, project_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="report_date">Report Date *</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date}
                onChange={(e) => setFormData({...formData, report_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="overall_progress_percentage">Overall Progress (%)</Label>
              <Input
                id="overall_progress_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.overall_progress_percentage}
                onChange={(e) => setFormData({...formData, overall_progress_percentage: parseFloat(e.target.value) || 0})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weather & Work Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weather & Work Hours</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadWeatherData}
                disabled={loadingWeather}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", loadingWeather && "animate-spin")} />
                Load Current Weather
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="weather_conditions">Weather Conditions</Label>
              <Select value={formData.weather_conditions} onValueChange={(value) => setFormData({...formData, weather_conditions: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Sunny</SelectItem>
                  <SelectItem value="cloudy">Cloudy</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="snowy">Snowy</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                  <SelectItem value="foggy">Foggy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temperature_high">High Temp (°F)</Label>
                <Input
                  id="temperature_high"
                  type="number"
                  value={formData.temperature_high}
                  onChange={(e) => setFormData({...formData, temperature_high: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="temperature_low">Low Temp (°F)</Label>
                <Input
                  id="temperature_low"
                  type="number"
                  value={formData.temperature_low}
                  onChange={(e) => setFormData({...formData, temperature_low: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="work_hours_start">Start Time</Label>
                <Input
                  id="work_hours_start"
                  type="time"
                  value={formData.work_hours_start}
                  onChange={(e) => setFormData({...formData, work_hours_start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="work_hours_end">End Time</Label>
                <Input
                  id="work_hours_end"
                  type="time"
                  value={formData.work_hours_end}
                  onChange={(e) => setFormData({...formData, work_hours_end: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crew & Safety */}
      <Card>
        <CardHeader>
          <CardTitle>Crew & Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="crew_count">Crew Count</Label>
              <Input
                id="crew_count"
                type="number"
                min="0"
                value={formData.crew_count}
                onChange={(e) => setFormData({...formData, crew_count: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="safety_incidents">Safety Incidents</Label>
              <Input
                id="safety_incidents"
                type="number"
                min="0"
                value={formData.safety_incidents}
                onChange={(e) => setFormData({...formData, safety_incidents: parseInt(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label htmlFor="photos_taken">Photos Taken</Label>
              <Input
                id="photos_taken"
                type="number"
                min="0"
                value={formData.photos_taken}
                onChange={(e) => setFormData({...formData, photos_taken: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addTeamMember}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No team members added yet.</p>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Team Member {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTeamMember(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Team Member</Label>
                      <Select 
                        value={member.user_id} 
                        onValueChange={(value) => updateTeamMember(index, 'user_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Hours Worked</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={member.hours_worked}
                        onChange={(e) => updateTeamMember(index, 'hours_worked', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Role Description</Label>
                    <Input
                      value={member.role_description}
                      onChange={(e) => updateTeamMember(index, 'role_description', e.target.value)}
                      placeholder="e.g., Site Supervisor, Electrician, etc."
                    />
                  </div>
                  
                  <div>
                    <Label>Tasks Completed</Label>
                    <Textarea
                      value={member.tasks_completed}
                      onChange={(e) => updateTeamMember(index, 'tasks_completed', e.target.value)}
                      placeholder="Describe the tasks completed by this team member..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progress Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="progress_summary">Overall Progress</Label>
              <Textarea
                id="progress_summary"
                value={formData.progress_summary}
                onChange={(e) => setFormData({...formData, progress_summary: e.target.value})}
                placeholder="Describe the overall progress made today..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="work_completed">Work Completed</Label>
              <Textarea
                id="work_completed"
                value={formData.work_completed}
                onChange={(e) => setFormData({...formData, work_completed: e.target.value})}
                placeholder="Detail the specific work completed..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issues & Materials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="delays_issues">Delays & Issues</Label>
              <Textarea
                id="delays_issues"
                value={formData.delays_issues}
                onChange={(e) => setFormData({...formData, delays_issues: e.target.value})}
                placeholder="Document any delays or issues encountered..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="materials_delivered">Materials Delivered</Label>
              <Textarea
                id="materials_delivered"
                value={formData.materials_delivered}
                onChange={(e) => setFormData({...formData, materials_delivered: e.target.value})}
                placeholder="List materials delivered today..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="equipment_status">Equipment Status</Label>
            <Textarea
              id="equipment_status"
              value={formData.equipment_status}
              onChange={(e) => setFormData({...formData, equipment_status: e.target.value})}
              placeholder="Note the status of equipment and machinery..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="visitors">Visitors</Label>
            <Textarea
              id="visitors"
              value={formData.visitors}
              onChange={(e) => setFormData({...formData, visitors: e.target.value})}
              placeholder="Record any visitors to the site..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : reportId ? 'Update Report' : 'Create Report'}
        </Button>
      </div>
    </form>
  );
}