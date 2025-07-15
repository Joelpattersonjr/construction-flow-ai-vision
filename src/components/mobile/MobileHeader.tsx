import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Menu, 
  Bell,
  Wifi,
  WifiOff,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  onBack?: () => void;
  onMenuToggle?: () => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBack = false,
  showMenu = true,
  showSearch = false,
  showNotifications = true,
  notificationCount = 0,
  onBack,
  onMenuToggle,
  onSearch,
  onNotifications,
  className
}) => {
  const { isOnline } = useOfflineStorage();

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-b border-border shadow-sm",
      className
    )}>
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {showBack && onBack && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          {showMenu && !showBack && onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onMenuToggle}
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Center Section */}
        <div className="flex-1 mx-4">
          <h1 className="text-lg font-semibold text-foreground truncate text-center">
            {title}
          </h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="flex items-center">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </div>

          {/* Search */}
          {showSearch && onSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Notifications */}
          {showNotifications && onNotifications && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 relative"
              onClick={onNotifications}
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};