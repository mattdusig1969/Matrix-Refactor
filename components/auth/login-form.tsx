'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase'; // <-- Import from our new utility
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'react-hot-toast';

export const LoginForm = () => {
  const router = useRouter();
  const supabase = createClient(); // <-- Use the new helper function

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.loading('Signing in...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    toast.dismiss();
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-blue-800">
      <Toaster />
      <Card className="w-[400px] shadow-md">
        <CardHeader>
          <h2 className="text-2xl font-semibold text-center">Welcome Back</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
            <Button variant="link" className="w-full" onClick={() => router.back()}>
                Back to home
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
};