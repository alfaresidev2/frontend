"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Button from "@/components/ui/button/Button"
import { useModal } from "@/hooks/useModal"
import Image from "next/image"
import api from "@/utils/axios"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Modal } from "../ui/modal"

interface User {
  _id: string
  name: string
  email: string
  phoneNumber: string
  gender: string
  bio: string
  images: string[]
  videos: string[]
  socialMedia: Platform[]
  profileImage?: string
  tags: string[]
  disabled: boolean
  createdAt: string
  updatedAt: string
}

interface Platform {
  _id?: string
  platform: string
  url: string
}


export default function UserPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([])
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [isBlocking, setIsBlocking] = useState<string | null>(null)
  const { isOpen: isBlockModalOpen, openModal: openBlockModal, closeModal: closeBlockModal } = useModal()
  const [blockAction, setBlockAction] = useState<{
    userId: string;
    currentStatus: boolean;
  } | null>(null);

  // Pagination and search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // On mount, read query params and set state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = parseInt(params.get("page") || "1", 10);
    const limitParam = parseInt(params.get("limit") || "5", 10);
    const searchParam = params.get("search") || "";
    setPage(pageParam);
    setLimit(limitParam);
    setSearch(searchParam);
  }, []);

  // When changing page, limit, or search, update the URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search) params.set("search", search);
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const fetchUsers = async () => {
    try {
      setIsTableLoading(true)
      const response = await api.get("/user/list-users", {
        params: {
          page,
          limit,
        },
      });
      setUsers(response.data.docs)
      setTotal(response.data.totalDocs || response.data.total || 0)
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Failed to fetch users. Please try again later.")
    } finally {
      setIsTableLoading(false)
    }
  }

  // Filter and sort users on the current page (frontend search)
  const filteredPageUsers = users.filter(user =>
    user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleRowClick = (user: User) => {
    const params = new URLSearchParams(window.location.search);
    router.push(`/user/${user._id}?${params.toString()}`)
  }

  const handleBlockUnblock = async (userId: string, currentBlockedStatus: boolean) => {
    setBlockAction({
      userId,
      currentStatus: currentBlockedStatus
    });
    openBlockModal();
  }
  const handleConfirmedBlockUnblock = async () => {
    if (!blockAction) return;

    try {
      setIsBlocking(blockAction.userId)
      await api.put(`/user/${blockAction.userId}`, {
        disabled: !blockAction.currentStatus
      })

      // Update the user's blocked status in the list
      setUsers((prev) =>
        prev.map((user) =>
          user._id === blockAction.userId
            ? {
              ...user,
              disabled: !blockAction.currentStatus,
            }
            : user
        ),
      )
    } catch (error) {
      console.error("Error updating block status:", error);
      alert("Failed to update block status. Please try again.");
    } finally {
      setIsBlocking(null);
      setBlockAction(null);
      closeBlockModal();
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Add User (if needed) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-72 px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</span>
        <select
          value={limit}
          onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
          className="px-2 py-1 border border-gray-200 rounded-lg dark:bg-slate-800 dark:border-gray-700 text-gray-900 dark:text-gray-200"
        >
          {[5, 10, 25, 50, 100].map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      {/* Users Table */}
      <div className="p-6 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800 shadow-sm">
        {isTableLoading ? (
          <motion.div
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </motion.div>
        ) : filteredPageUsers.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-12 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 200,
              duration: 0.5,
            }}
          >
            <p className="mb-4 text-gray-600 dark:text-gray-400">No users found</p>
          </motion.div>
        ) : (
          <div className="">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-slate-800/90 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Profile
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Phone Number
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPageUsers.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => handleRowClick(user)}
                    className={`border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70 cursor-pointer ${user.disabled ? 'opacity-75' : ''
                      }`}
                  >
                    <td className="px-6 py-4">
                      {user.profileImage && (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={user.profileImage || "/placeholder.svg"}
                            alt={user.name || "User Profile"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{user.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${user.disabled
                          ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40'
                          : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40'
                          }`}
                      >
                        {user.disabled ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlockUnblock(user._id, user.disabled)}
                          disabled={isTableLoading || isBlocking === user._id}
                          className={`transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 ${user.disabled
                            ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300'
                            : 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
                            }`}
                        >
                          {isBlocking === user._id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              Updating...
                            </div>
                          ) : user.disabled ? (
                            'Unblock'
                          ) : (
                            'Block'
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Pagination Controls */}
      {filteredPageUsers.length > 0 && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {Math.min((page - 1) * limit + 1, total)}-
            {Math.min(page * limit, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * limit >= total}
              className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
      <AnimatePresence>
        {isBlockModalOpen && blockAction && (
          <Modal isOpen={isBlockModalOpen} onClose={closeBlockModal} className="max-w-[500px] !p-0">
            <motion.div
              className="bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800 p-6 lg:p-8"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.5,
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                    {blockAction.currentStatus ? 'Unblock User' : 'Block User'}
                  </h4>
                </div>
                <div className="py-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to {blockAction.currentStatus ? 'unblock' : 'block'} this user?
                    {!blockAction.currentStatus && ' They will not be able to access their account until unblocked.'}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={closeBlockModal}
                    disabled={isBlocking === blockAction.userId}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleConfirmedBlockUnblock}
                    disabled={isBlocking === blockAction.userId}
                    className={blockAction.currentStatus ? "" : "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"}
                  >
                    {isBlocking === blockAction.userId ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        {blockAction.currentStatus ? 'Unblocking...' : 'Blocking...'}
                      </div>
                    ) : (
                      blockAction.currentStatus ? 'Unblock' : 'Block'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
} 