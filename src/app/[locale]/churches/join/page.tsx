'use client';

import { JoinChurchForm } from '@/components/church/JoinChurchForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JoinChurchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 max-w-md mx-auto">
        <Link
          href="/churches"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Churches
        </Link>
      </div>

      <JoinChurchForm />
    </div>
  );
}
