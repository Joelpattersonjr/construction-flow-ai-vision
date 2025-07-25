import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, CheckCircle, BarChart3, Calendar, Settings } from 'lucide-react';
import { WIDGET_CONFIGS } from './widgets';
import { WidgetType } from '@/types/dashboard';

interface WidgetSelectorProps {
  onSelect: (widgetType: WidgetType) => void;
}

export const WidgetSelector: React.FC<WidgetSelectorProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = {
    all: { label: 'All Widgets', icon: Settings },
    forms: { label: 'Forms', icon: FileText },
    approvals: { label: 'Approvals', icon: CheckCircle },
    analytics: { label: 'Analytics', icon: BarChart3 },
    other: { label: 'Other', icon: Calendar }
  };

  const categorizeWidget = (type: WidgetType): keyof typeof categories => {
    if (type.includes('form')) return 'forms';
    if (type.includes('approval')) return 'approvals';
    if (type.includes('analytics')) return 'analytics';
    return 'other';
  };

  const filteredWidgets = Object.entries(WIDGET_CONFIGS).filter(([type, config]) => {
    const matchesSearch = 
      config.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      categorizeWidget(type as WidgetType) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getWidgetsByCategory = (category: keyof typeof categories) => {
    if (category === 'all') return filteredWidgets;
    return filteredWidgets.filter(([type]) => categorizeWidget(type as WidgetType) === category);
  };

  const renderWidgetCard = ([type, config]: [string, typeof WIDGET_CONFIGS[WidgetType]]) => (
    <Card key={type} className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{config.title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {categorizeWidget(type as WidgetType)}
          </Badge>
        </div>
        <CardDescription className="text-sm">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {config.defaultSize.width} × {config.defaultSize.height}
          </div>
          <Button 
            size="sm" 
            onClick={() => onSelect(type as WidgetType)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Add Widget
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search widgets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(categories).map(([key, category]) => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={key} value={key} className="text-xs">
                <IconComponent className="h-3 w-3 mr-1" />
                {category.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(categories).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getWidgetsByCategory(key as keyof typeof categories).map(renderWidgetCard)}
            </div>
            
            {getWidgetsByCategory(key as keyof typeof categories).length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No widgets found</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};