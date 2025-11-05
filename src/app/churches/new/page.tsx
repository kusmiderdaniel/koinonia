'use client';

import { CreateChurchForm } from '@/components/church/CreateChurchForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewChurchPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/churches"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Churches
        </Link>
        <h1 className="text-3xl font-bold">Create a New Church</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create your church organization. You will be set as the administrator.
        </p>
      </div>

      <CreateChurchForm />
    </div>
  );
}
