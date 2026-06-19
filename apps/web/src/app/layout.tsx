import type { Metadata } from 'next';
import React from 'react';
import type { ReactNode } from 'react';
import '../globals.css';

export const metadata: Metadata = {
  title: 'CMS-Auto Staff',
  description: 'Staff complaint management shell',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
