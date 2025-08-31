import { ButtonLink } from '@/components/ui/ButtonLink';
import React from 'react';

export default function Page() {
  return (
    <main>
      <div className="mt-28 flex flex-col items-center sm:mt-36">
        <h1 className="mt-4 px-5 text-center text-2xl sm:text-5xl">
          A responsive and accessible full stack social media web app.
        </h1>
        <h1 className="mt-4 text-lg">Developed by Eshwari Patel</h1>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/login" size="medium">
            Get Started
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
