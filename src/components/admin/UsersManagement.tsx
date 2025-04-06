
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, UserX } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Mock data for users
const mockUsers = [
  { 
    id: "1", 
    username: "johndoe", 
    email: "john.doe@example.com", 
    role: "user",
    status: "active",
    joined: "2023-10-15",
    lastActive: "2023-04-05"
  },
  { 
    id: "2", 
    username: "janesmith", 
    email: "jane.smith@example.com", 
    role: "artist",
    status: "active",
    joined: "2023-11-20",
    lastActive: "2023-04-04"
  },
  { 
    id: "3", 
    username: "mikebrown", 
    email: "mike.brown@example.com", 
    role: "user",
    status: "suspended",
    joined: "2024-01-05",
    lastActive: "2023-03-28"
  },
  { 
    id: "4", 
    username: "sarahjones", 
    email: "sarah.jones@example.com", 
    role: "artist",
    status: "active",
    joined: "2023-09-10",
    lastActive: "2023-04-06"
  },
  { 
    id: "5", 
    username: "robertwilson", 
    email: "robert.wilson@example.com", 
    role: "user",
    status: "active",
    joined: "2024-02-15",
    lastActive: "2023-04-01"
  }
];

export function UsersManagement() {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteUser = () => {
    if (userToDelete) {
      setUsers(users.filter(user => user.id !== userToDelete));
      setUserToDelete(null);
      setDialogOpen(false);
      
      toast({
        title: "User deleted",
        description: "The user has been successfully removed from the system.",
      });
    }
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "suspended" ? "active" : "suspended" } 
        : user
    ));
    
    toast({
      title: "User status updated",
      description: "The user status has been updated successfully.",
    });
  };

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
        <TableCaption>List of all registered users in the system.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === "artist" ? "secondary" : "outline"}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.status === "active" ? "success" : "destructive"}>
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell>{user.joined}</TableCell>
              <TableCell>{user.lastActive}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuspendUser(user.id)}
                  >
                    {user.status === "suspended" ? "Activate" : "Suspend"}
                  </Button>
                  <Dialog open={dialogOpen && userToDelete === user.id} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setUserToDelete(user.id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Confirm User Deletion
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this user? This action cannot be undone
                          and will permanently remove all user data from the system.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteUser}>
                          Delete User
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
