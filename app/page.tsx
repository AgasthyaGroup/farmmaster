'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Beef } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white gap-6">
      <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30 animate-pulse">
        <Beef className="w-10 h-10 text-white" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight">FarmMaster</h1>
        <div className="flex items-center gap-2 text-gray-500 text-sm">
           <Loader2 className="w-4 h-4 animate-spin" />
           <span>Initializing system...</span>
        </div>
      </div>
    </div>
  );
}
