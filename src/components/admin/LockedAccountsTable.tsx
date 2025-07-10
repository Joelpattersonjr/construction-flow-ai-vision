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
import { AlertCircle, Unlock, Shield } from 'lucide-react';

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
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [lockedResponse, attemptsResponse] = await Promise.all([
        supabase
          .from('account_lockouts')
          .select('*')
          .order('locked_at', { ascending: false }),
        supabase
          .from('login_attempts')
          .select('email, attempted_at, success, ip_address')
          .order('attempted_at', { ascending: false })
          .limit(20)
      ]);

      if (lockedResponse.error) throw lockedResponse.error;
      if (attemptsResponse.error) throw attemptsResponse.error;

      setLockedAccounts(lockedResponse.data || []);
      setRecentAttempts(attemptsResponse.data || []);
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
  }, []);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Attempted At</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttempts.map((attempt, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{attempt.email}</TableCell>
                  <TableCell>{new Date(attempt.attempted_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={attempt.success ? 'default' : 'destructive'}>
                      {attempt.success ? 'Success' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {attempt.ip_address || 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};