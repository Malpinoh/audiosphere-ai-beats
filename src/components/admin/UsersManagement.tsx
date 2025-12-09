
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Search, Shield, User, UserX, Loader2, Crown, HeadphonesIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'user' | 'admin' | 'distributor' | 'artist' | 'editorial' | 'support';

type UserProfile = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  claimable?: boolean;
  auto_created?: boolean;
};

export function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setUsers(data as UserProfile[]);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error fetching users",
          description: "Could not load users from the database.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'INSERT') {
            setUsers(prevUsers => [newRecord as UserProfile, ...prevUsers]);
          } else if (eventType === 'UPDATE') {
            setUsers(prevUsers => prevUsers.map(user => 
              user.id === (newRecord as UserProfile).id ? (newRecord as UserProfile) : user
            ));
          } else if (eventType === 'DELETE') {
            setUsers(prevUsers => prevUsers.filter(user => 
              user.id !== oldRecord.id
            ));
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const filteredUsers = users.filter(user => 
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "User role updated",
        description: `User role has been updated to ${newRole}.`,
      });
      
      // Update users list
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
    } catch (error: any) {
      toast({
        title: "Error updating user role",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (user: UserProfile) => {
    const variants: Record<UserRole, string> = {
      admin: "bg-red-500",
      support: "bg-blue-500", 
      artist: "bg-purple-500",
      distributor: "bg-green-500",
      editorial: "bg-orange-500",
      user: "bg-gray-500"
    };
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={variants[user.role]}>
          {user.role}
        </Badge>
        {user.auto_created && (
          <Badge variant="outline" className="text-xs">
            Auto-created
          </Badge>
        )}
        {user.claimable && (
          <Badge variant="outline" className="text-xs text-yellow-600">
            Claimable
          </Badge>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Manage Users</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableCaption>List of all users in the system.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="hidden sm:table-cell">Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-sm">{user.username}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{user.full_name}</TableCell>
                  <TableCell>{getRoleBadge(user)}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleUpdateUserRole(user.id, "admin")}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        <span className="hidden lg:inline">Admin</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleUpdateUserRole(user.id, "artist")}
                      >
                        <Crown className="h-3 w-3 mr-1" />
                        <span className="hidden lg:inline">Artist</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleUpdateUserRole(user.id, "user")}
                      >
                        <User className="h-3 w-3 mr-1" />
                        <span className="hidden lg:inline">User</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
