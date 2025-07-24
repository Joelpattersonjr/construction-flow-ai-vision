import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherHistoryViewer } from '@/components/weather/WeatherHistoryViewer';
import { WeatherTrendsChart } from '@/components/weather/WeatherTrendsChart';
import { EnhancedWeatherCard } from '@/components/weather/EnhancedWeatherCard';
import { WeatherErrorBoundaryWrapper } from '@/components/weather/WeatherErrorBoundary';
import { useWeatherURL } from '@/hooks/useWeatherURL';

const WeatherAnalytics = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { urlState, updateURL } = useWeatherURL();

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">Project ID is required to view weather analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <WeatherErrorBoundaryWrapper>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Weather Analytics</h1>
              <p className="text-muted-foreground">
                Comprehensive weather data and insights for your project
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={urlState.tab || 'live'}
          onValueChange={(value) => updateURL({ tab: value as 'live' | 'history' | 'trends' })}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live">Live Weather</TabsTrigger>
            <TabsTrigger value="history">Historical Data</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="live" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Current Weather Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedWeatherCard projectId={projectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Historical Weather Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeatherHistoryViewer projectId={projectId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Weather Trends & Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeatherTrendsChart projectId={projectId} />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </WeatherErrorBoundaryWrapper>
  );
};

export default WeatherAnalytics;