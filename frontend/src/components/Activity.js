import React from 'react';

export default function Activity() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-semibold text-foreground mb-4">My Activity</h1>
      <div className="rounded-md border border-input bg-background p-4">
        <p className="text-muted-foreground text-sm">Your recent actions and application activity will appear here.</p>
      </div>
    </div>
  );
}


