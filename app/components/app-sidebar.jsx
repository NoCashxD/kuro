"use client"

import * as React from "react"
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

import { useAuth } from '../context/AuthContext';
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "./ui/sidebar"

// This is sample data.
// const data = {
 
//   // teams: [
//   //   {
//   //     name: "Acme Inc",
//   //     logo: GalleryVerticalEnd,
//   //     plan: "Enterprise",
//   //   },
//   //   {
//   //     name: "Acme Corp.",
//   //     logo: AudioWaveform,
//   //     plan: "Startup",
//   //   },
//   //   {
//   //     name: "Evil Corp.",
//   //     logo: Command,
//   //     plan: "Free",
//   //   },
//   // ],
//   // navMain: [
//   //   {
//   //     title: "Playground",
//   //     url: "#",
//   //     icon: SquareTerminal,
//   //     isActive: true,
//   //     items: [
//   //       {
//   //         title: "History",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Starred",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Settings",
//   //         url: "#",
//   //       },
//   //     ],
//   //   },
//   //   {
//   //     title: "Models",
//   //     url: "#",
//   //     icon: Bot,
//   //     items: [
//   //       {
//   //         title: "Genesis",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Explorer",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Quantum",
//   //         url: "#",
//   //       },
//   //     ],
//   //   },
//   //   {
//   //     title: "Documentation",
//   //     url: "#",
//   //     icon: BookOpen,
//   //     items: [
//   //       {
//   //         title: "Introduction",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Get Started",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Tutorials",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Changelog",
//   //         url: "#",
//   //       },
//   //     ],
//   //   },
//   //   {
//   //     title: "Settings",
//   //     url: "#",
//   //     icon: Settings2,
//   //     items: [
//   //       {
//   //         title: "General",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Team",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Billing",
//   //         url: "#",
//   //       },
//   //       {
//   //         title: "Limits",
//   //         url: "#",
//   //       },
//   //     ],
//   //   },
//   // ],
//   projects: [
//     {
//       name: "Design Engineering",
//       url: "#",
//       icon: Frame,
//     },
//     {
//       name: "Sales & Marketing",
//       url: "#",
//       icon: PieChart,
//     },
//     {
//       name: "Travel",
//       url: "#",
//       icon: Map,
//     },
//   ],
// }



export function AppSidebar({
  ...props
}) {

  const { user, loading, logout, isOwner, isAdmin, isDev } = useAuth();
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, level: 3 },
    { name: 'Users', href: '/dashboard/users', icon: Users, level: 2 }, // Only Admin and above can see Users
    { name: 'Keys', href: '/dashboard/keys', icon: Key, level: 3 },
    { name: 'Statistics', href: '/dashboard/stats', icon: BarChart3, level: 2 },
    { name: 'History', href: '/dashboard/history', icon: FileText, level: 2 },
    // New: Balance Transfer (Owner/Admin only)
    ...(user.level <= 2 ? [{ name: 'Transfer Balance', href: '/dashboard/users/transfer-balance', icon: Key, level: 2 }] : []),
    // File Manager (external link)
    { name: 'File Manager', href: 'https://keysgen.site/filemanager/', icon: Folder, level: 3, external: true },
      { name: 'Settings', href: '/dashboard/settings', icon: Settings, level: 1 },
  ].filter(item => user.level <= item.level);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        
        <TeamSwitcher/>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={navigation} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
