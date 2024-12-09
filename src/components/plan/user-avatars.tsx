'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { IAdmin } from '@/types/Customer'

interface UserAvatarsProps {
  users: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }[]
  selectedUsers?: string[]
  onUserClick: (userId: string) => void
}

export function UserAvatars({ users, selectedUsers = [], onUserClick }: UserAvatarsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleUsers = users.slice(0, 3)
  const remainingUsers = users.slice(3)

  const UserAvatar = ({ user }: { user: { id: string; email: string; name: string; avatarUrl?: string } }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Avatar
            className={cn(
              "h-8 w-8 cursor-pointer transition-all hover:scale-110 border-2 border-background",
              selectedUsers.includes(user.id) && "ring-2 ring-primary ring-offset-2"
            )}
            onClick={() => onUserClick(user.id)}
          >
            <AvatarImage src={user.avatarUrl || ''} alt={user.name} />
            <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent>{user.name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <UserAvatar key={user.id} user={user} />
        ))}
        {remainingUsers.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-muted hover:bg-muted-foreground/10"
              >
                +{remainingUsers.length}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 p-2">
                  {remainingUsers.map((user) => (
                    <UserAvatar key={user.id} user={user} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

