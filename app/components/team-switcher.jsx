"use client"

import * as React from "react"
import { ChevronsUpDown, Plus , GalleryVerticalEnd , Moon , Sun} from "lucide-react"
import { useTheme } from '../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
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

export function TeamSwitcher({
  teams
}) {
  const { isMobile, state } = useSidebar()
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex">
       
         
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div
                className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEnd className="size-4" />
              </div>
              {state === "expanded" && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Kuro Panel</span>
                  <span className="truncate text-xs">Made By NOCASH</span>
                </div>
              )}
            
            
            </SidebarMenuButton>
            
            <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1 rounded bg-gray-700 text-text hover:bg-gray-600 border border-gray-600 shadow-none group-data-[collapsible=icon]:hidden"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {/* <span className="hidden sm:inline spbl">{theme === 'dark' ? 'Light' : 'Dark'} Mode</span> */}
              </button>
         
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
