"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import api from "@/utils/axios"
import Button from "@/components/ui/button/Button"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface Category {
  _id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Platform {
  _id?: string
  platform: string
  url: string
}

interface Influencer {
  _id: string
  name: string
  email: string
  phoneNumber: string
  gender: string
  category: Category[]
  bio: string
  images: string[]
  videos: string[]
  socialMedia: Platform[]
  profileImage?: string
  tags: string[]
  emailSent: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  updates?: {
    welcomeMailWithPasswordSent: boolean
    welcomeMailWithPasswordSentAt: string
  }
}

export default function InfluencerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchInfluencer = async () => {
      try {
        const response = await api.get(`/user/${params.id}`)
        console.log(response)
        setInfluencer(response.data)
      } catch (error) {
        console.error("Error fetching influencer:", error)
        alert("Failed to fetch influencer details")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchInfluencer()
    }
  }, [params.id])


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!influencer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Influencer not found</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        //   startIcon={<ArrowLeftIcon />}
          className="transform transition-transform hover:scale-105 active:scale-95"
        >
          Back to List
        </Button>
        {/* <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/influencer/edit/${influencer._id}`)}
            startIcon={<PencilIcon />}
            className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            startIcon={<TrashBinIcon />}
            disabled={isDeleting}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-gray-300 dark:border-slate-700"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div> */}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-6 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800 shadow-sm"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile */}
          <div className="space-y-6">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-gray-100 dark:border-slate-800 shadow-lg">
              <Image
                src={influencer.profileImage || "/placeholder.svg"}
                alt={influencer.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">{influencer.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{influencer.email}</p>
              <p className="text-gray-600 dark:text-gray-400">{influencer.phoneNumber}</p>
              <div className="pt-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    influencer.isVerified
                      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400"
                  }`}
                >
                  {influencer.isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Categories */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {influencer.category.map((cat) => (
                  <span
                    key={cat._id}
                    className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-full"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            {influencer.tags && influencer.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {influencer.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/40 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {influencer.bio && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Bio</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{influencer.bio}</p>
              </div>
            )}

            {/* Social Media */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Social Media</h2>
              <div className="space-y-3">
                {influencer.socialMedia.map((platform, index) => (
                  <div key={platform._id || index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                    <span className="font-medium min-w-[100px] text-gray-900 dark:text-gray-200">
                      {platform.platform}
                    </span>
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline dark:hover:text-blue-300 truncate"
                    >
                      {platform.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Media Gallery */}
            {(influencer.images.length > 0 || influencer.videos.length > 0) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">Media Gallery</h2>
                <div className="space-y-6">
                  {influencer.images.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-200 mb-3">Photos</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {influencer.images.map((image, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-md">
                            <Image
                              src={image}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {influencer.videos.length > 0 && (
                    <div>
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-200 mb-3">Videos</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {influencer.videos.map((video, index) => (
                          <div key={index} className="rounded-lg overflow-hidden shadow-md">
                            <video
                              src={video}
                              controls
                              className=" inset-0 object-fit"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 