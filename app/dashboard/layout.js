'use client';
import { AppSidebar } from "../components/app-sidebar"
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb"
import { Separator } from "../components/ui/separator"
import { useState } from 'react';
import { useTheme } from '../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  FileText,
  Shield,
  Sun,
  Moon,
  Folder
} from 'lucide-react';
export default function DashboardLayout({ children }) {
  const { user, loading, logout, isOwner, isAdmin, isDev } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  // Get the last segment after the last '/'
  const lastSegment = pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  // Format: replace dashes with spaces and capitalize
  const pageTitle = lastSegment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen min-w-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

 

  // const roleBadge = getRoleBadge();

  return (
    <div className="min-h-screen bg-background min-[1024px]:flex w-screen overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0 ">
       

        {/* Page content */}
        <main className="px-8 py-0 mainfile min-h-screen min-w-screen">
        <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
      <header
          className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger/>
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Main Menu
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
          {children}
          </SidebarInset>
          </SidebarProvider>
        </main>
      </div>
    </div>
  );
} 