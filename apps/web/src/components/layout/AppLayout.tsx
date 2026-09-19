import { ReactNode } from 'react';
import Sidebar from './Sidebar';

import Breadcrumb from "./Breadcrumb";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-auto bg-surface">
        <main className="p-6 lg:p-8"><Breadcrumb />{children}</main>
      </div>
    </div>
  );
}