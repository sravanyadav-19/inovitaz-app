/**
 * AdminUsers — user directory table (extracted from AdminDashboard).
 */
import { useState, useEffect } from "react";
import { adminProjectsAPI } from "../../api/projects";
import AdminSkeleton from "./AdminSkeleton";

// ================== Admin Users ==================
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminProjectsAPI.getAllUsers();
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AdminSkeleton type="table" rows={6} />;
  }

  return (
    <div>
      <h2 className="t-h3 text-white mb-6">
        All Users
      </h2>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="text-left py-3 px-4 t-label text-outline">
                  User
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Email
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Role
                </th>
                <th className="text-left py-3 px-4 t-label text-outline">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-surface-variant hover:bg-surface"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-white">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-outline">{user.email}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`badge ${user.role === 'admin' ? "badge-primary" : "badge"}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-outline">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-outline"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default AdminUsers;
