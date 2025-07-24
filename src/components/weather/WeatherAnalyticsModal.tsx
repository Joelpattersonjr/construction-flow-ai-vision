import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, RefreshCw, Download, Share2 } from 'lucide-react';
import { useWeatherCache } from '@/hooks/useWeatherCache';
import { useWeatherURL } from '@/hooks/useWeatherURL';
import { WeatherService } from '@/services/weatherService';
import { WeatherHistoryViewer } from './WeatherHistoryViewer';
import { WeatherTrendsChart } from './WeatherTrendsChart';
import { WeatherAlertBanner } from './WeatherAlertBanner';
import { WeatherExportDialog } from './WeatherExportDialog';
import { WeatherErrorBoundaryWrapper } from './WeatherErrorBoundary';
import { WeatherCurrentSkeleton } from './WeatherLoadingStates';
import { 
  WeatherMobileContainer, 
  WeatherMobileHeader, 
  WeatherMobileContent,
  WeatherMobileTabs 
} from './WeatherMobileLayout';

interface WeatherAnalyticsModalProps {
  projectId: string;
  projectName: string;
  address?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WeatherAnalyticsModal: React.FC<WeatherAnalyticsModalProps> = ({
  projectId,
  projectName,
  address,
  isOpen,
  onClose,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { urlState, updateURL, generateShareableURL } = useWeatherURL();
  const { weatherData, loading, error, refreshWeather, prefetchHistoricalData } = useWeatherCache(projectId, address);
  
  const activeTab = urlState.tab || 'live';

  const getCurrentWeatherContent = () => {
    if (loading) {
      return <WeatherCurrentSkeleton />;
    }

    if (error || !weatherData) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {error || 'Weather data unavailable'}
          </p>
          {address && (
            <Button onClick={() => refreshWeather(true)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      );
    }

    const dataAge = new Date().getTime() - new Date(weatherData.last_updated).getTime();
    const hoursAgo = Math.floor(dataAge / (1000 * 60 * 60));
    const minutesAgo = Math.floor(dataAge / (1000 * 60));
    
    let freshnessText = 'Just now';
    let freshnessColor = 'bg-green-500';
    
    if (hoursAgo > 0) {
      freshnessText = `${hoursAgo}h ago`;
      freshnessColor = hoursAgo > 2 ? 'bg-orange-500' : 'bg-yellow-500';
    } else if (minutesAgo > 0) {
      freshnessText = `${minutesAgo}m ago`;
      freshnessColor = minutesAgo > 30 ? 'bg-yellow-500' : 'bg-green-500';
    }

    return (
      <div className="space-y-6">
        {/* Weather Alerts */}
        <WeatherAlertBanner projectId={projectId} />
        
        {/* Current Weather Display */}
        <div className="bg-card rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {WeatherService.getWeatherIcon(weatherData.condition)}
              </div>
              <div>
                <div className="text-3xl font-bold">
                  {WeatherService.formatTemperature(weatherData.temperature_current)}
                </div>
                <div className="text-lg text-muted-foreground capitalize">
                  {weatherData.condition}
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge variant="outline" className="text-xs">
                <div className={`w-2 h-2 rounded-full ${freshnessColor} mr-1`} />
                {freshnessText}
              </Badge>
              {address && (
                <Button onClick={() => refreshWeather(true)} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Humidity</div>
              <div className="text-xl font-semibold">{weatherData.humidity}%</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Wind Speed</div>
              <div className="text-xl font-semibold">{weatherData.wind_speed} mph</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Feels Like</div>
              <div className="text-xl font-semibold">
                {WeatherService.formatTemperature(weatherData.temperature_current + 2)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Visibility</div>
              <div className="text-xl font-semibold">10 mi</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <WeatherErrorBoundaryWrapper>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col md:p-6 p-0">
          <div className="hidden md:block">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center justify-between text-xl">
                <span>Weather Analytics - {projectName}</span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsExportOpen(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generateShareableURL(projectId))}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </DialogTitle>
              {address && (
                <DialogDescription className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {address}
                </DialogDescription>
              )}
            </DialogHeader>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden h-full">
            <WeatherMobileContainer>
              <WeatherMobileHeader
                title="Weather Analytics"
                subtitle={projectName}
                actions={
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsExportOpen(true)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                }
              />
              <WeatherMobileContent>
                <div className="space-y-4">
                  <WeatherAlertBanner projectId={projectId} />
                  {activeTab === 'live' && getCurrentWeatherContent()}
                  {activeTab === 'history' && <WeatherHistoryViewer projectId={projectId} />}
                  {activeTab === 'trends' && <WeatherTrendsChart projectId={projectId} />}
                </div>
              </WeatherMobileContent>
              <WeatherMobileTabs
                activeTab={activeTab}
                onTabChange={(tab) => updateURL({ tab: tab as any })}
                tabs={[
                  { key: 'live', label: 'Live' },
                  { key: 'history', label: 'History' },
                  { key: 'trends', label: 'Trends' }
                ]}
              />
            </WeatherMobileContainer>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:block flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={(tab) => updateURL({ tab: tab as any })} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 shrink-0">
                <TabsTrigger value="live">Live Weather</TabsTrigger>
                <TabsTrigger value="history">Historical Data</TabsTrigger>
                <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 pt-4">
                <TabsContent value="live" className="mt-0 h-full overflow-auto scroll-smooth p-1">
                  {getCurrentWeatherContent()}
                </TabsContent>

                <TabsContent value="history" className="mt-0 h-full overflow-auto scroll-smooth p-1">
                  <WeatherHistoryViewer projectId={projectId} />
                </TabsContent>

                <TabsContent value="trends" className="mt-0 h-full overflow-auto scroll-smooth p-1">
                  <WeatherTrendsChart projectId={projectId} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <WeatherExportDialog 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        weatherData={weatherData ? [weatherData] : []}
        projectName={projectName}
      />
    </WeatherErrorBoundaryWrapper>
  );
};