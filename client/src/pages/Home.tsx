import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to Overview page
    setLocation('/overview');
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <h1 className="text-2xl font-medium text-muted-foreground">Loading...</h1>
    </div>
  );
}
