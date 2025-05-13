"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { CloseIcon } from "@/icons"
import { Modal } from "@/components/ui/modal"
import Button from "@/components/ui/button/Button"
import { useModal } from "@/hooks/useModal"
import Image from "next/image"
import api from "@/utils/axios"
import { motion, AnimatePresence } from "framer-motion"

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


// Add S3 base URL constant
// const S3_BASE_URL = "https://influencer-mega-bucket.s3.ap-south-1.amazonaws.com"

// Add these animation variants after the interfaces
const modalVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 200,
      duration: 0.6,
    },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 200,
      duration: 0.5,
    },
  },
}

const fadeInUp = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 200,
      duration: 0.5,
    },
  },
  exit: {
    y: -10,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}


export default function UserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [isBlocking, setIsBlocking] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { isOpen: isDetailsModalOpen, openModal: openDetailsModal, closeModal: closeDetailsModal } = useModal()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsTableLoading(true)
      // Temporarily using influencer endpoint for testing
      const response = await api.get("/user/list-users")
      setUsers(response.data.docs)
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Failed to fetch users. Please try again later.")
    } finally {
      setIsTableLoading(false)
    }
  }

  const handleRowClick = (user: User) => {
    setSelectedUser(user)
    openDetailsModal()
  }

  const handleBlockUnblock = async (userId: string, currentBlockedStatus: boolean) => {
    try {
      setIsBlocking(userId)
      await api.put(`/user/${userId}`, {
        disabled: !currentBlockedStatus
      })
      
      // Update the user's blocked status in the list
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? {
                ...user,
                disabled: !currentBlockedStatus,
              }
            : user
        ),
      )
    } catch (error) {
      console.error("Error updating block status:", error)
      alert("Failed to update block status. Please try again.")
    } finally {
      setIsBlocking(null)
    }
  }

  return (
    <div className="space-y-6">
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
        ) : users.length === 0 ? (
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
                {users.map((user) => (
                  <tr
                    key={user._id}
                    onClick={() => handleRowClick(user)}
                    className={`border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70 cursor-pointer ${
                      user.disabled ? 'opacity-75' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      {user.profileImage && (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={user.profileImage || "/placeholder.svg"}
                            alt={user.name}
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
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.disabled
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
                          className={`transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 ${
                            user.disabled
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

      {/* User Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedUser && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={closeDetailsModal}
            className="max-w-[800px] !fixed !right-0 !top-0 !bottom-0 !translate-x-0 !rounded-l-[20px] !rounded-r-none !p-0 dark:border-l dark:border-slate-700"
          >
            <motion.div
              className="h-full bg-white dark:bg-slate-900/95 backdrop-blur-sm"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{
                duration: 0.5,
              }}
            >
              <div className="h-full flex flex-col">
                <motion.div
                  className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200 dark:border-slate-700"
                  variants={fadeInUp}
                >
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                    User Details
                  </h4>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <CloseIcon
                      className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                      onClick={closeDetailsModal}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="flex-1 overflow-y-auto p-5 lg:p-6 max-h-[calc(100vh-90px)]"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Basic Information</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Name</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">{selectedUser.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">{selectedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Phone Number</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">
                            {selectedUser.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Gender</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200 capitalize">
                            {selectedUser.gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedUser.tags && selectedUser.tags.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Tags</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/40 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {selectedUser.bio && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Bio</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.bio}</p>
                      </div>
                    )}


                  </div>
                </motion.div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
} 