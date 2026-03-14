import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { School, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <span className="text-[120px] font-black text-muted-foreground/20 leading-none select-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <School className="h-16 w-16 text-muted-foreground/40" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The page you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
        <Link to="/dashboard">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
