import Sidebar from '@/components/dashboard/Sidebar';
import DashboardNotifications from '@/components/dashboard/DashboardNotifications';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 mt-14 md:mt-0">{children}</main>
      <DashboardNotifications />
    </div>
  );
}
