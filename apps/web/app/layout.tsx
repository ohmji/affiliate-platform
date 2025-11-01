import type { Metadata } from 'next';
import { ReactNode } from 'react';

import ThemeRegistry from '../components/ThemeRegistry';
import { AppProviders } from '../components/AppProviders';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Affiliate Platform Portal',
  description: 'Product comparison, campaign orchestration, and analytics dashboard.'
};

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <AppProviders>{children}</AppProviders>
        </ThemeRegistry>
      </body>
    </html>
  );
}
