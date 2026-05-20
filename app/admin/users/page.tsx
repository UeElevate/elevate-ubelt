'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Shield, User as UserIcon } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchUsers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setUsers(data as Profile[])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (userId === currentUserId) {
      alert('You cannot change your own role.')
      return
    }

    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    
    fetchUsers()
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    if (userId === currentUserId) {
      alert('You cannot deactivate your own account.')
      return
    }

    await supabase
      .from('profiles')
      .update({ is_active: !isActive })
      .eq('id', userId)
    
    fetchUsers()
  }

  return (
    <div className="pt-14 md:pt-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">Manage user accounts and roles</p>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id} className={`${!user.is_active ? 'opacity-60' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                    }`}>
                      {user.role === 'admin' ? (
                        <Shield className="h-6 w-6" />
                      ) : (
                        <UserIcon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {user.full_name || 'No Name'}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {user.role}
                        </span>
                        {!user.is_active && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                            Inactive
                          </span>
                        )}
                        {user.cell_group && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {user.cell_group}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.id !== currentUserId && (
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as 'user' | 'admin')}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.is_active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found.</p>
        </Card>
      )}
    </div>
  )
}
