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
import { useState } from 'react';
import toast from 'react-hot-toast';
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
  const [showChangePass, setShowChangePass] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      toast.error('All fields are required');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('Passwords do not match');
      return;
    }
    setChanging(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully');
        setShowChangePass(false);
        setOldPass(''); setNewPass(''); setConfirmPass('');
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (e) {
      toast.error('Failed to change password');
    } finally {
      setChanging(false);
    }
  };
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
             
              <DropdownMenuItem onClick={() => setShowChangePass(true)}>
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
      {showChangePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.3)] backdrop-blur-[2px] bg-opacity-60 px-2" style={{scrollbarWidth : 'none'}}>
          <form onSubmit={handleChangePassword} className="bg-accent p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <label>Old Password</label>
            <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} className="w-full mb-2 !border-[none]" style={{ border : "none"}}/>
            <label>New Password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full mb-2 !border-[none]" style={{ border : "none"}}/>
            <label>Confirm New Password</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full mb-2 !border-[none]"  style={{ border : "none"}}/>
            <div className="flex gap-2 mt-4 keys">
              <button type="button" onClick={() => setShowChangePass(false)} className="bg-gray-600 px-4 py-2 rounded text-white">Cancel</button>
              <button type="submit" disabled={changing} className="bg-blue-600 px-4 py-2 rounded text-white">{changing ? 'Changing...' : 'Change'}</button>
            </div>
          </form>
        </div>
      )}
    </SidebarMenu>
  );
}
