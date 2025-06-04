
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Users</h2>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableCaption>List of all users in the system.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.full_name}</TableCell>
              <TableCell>{getRoleBadge(user)}</TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateUserRole(user.id, "admin")}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateUserRole(user.id, "support")}
                  >
                    <HeadphonesIcon className="h-4 w-4 mr-1" />
                    Support
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateUserRole(user.id, "artist")}
                  >
                    <Crown className="h-4 w-4 mr-1" />
                    Artist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateUserRole(user.id, "user")}
                  >
                    <User className="h-4 w-4 mr-1" />
                    User
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
