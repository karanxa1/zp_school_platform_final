import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
      <ShieldX className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-3xl font-bold">Access Denied</h1>
      <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
      <Link to="/dashboard"><Button className="mt-6">Go to Dashboard</Button></Link>
    </div>
  );
}
