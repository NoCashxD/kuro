"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar"
import { useAuth } from '../context/AuthContext';
export function NavUser({
  
}) {
  const { isMobile } = useSidebar()
  const getRoleText = () => {
    if (user.level === 0) return 'Dev';
    if (user.level === 1) return 'Owner';
    if (user.level === 2) return 'Admin';
    return 'Reseller';
  };
  const { user, loading, logout, isOwner, isAdmin, isDev } = useAuth();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-accent data-[state=open]:text-text nobtn">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.username} alt={user.username} />
                <AvatarFallback className="rounded-lg bg-[var(--label)]">N</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight ">
                <span className="truncate font-medium capitalize ">{user.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="rounded-lg  bg-[var(--label)]">N</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight mb-4">
                  <span className="truncate font-medium capitalize">{user.username}</span>
                  <span className="truncate text-xs">{getRoleText()}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator/>
            
            <DropdownMenuGroup>
             
              <DropdownMenuItem>
                <Bell />
                Change Password
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuItem onClick={logout}
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
