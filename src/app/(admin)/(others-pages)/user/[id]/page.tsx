"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import api from "@/utils/axios"
import Button from "@/components/ui/button/Button"
import { useRouter } from "next/navigation"
import { ChevronLeftIcon, MailIcon, EnvelopeIcon } from "@/icons"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import { Modal } from "@/components/ui/modal"

interface Platform {
  _id?: string
  platform: string
  url: string
  followers?: number
}

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

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mediaModal, setMediaModal] = useState<{ type: 'image' | 'video', src: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get(`/user/${params.id}`)
        console.log(response.data.data)
        setUser(response.data.data)
      } catch (error) {
        console.error("Error fetching user:", error)
        alert("Failed to fetch user details")
      } finally {
        setIsLoading(false)
      }
    }
    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  function splitPhoneNumber(phone: string) {
    const match = phone?.match(/^(\+\d{1,3})[\s-]?(.*)$/);
    if (match) {
      return { code: match[1], number: match[2] };
    }
    return { code: '', number: phone };
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-600 dark:text-gray-400 mb-4">User not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const phoneParts = splitPhoneNumber(user.phoneNumber);

  return (
    <>
      <PageBreadcrumb pageTitle="User Details" />
      <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-2">
        <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-md border-2 border-[#455eff]/20 dark:border-blue-900/40 p-0 md:p-0 flex flex-col md:flex-row overflow-hidden">
          {/* Profile Section (Left) */}
          <div className="md:w-1/3 bg-gradient-to-b from-[#455eff]/10 to-white dark:from-slate-900 dark:to-slate-800 p-8 flex flex-col items-center justify-start border-r border-blue-100 dark:border-slate-800">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 dark:border-slate-700 shadow-xl mb-6">
              <Image
                src={user.profileImage || "/placeholder.svg"}
                alt={user.name}
                fill
                className="object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1 text-center">{user.name}</h2>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${user.disabled ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"}`}>{user.disabled ? "Blocked" : "Active"}</span>
            </div>
            <div className="w-full flex flex-col gap-3 mt-2">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-2">
                <MailIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-200 text-sm break-all">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-800 rounded-xl px-4 py-2">
                <EnvelopeIcon className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-200 text-sm">
                  {user.phoneNumber && <><span className="font-semibold tracking-wide mr-1">{phoneParts?.code}</span>
                    <span>{phoneParts?.number}</span></>}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => router.back()}
              startIcon={<ChevronLeftIcon />}
              className="w-full mt-8 font-semibold border-blue-200 dark:border-blue-700"
            >
              Back to List
            </Button>
          </div>
          {/* Details Section (Right) - Make scrollable */}
          <div className="md:w-2/3 flex flex-col gap-6 p-6 bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto">
            {/* Personal Info Card */}
            <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6 mb-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 break-all">{user.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone Number</div>
                  {user.phoneNumber && <div className="font-medium text-gray-900 dark:text-gray-100">({phoneParts?.code}) {phoneParts?.number}</div>}
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Joined</div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
            {/* Tags Card */}
            {user.tags && user.tags.length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900/60">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {/* Bio Card */}
            {user.bio && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Bio</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{user.bio}</p>
              </div>
            )}
            {/* Social Media Card */}
            {user.socialMedia && user.socialMedia.length > 0 && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Social Media</h3>
                <div className="flex flex-col gap-3">
                  {user.socialMedia.map((platform, idx) => (
                    <div key={platform._id || idx} className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <span className="min-w-[90px] text-gray-600 dark:text-gray-300 font-medium">{platform.platform}</span>
                        <a href={platform.url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 dark:text-blue-400 hover:underline ">{platform.url}</a>
                      </div>
                      {platform.followers !== undefined && (
                        <span className="min-w-[90px] text-gray-600 dark:text-gray-300 font-small">{platform.followers} followers</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Media Gallery Card */}
            {(user.images.length > 0 || user.videos.length > 0) && (
              <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6 mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Media Gallery</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Photos Grid */}
                  {user.images.length > 0 && (
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Photos</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {user.images.map((image, idx) => (
                          <button
                            key={idx}
                            className="relative aspect-square rounded-lg overflow-hidden shadow focus:outline-none"
                            onClick={() => setMediaModal({ type: 'image', src: image })}
                          >
                            <Image src={image} alt={`Photo ${idx + 1}`} fill className="object-cover transition-transform duration-200 hover:scale-105" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Videos Grid */}
                  {user.videos.length > 0 && (
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-2">Videos</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.videos.map((video, idx) => (
                          <button
                            key={idx}
                            className="relative rounded-lg overflow-hidden shadow focus:outline-none"
                            style={{ aspectRatio: '16/9' }}
                            onClick={() => setMediaModal({ type: 'video', src: video })}
                          >
                            <video
                              src={video}
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Media Modal */}
                <Modal isOpen={!!mediaModal} onClose={() => setMediaModal(null)} showCloseButton={true}>
                  {mediaModal?.type === 'image' && (
                    <div className="relative flex items-center aspect-square justify-center w-full h-full ">
                      <Image src={mediaModal.src} alt="Full Image" fill className="object-contain" />
                    </div>
                  )}
                  {mediaModal?.type === 'video' && (
                    <div className="flex items-center justify-center w-full h-full p-4">
                      <video src={mediaModal.src} controls autoPlay className="w-full h-full max-h-[80vh] object-contain" />
                    </div>
                  )}
                </Modal>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 