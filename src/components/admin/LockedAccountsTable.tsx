import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Unlock, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface LockedAccount {
  id: string;
  email: string;
  locked_at: string;
  lockout_count: number;
  unlock_at: string;
}

interface LoginAttempt {
  email: string;
  attempted_at: string;
  success: boolean;
  ip_address?: string;
}

export const LockedAccountsTable = () => {
  const [lockedAccounts, setLockedAccounts] = useState<LockedAccount[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<LoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [lockedResponse, attemptsResponse, countResponse] = await Promise.all([
        supabase
          .from('account_lockouts')
          .select('*')
          .order('locked_at', { ascending: false }),
        supabase
          .from('login_attempts')
          .select('email, attempted_at, success, ip_address')
          .order('attempted_at', { ascending: false })
          .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1),
        supabase
          .from('login_attempts')
          .select('*', { count: 'exact', head: true })
      ]);

      if (lockedResponse.error) throw lockedResponse.error;
      if (attemptsResponse.error) throw attemptsResponse.error;
      if (countResponse.error) throw countResponse.error;

      setLockedAccounts(lockedResponse.data || []);
      setRecentAttempts(attemptsResponse.data || []);
      setTotalAttempts(countResponse.count || 0);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const unlockAccount = async (email: string) => {
    try {
      const { error } = await supabase
        .from('account_lockouts')
        .delete()
        .eq('email', email);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account unlocked successfully",
      });

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error unlocking account:', error);
      toast({
        title: "Error",
        description: "Failed to unlock account",
        variant: "destructive",
      });
    }
  };

  const getTimeRemaining = (unlockAt: string) => {
    const unlockTime = new Date(unlockAt);
    const now = new Date();
    const timeRemaining = Math.max(0, Math.ceil((unlockTime.getTime() - now.getTime()) / 1000));
    
    if (timeRemaining === 0) return 'Expired';
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  const getLockoutBadgeVariant = (count: number) => {
    if (count === 1) return 'default';
    if (count === 2) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return <div className="p-4">Loading security data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Locked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Locked Accounts
          </CardTitle>
          <CardDescription>
            Accounts that are currently locked due to failed login attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lockedAccounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No accounts currently locked</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Locked At</TableHead>
                  <TableHead>Lockout Count</TableHead>
                  <TableHead>Unlocks In</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lockedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.email}</TableCell>
                    <TableCell>{new Date(account.locked_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getLockoutBadgeVariant(account.lockout_count)}>
                        {account.lockout_count}
                      </Badge>
                    </TableCell>
                    <TableCell>{getTimeRemaining(account.unlock_at)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unlockAccount(account.email)}
                        className="flex items-center gap-1"
                      >
                        <Unlock className="h-3 w-3" />
                        Unlock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Login Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Login Attempts
          </CardTitle>
          <CardDescription>
            Latest login attempts across all company users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(0);
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">records</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalAttempts)} of {totalAttempts}
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-2">Email</TableHead>
                  <TableHead className="py-2">Time</TableHead>
                  <TableHead className="py-2">Result</TableHead>
                  <TableHead className="py-2">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttempts.map((attempt, index) => (
                  <TableRow key={index} className="h-10">
                    <TableCell className="py-2 font-medium text-sm">{attempt.email}</TableCell>
                    <TableCell className="py-2 text-sm">
                      {new Date(attempt.attempted_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge 
                        variant={attempt.success ? 'default' : 'destructive'}
                        className="text-xs px-2 py-0.5"
                      >
                        {attempt.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                      {attempt.ip_address || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {Math.ceil(totalAttempts / pageSize)}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={(currentPage + 1) * pageSize >= totalAttempts}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};