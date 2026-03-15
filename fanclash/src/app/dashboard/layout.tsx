import Sidebar from '@/components/dashboard/Sidebar';
import DashboardNotifications from '@/components/dashboard/DashboardNotifications';
import NotificationCenter from '@/components/dashboard/NotificationCenter';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Top bar with notification center */}
        <div className="hidden md:flex items-center justify-end px-8 py-3 border-b border-gray-800/50">
          <NotificationCenter />
        </div>
        <main className="flex-1 p-4 md:p-8 mt-14 md:mt-0">{children}</main>
      </div>
      <DashboardNotifications />
    </div>
  );
}
