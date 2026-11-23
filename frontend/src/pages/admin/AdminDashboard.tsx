import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface KPIs {
  totalUsers: number;
  totalRestaurants: number;
  pendingRestaurants: number;
  totalOrders: number;
  activeOrders: number;
  openTickets: number;
  grossRevenue: number;
  totalRefunds: number;
}

interface UserItem {
  id: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'DELETED' | string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  roles: Array<{ roleId: string; roleName: string; status: string }>;
}

interface RestaurantItem {
  id: string;
  businessName: string;
  description?: string;
  status?: string;
  verificationStatus?: string;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  owner?: { id: string; firstName: string; lastName: string; email: string };
  branches?: Array<{ id: string; city: string; area: string; gstin: string; fssaiLicenseNumber: string }>;
  documents?: Array<{ id: string; documentType: string; documentNumber: string; documentUrl: string; status: string }>;
}

interface TicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL' | string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | string;
  createdAt: string;
  customer?: { id: string; firstName: string; lastName: string; email: string };
  messages?: Array<{ id: string; message: string; senderRole: string; createdAt: string }>;
}

interface SystemConfigItem {
  id?: string;
  configKey: string;
  configValue: string;
  description?: string;
  isEncrypted?: boolean;
  updatedAt?: string;
}

interface AuditLogItem {
  id: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  createdAt: string;
  diffPayload?: any;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'restaurants' | 'tickets' | 'configs' | 'audit'>('overview');
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editingRole, setEditingRole] = useState<{ roleId: string; status: string } | null>(null);

  // Restaurants state
  const [pendingRestaurants, setPendingRestaurants] = useState<RestaurantItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Tickets state
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [ticketReply, setTicketReply] = useState('');

  // Configs state
  const [configs, setConfigs] = useState<SystemConfigItem[]>([]);
  const [newConfig, setNewConfig] = useState({ configKey: '', configValue: '', description: '' });
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Initial load
  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'restaurants') fetchRestaurants();
    if (activeTab === 'tickets') fetchTickets();
    if (activeTab === 'configs') fetchConfigs();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab, userPage, userSearch, userRoleFilter]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<KPIs>('/admin/overview');
      setKpis(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch KPIs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(userPage));
      params.append('limit', '10');
      if (userSearch) params.append('search', userSearch);
      if (userRoleFilter) params.append('role', userRoleFilter);

      const res = await apiClient.get<any>(`/admin/users?${params.toString()}`);
      const list = res.data?.data || res.data;
      setUsers(Array.isArray(list) ? list : []);
      setUserTotalPages(res.data?.pagination?.totalPages || res.data?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/admin/restaurants/pending');
      const list = res.data?.data || res.data;
      setPendingRestaurants(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/admin/tickets');
      const list = res.data?.data || res.data;
      setTickets(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/admin/configs');
      const list = res.data?.data || res.data;
      setConfigs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>('/admin/audit-logs?limit=20');
      const list = res.data?.data || res.data;
      setAuditLogs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleToggleUserAccountStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.patch(`/admin/users/${userId}/account-status`, {
        status: nextStatus,
        reason: `Admin manual status toggle to ${nextStatus}`,
      });
      fetchUsers();
    } catch (err: any) {
      alert(`Error updating account status: ${err.message}`);
    }
  };

  const handleUpdateRoleStatus = async (userId: string, roleId: string, status: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role-status`, {
        roleId,
        status,
      });
      setEditingRole(null);
      fetchUsers();
      if (selectedUser) {
        const updated = await apiClient.get<UserItem>(`/admin/users/${userId}`);
        setSelectedUser(updated.data);
      }
    } catch (err: any) {
      alert(`Error updating role status: ${err.message}`);
    }
  };

  const handleApproveRestaurant = async (restaurantId: string) => {
    if (!confirm('Are you sure you want to approve this restaurant for live operations?')) return;
    try {
      await apiClient.patch(`/admin/restaurants/${restaurantId}/status`, {
        status: 'APPROVED',
        reason: 'Compliance documents verified and approved by Administrator.',
      });
      alert('Restaurant approved successfully!');
      setSelectedRestaurant(null);
      fetchRestaurants();
      fetchKPIs();
    } catch (err: any) {
      alert(`Error approving restaurant: ${err.message}`);
    }
  };

  const handleRejectRestaurant = async (restaurantId: string) => {
    if (!rejectionNotes.trim()) {
      alert('Please provide rejection reasons/notes.');
      return;
    }
    try {
      await apiClient.patch(`/admin/restaurants/${restaurantId}/status`, {
        status: 'REJECTED',
        reason: rejectionNotes,
      });
      alert('Restaurant registration rejected.');
      setSelectedRestaurant(null);
      setRejectionNotes('');
      fetchRestaurants();
      fetchKPIs();
    } catch (err: any) {
      alert(`Error rejecting restaurant: ${err.message}`);
    }
  };

  const handleVerifyDocument = async (restaurantId: string, documentId: string, status: string) => {
    try {
      await apiClient.patch(`/admin/restaurants/${restaurantId}/documents/${documentId}/status`, {
        status,
        rejectionReason: status === 'REJECTED' ? 'Document unreadable or invalid license credentials' : undefined,
        reason: status === 'REJECTED' ? 'Document unreadable or invalid license credentials' : undefined,
      });
      // Refresh pending restaurants to sync documents
      fetchRestaurants();
    } catch (err: any) {
      alert(`Error updating document: ${err.message}`);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfig.configKey.trim() || !newConfig.configValue.trim()) return;
    try {
      await apiClient.post('/admin/configs', newConfig);
      setShowConfigModal(false);
      setNewConfig({ configKey: '', configValue: '', description: '' });
      fetchConfigs();
    } catch (err: any) {
      alert(`Error creating configuration: ${err.message}`);
    }
  };

  const handleDeleteConfig = async (key: string) => {
    if (!confirm(`Are you sure you want to delete configuration "${key}"?`)) return;
    try {
      await apiClient.delete(`/admin/configs/${key}`);
      fetchConfigs();
    } catch (err: any) {
      alert(`Error deleting configuration: ${err.message}`);
    }
  };

  const handleSendTicketReply = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    try {
      await apiClient.patch(`/admin/tickets/${ticketId}/respond`, {
        message: ticketReply,
      });
      setTicketReply('');
      // Reload tickets
      fetchTickets();
      if (selectedTicket) {
        setSelectedTicket({
          ...selectedTicket,
          messages: [
            ...(selectedTicket.messages || []),
            {
              id: String(Date.now()),
              message: ticketReply,
              senderRole: 'ADMIN',
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }
    } catch (err: any) {
      alert(`Error sending response: ${err.message}`);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await apiClient.patch(`/admin/tickets/${ticketId}/resolve`, {
        remarks: 'Resolved by Admin',
      });
      fetchTickets();
      setSelectedTicket(null);
      fetchKPIs();
    } catch (err: any) {
      alert(`Error resolving ticket: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">OFOS Platform Administration</h1>
                <p className="text-sm text-gray-500">Central operational command, governance, compliance & configurations</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: 'Users & Roles', icon: '👥' },
              { id: 'restaurants', label: 'Verifications', icon: '🏪' },
              { id: 'tickets', label: 'Support', icon: '🎫' },
              { id: 'configs', label: 'Settings', icon: '⚙️' },
              { id: 'audit', label: 'Audit Logs', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && kpis && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Registered Users</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">{kpis.totalUsers}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Platform-wide</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl font-bold">
                  👥
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Approvals</p>
                  <p className="text-3xl font-black text-amber-600 mt-1">{kpis.pendingRestaurants}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">out of {kpis.totalRestaurants} total</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl font-bold">
                  🏪
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Deliveries</p>
                  <p className="text-3xl font-black text-indigo-600 mt-1">{kpis.activeOrders}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{kpis.totalOrders} lifetime orders</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold">
                  🛵
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform GMV</p>
                  <p className="text-3xl font-black text-gray-900 mt-1">₹{Number(kpis.grossRevenue).toLocaleString()}</p>
                  <p className="text-xs text-red-500 font-medium mt-1">₹{Number(kpis.totalRefunds).toLocaleString()} refunds</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                  💰
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">Operational Quick Jumps</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('restaurants')}
                  className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition"
                >
                  <p className="font-bold text-amber-900 text-sm">Review Pending Restaurants ({kpis.pendingRestaurants})</p>
                  <p className="text-xs text-amber-700 mt-1">Verify FSSAI, GSTIN, and grant live ordering status.</p>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition"
                >
                  <p className="font-bold text-blue-900 text-sm">Manage Staff & Customer Roles</p>
                  <p className="text-xs text-blue-700 mt-1">Assign admin, rider, fleet, and owner privileges.</p>
                </button>

                <button
                  onClick={() => setActiveTab('configs')}
                  className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-left transition"
                >
                  <p className="font-bold text-gray-900 text-sm">System Variables & Commission</p>
                  <p className="text-xs text-gray-600 mt-1">Tune delivery fees, surge multipliers, and platform rates.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">User Roster & Access Control</h2>
                <p className="text-xs text-gray-500">Manage user accounts, statuses, and multi-tenant privileges</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 w-56"
                />

                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Restaurant_owner">Restaurant Owner</option>
                  <option value="Branch_manager">Branch Manager</option>
                  <option value="Delivery_partner">Delivery Partner</option>
                  <option value="Fleet_manager">Fleet Manager</option>
                  <option value="Finance_manager">Finance Manager</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-100">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Joined</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {u.fullName || `${u.firstName} ${u.lastName || ''}`}
                        <span className="block text-[11px] text-gray-400 font-normal">ID #{u.id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block text-gray-800">{u.email || 'No email'}</span>
                        <span className="block text-gray-500 text-[11px]">{u.phone}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((r) => (
                            <span
                              key={r.roleId}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.roleName === 'Admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : r.roleName === 'Restaurant_owner'
                                  ? 'bg-orange-100 text-orange-700'
                                  : r.roleName === 'Delivery_partner'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {r.roleName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUserAccountStatus(u.id, u.status)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-3">
              <span>Page {userPage} of {userTotalPages}</span>
              <div className="flex gap-1.5">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={userPage >= userTotalPages}
                  onClick={() => setUserPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: RESTAURANT VERIFICATION */}
        {activeTab === 'restaurants' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Restaurant Approvals</h2>
              <p className="text-xs text-gray-500">Review business licensing, FSSAI certificates, GSTIN, and grant merchant authorization</p>
            </div>

            {pendingRestaurants.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="font-semibold text-gray-800">No restaurants currently awaiting verification.</p>
                <p className="text-xs text-gray-400 mt-0.5">All active restaurant partners are up to date with compliance.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRestaurants.map((r) => (
                  <div key={r.id} className="p-5 border border-gray-200 rounded-2xl shadow-sm bg-white space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{r.businessName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{r.description || 'No description provided'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {r.status || r.verificationStatus || 'PENDING'}
                      </span>
                    </div>

                    {r.owner && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                        <span className="font-semibold">Owner: </span>
                        {r.owner.firstName} {r.owner.lastName} ({r.owner.email})
                      </div>
                    )}

                    {r.branches && r.branches.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-gray-700">Initial Branch:</span>
                        <div className="bg-gray-50 p-2.5 rounded-xl text-gray-600 space-y-0.5">
                          <p>📍 {r.branches[0].area}, {r.branches[0].city}</p>
                          <p>📜 FSSAI: <span className="font-mono font-medium">{r.branches[0].fssaiLicenseNumber}</span></p>
                          <p>🏢 GSTIN: <span className="font-mono font-medium">{r.branches[0].gstin}</span></p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleApproveRestaurant(r.id)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        ✓ Approve Restaurant
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRestaurant(r);
                          setRejectionNotes('');
                        }}
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rejection Modal */}
            {selectedRestaurant && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="font-bold text-gray-900 text-base">
                    Reject {selectedRestaurant.businessName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Provide the official compliance reason for this rejection. This will be transmitted to the business owner.
                  </p>
                  <textarea
                    rows={4}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Enter compliance reason (e.g. Invalid FSSAI license format, GSTIN mismatch)..."
                    className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setSelectedRestaurant(null)}
                      className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectRestaurant(selectedRestaurant.id)}
                      className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: SUPPORT TICKETS */}
        {activeTab === 'tickets' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Support Ticket Operations</h2>
                <p className="text-xs text-gray-500">Track customer issues, complaints, and deliver official administrative resolution</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                Total Tickets: {tickets.length}
              </span>
            </div>

            {tickets.length === 0 ? (
              <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-3xl block mb-2">🎉</span>
                <p className="font-semibold text-gray-800">Support queue is clear.</p>
                <p className="text-xs text-gray-400 mt-0.5">No open tickets at this time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 border border-gray-200 rounded-xl bg-white space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400">#{t.ticketNumber}</span>
                        <h4 className="font-bold text-gray-900 text-sm">{t.subject}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'OPEN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600">{t.description}</p>

                    <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                      <span className="text-gray-400 text-[11px]">{new Date(t.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="text-red-600 font-bold hover:underline"
                      >
                        View Thread & Reply →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Ticket Thread Modal */}
            {selectedTicket && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-gray-400 font-bold">Ticket #{selectedTicket.ticketNumber}</span>
                      <h3 className="font-bold text-gray-900 text-base">{selectedTicket.subject}</h3>
                      <p className="text-xs text-gray-500 mt-1">{selectedTicket.description}</p>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 italic">Conversation stream:</p>
                    {selectedTicket.messages?.map((m) => (
                      <div key={m.id} className={`p-2.5 rounded-xl text-xs ${
                        m.senderRole === 'ADMIN' ? 'bg-red-50 text-red-900 ml-6' : 'bg-white text-gray-800 mr-6 border border-gray-200'
                      }`}>
                        <div className="flex justify-between font-bold text-[10px] text-gray-400 mb-1">
                          <span>{m.senderRole}</span>
                          <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p>{m.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Write administrative reply..."
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => handleResolveTicket(selectedTicket.id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100"
                      >
                        ✓ Mark Resolved
                      </button>
                      <button
                        onClick={() => handleSendTicketReply(selectedTicket.id)}
                        className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shadow-sm"
                      >
                        Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: SYSTEM CONFIGS */}
        {activeTab === 'configs' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Dynamic System Configurations</h2>
                <p className="text-xs text-gray-500">Live platform operational flags, commissions, base fees, and runtime settings</p>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                + Add Configuration
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Configuration Key</th>
                    <th className="py-3 px-4">Value</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {configs.map((c) => (
                    <tr key={c.configKey} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4 font-bold text-gray-900">{c.configKey}</td>
                      <td className="py-3 px-4 text-indigo-700 font-semibold">{c.configValue}</td>
                      <td className="py-3 px-4 font-sans text-gray-500">{c.description || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteConfig(c.configKey)}
                          className="text-red-600 hover:text-red-800 font-sans font-bold text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Config Modal */}
            {showConfigModal && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                  <h3 className="font-bold text-gray-900 text-base">New System Configuration</h3>
                  <form onSubmit={handleCreateConfig} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Config Key</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. COMMISSION_PERCENTAGE"
                        value={newConfig.configKey}
                        onChange={(e) => setNewConfig({ ...newConfig, configKey: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Value</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 10.0"
                        value={newConfig.configValue}
                        onChange={(e) => setNewConfig({ ...newConfig, configValue: e.target.value })}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Operational purpose of this key"
                        value={newConfig.description}
                        onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                        className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowConfigModal(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Immutable Platform Audit Ledger</h2>
              <p className="text-xs text-gray-500">Chronological trail of administrative role changes, verifications, and system events</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-y border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Actor ID</th>
                    <th className="py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic">No audit records logged yet.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-gray-900">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800">{log.entityType}</span>
                          <span className="text-[11px] text-gray-400 font-mono block">#{log.entityId}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-mono">User #{log.actorUserId || 'System'}</td>
                        <td className="py-3 px-4 text-gray-400 font-mono">{log.ipAddress || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
