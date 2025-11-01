import { ReactNode } from 'react';

import { AppShell } from '../../components/layout/AppShell';

type Props = {
  children: ReactNode;
};

export default function AdminLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
