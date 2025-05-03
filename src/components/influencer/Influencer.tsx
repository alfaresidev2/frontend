"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { PlusIcon, CloseIcon, PencilIcon, TrashBinIcon } from "@/icons"
import { Modal } from "@/components/ui/modal"
import Button from "@/components/ui/button/Button"
import { useModal } from "@/hooks/useModal"
import Image from "next/image"
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import api from "@/utils/axios"
import { motion, AnimatePresence } from "framer-motion"

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

const PREDEFINED_PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
  },
  {
    id: "youtube",
    name: "YouTube",
  },
  {
    id: "tiktok",
    name: "TikTok",
  },
  {
    id: "facebook",
    name: "Facebook",
  },
  {
    id: "twitter",
    name: "Twitter",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
  },
  {
    id: "other",
    name: "Other",
  },
]

interface PlatformInput {
  platformId: string
  platform: string
  url: string
}

interface FilePreview {
  id: string
  url: string
  file: File
  type: "image" | "video"
  signature: string
}

const PREDEFINED_TAGS = [
  "Giveaway",
  "Paid Partnership",
  "Brand Ambassador",
  "Product Review",
  "Sponsored",
  "Organic",
  "Event Coverage",
  "Contest",
]

interface ProfilePictureState {
  src?: string
  crop?: Crop
  completedCrop?: PixelCrop
  aspect?: number
  scale?: number
}

interface FormData {
  name: string
  email: string
  phoneNumber: string
  gender: string
  bio: string
  images: string[]
  videos: string[]
  profileImage: string
}

// Add S3 base URL constant
const S3_BASE_URL = "https://influencer-mega-bucket.s3.ap-south-1.amazonaws.com"

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

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 200,
      duration: 0.4,
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

// Add these new interfaces after the existing ones
interface CategoryOption {
  _id: string
  name: string
  isSelected: boolean
}

export default function InfluencerPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<PlatformInput[]>([{ platformId: "", platform: "", url: "" }])
  const [categories, setCategories] = useState<Category[]>([])
  const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal()
  const { isOpen: isConfirmOpen, openModal: openConfirmModal, closeModal: closeConfirmModal } = useModal()
  const { isOpen: isEmailModalOpen, openModal: openEmailModal, closeModal: closeEmailModal } = useModal()
  const profilePictureRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phoneNumber: "",
    gender: "male",
    bio: "",
    images: [],
    videos: [],
    profileImage: "",
  })

  const [filePreview, setFilePreview] = useState<{
    photos: FilePreview[]
    videos: FilePreview[]
  }>({
    photos: [],
    videos: [],
  })
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [profilePicturePreview, setProfilePicturePreview] = useState<FilePreview | null>(null)
  const [profilePictureState, setProfilePictureState] = useState<ProfilePictureState>({
    aspect: 1, // 1:1 aspect ratio for profile pictures
  })
  const imgRef = useRef<HTMLImageElement>(null)
  const [showCropModal, setShowCropModal] = useState(false)
  const [isCropping, setIsCropping] = useState(false)

  const [tagInput, setTagInput] = useState("")
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])

  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [isSendingCredentials, setIsSendingCredentials] = useState<string | null>(null)
  const [flag, setFlag] = useState(false)

  // Add new state for upload loading
  const [uploadLoading, setUploadLoading] = useState<{
    photos: { [key: string]: boolean }
    videos: { [key: string]: boolean }
    profilePicture: boolean
  }>({
    photos: {},
    videos: {},
    profilePicture: false,
  })

  // Add these new states in the InfluencerPage component
  const [categoryInput, setCategoryInput] = useState("")
  const [suggestedCategories, setSuggestedCategories] = useState<CategoryOption[]>([])
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1)

  // Add this new state for tag keyboard navigation
  const [selectedTagIndex, setSelectedTagIndex] = useState(-1)

  // Add new state for dropdown visibility
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  // Add useEffect to fetch categories
  useEffect(() => {
    fetchCategories()
    fetchInfluencers()
  }, [flag])

  // Add useEffect for click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".category-dropdown-container")) {
        setIsCategoryDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchInfluencers = async () => {
    try {
      setIsTableLoading(true)
      const response = await api.get("/admin/influencer")
      setInfluencers(response.data)
    } catch (error) {
      console.error("Error fetching influencers:", error)
      alert("Failed to fetch influencers. Please try again later.")
    } finally {
      setIsTableLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get("/admin/category")
      setCategories(response.data.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      alert("Failed to fetch categories. Please try again later.")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setCategoryInput(value)

    // Filter categories based on search input
    const filtered = categories
      .filter((cat) => cat.name.toLowerCase().includes(value.toLowerCase()) && !selectedCategories.includes(cat._id))
      .map((cat) => ({
        _id: cat._id,
        name: cat.name,
        isSelected: selectedCategories.includes(cat._id),
      }))
    setSuggestedCategories(filtered)
    setSelectedCategoryIndex(-1)
  }

  // Update handleCategoryInputFocus
  const handleCategoryInputFocus = () => {
    setIsCategoryDropdownOpen(true)
    // Show all available categories that aren't already selected
    const availableCategories = categories
      .filter((cat) => !selectedCategories.includes(cat._id))
      .map((cat) => ({
        _id: cat._id,
        name: cat.name,
        isSelected: false,
      }))
    setSuggestedCategories(availableCategories)
  }

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedCategoryIndex((prev) => (prev < suggestedCategories.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedCategoryIndex((prev) => (prev > -1 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedCategoryIndex > -1 && suggestedCategories[selectedCategoryIndex]) {
        handleCategorySelect(suggestedCategories[selectedCategoryIndex]._id)
        setCategoryInput("")
        setSuggestedCategories([])
        setSelectedCategoryIndex(-1)
      }
    } else if (e.key === "Escape") {
      setSuggestedCategories([])
      setSelectedCategoryIndex(-1)
    }
  }

  // Update handleCategorySelect
  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === "") return
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId)
      }
      return [...prev, categoryId]
    })
    setCategoryInput("")
    setSuggestedCategories([])
    setSelectedCategoryIndex(-1)
    setIsCategoryDropdownOpen(false)
  }

  const handleAddPlatform = () => {
    setPlatforms([...platforms, { platformId: "", platform: "", url: "" }])
  }

  const handleRemovePlatform = (index: number) => {
    setPlatforms(platforms.filter((_, i) => i !== index))
  }

  const handlePlatformChange = (index: number, field: keyof PlatformInput, value: string) => {
    const newPlatforms = [...platforms]
    if (field === "platformId") {
      const platform = PREDEFINED_PLATFORMS.find((p) => p.id === value)
      newPlatforms[index] = {
        ...newPlatforms[index],
        platformId: value,
        platform: platform?.name || "",
      }
    } else {
      newPlatforms[index][field] = value
    }
    setPlatforms(newPlatforms)
  }

  const handleEdit = (influencer: Influencer) => {
    setEditingInfluencer(influencer)
    setFormData({
      name: influencer.name,
      email: influencer.email,
      phoneNumber: influencer.phoneNumber,
      gender: influencer.gender,
      bio: influencer.bio,
      images: influencer.images || [],
      videos: influencer.videos || [],
      profileImage: influencer.profileImage || "",
    })
    setSelectedCategories(influencer.category.map((cat) => cat._id))
    setSelectedTags(influencer.tags)
    setPlatforms(
      influencer.socialMedia.map((platform) => ({
        platformId: platform.platform.toLowerCase(),
        platform: platform.platform,
        url: platform.url,
      })),
    )

    // Set file previews for existing media
    if (influencer.images?.length > 0) {
      setFilePreview((prev) => ({
        ...prev,
        photos: influencer.images.map((url, index) => ({
          id: `existing-photo-${index}`,
          url: url.startsWith('http') ? url : `${S3_BASE_URL}/${url}`,
          file: new File([], url.split("/").pop() || ""),
          type: "image",
          signature: url,
        })),
      }))
    }

    if (influencer.videos?.length > 0) {
      setFilePreview((prev) => ({
        ...prev,
        videos: influencer.videos.map((url, index) => ({
          id: `existing-video-${index}`,
          url: url.startsWith('http') ? url : `${S3_BASE_URL}/${url}`,
          file: new File([], url.split("/").pop() || ""),
          type: "video",
          signature: url,
        })),
      }))
    }

    if (influencer.profileImage) {
      setProfilePicturePreview({
        id: "existing-profile",
        url: influencer.profileImage.startsWith('http') ? influencer.profileImage : `${S3_BASE_URL}/${influencer.profileImage}`,
        file: new File([], influencer.profileImage.split("/").pop() || ""),
        type: "image",
        signature: influencer.profileImage,
      })
    }

    openAddModal()
  }

  const handleDelete = async (influencerId: string) => {
    if (!window.confirm("Are you sure you want to delete this influencer?")) return

    setIsLoading(true)
    try {
      await api.delete(`/admin/influencer/${influencerId}`)
      setInfluencers(influencers.filter((inf) => inf._id !== influencerId))
    } catch (error) {
      console.error("Error deleting influencer:", error)
      alert("Failed to delete influencer")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert("Name is required")
      return
    }
    if (!formData.email.trim()) {
      alert("Email is required")
      return
    }
    if (!formData.phoneNumber.trim()) {
      alert("Phone number is required")
      return
    }
    if (!formData.bio.trim().length) {
      alert("Bio is required")
      return
    }
    if (!formData.profileImage && !profilePicturePreview) {
      alert("Profile picture is required")
      return
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one category")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address")
      return
    }

    // Validate mobile format (8 digits after +965)
    const mobileRegex = /^\+965\d{8}$/
    if (!mobileRegex.test(formData.phoneNumber)) {
      alert("Please enter a valid phone number")
      return
    }

    // Filter out empty platform entries and transform to required format
    const validPlatforms = platforms
      .filter((p) => p.platform && p.url)
      .map((p) => ({
        platform: p.platform,
        url: p.url,
      }))

    if (validPlatforms.length === 0) {
      alert("Please add at least one platform")
      return
    }

    // Validate platform URLs
    const urlRegex = /^https?:\/\/.+/
    for (const platform of validPlatforms) {
      if (!urlRegex.test(platform.url)) {
        alert(`Please enter a valid URL for ${platform.platform}`)
        return
      }
    }

    // If all validations pass, create the influencer object and open confirmation modal
    const newInfluencer: Influencer = {
      _id: editingInfluencer?._id || Date.now().toString(),
      ...formData,
      category: selectedCategories.map((id) => categories.find((c) => c._id === id) as Category),
      socialMedia: validPlatforms,
      tags: selectedTags,
      emailSent: editingInfluencer?.emailSent || false,
      isVerified: editingInfluencer?.isVerified || false,
      createdAt: editingInfluencer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setCurrentInfluencer(newInfluencer)
    openConfirmModal()
  }

  const [currentInfluencer, setCurrentInfluencer] = useState<Influencer | null>(null)

  const handleConfirm = async () => {
    if (!currentInfluencer) return

    setIsLoading(true)
    try {
      // Only use S3 URLs for images and videos
      const s3Photos = filePreview.photos
        .map(photo => photo.url)
        .filter(url => url.startsWith(S3_BASE_URL))
      const s3Videos = filePreview.videos
        .map(video => video.url)
        .filter(url => url.startsWith(S3_BASE_URL))

      const dataToSend = {
        name: currentInfluencer.name,
        email: currentInfluencer.email,
        phoneNumber: currentInfluencer.phoneNumber,
        gender: currentInfluencer.gender,
        bio: currentInfluencer.bio,
        category: selectedCategories,
        socialMedia: currentInfluencer.socialMedia,
        tags: currentInfluencer.tags,
        images: s3Photos,
        videos: s3Videos,
        profileImage: formData.profileImage,
      }

      if (editingInfluencer) {
        // Update existing influencer
        const response = await api.put(`/admin/influencer/${editingInfluencer._id}`, dataToSend)
        setFlag(!flag)
        setCurrentInfluencer(response.data)
      } else {
        // Add new influencer
        const response = await api.post("/admin/influencer", dataToSend)
        setFlag(!flag)
        setCurrentInfluencer(response.data)
        openEmailModal()
      }

      closeConfirmModal()
      closeAddModal()
      resetForm()
    } catch (error) {
      console.error("Error saving influencer:", error)
      alert("Failed to save influencer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCredentials = async (sendNow: boolean) => {
    if (currentInfluencer) {
      try {
        setIsSendingCredentials(currentInfluencer._id)
        if (sendNow) {
          await api.post(`/admin/influencer/${currentInfluencer._id}/send-credentials`)

          // Update the influencer's email sent status in the list
          setInfluencers((prev) =>
            prev.map((inf) =>
              inf._id === currentInfluencer._id
                ? {
                    ...inf,
                    updates: {
                      ...inf.updates,
                      welcomeMailWithPasswordSent: true,
                      welcomeMailWithPasswordSentAt: new Date().toISOString(),
                    },
                  }
                : inf,
            ),
          )
        }
        closeEmailModal()
        closeConfirmModal()
        resetForm()
      } catch (error) {
        console.error("Error sending credentials:", error)
        alert("Failed to send credentials. Please try again.")
      } finally {
        setIsSendingCredentials(null)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      gender: "male",
      bio: "",
      images: [],
      videos: [],
      profileImage: "",
    })
    setSelectedCategories([])
    setSelectedTags([])
    setPlatforms([{ platformId: "", platform: "", url: "" }])
    setFilePreview({
      photos: [],
      videos: [],
    })
    if (profilePicturePreview?.url) {
      URL.revokeObjectURL(profilePicturePreview.url)
    }
    setProfilePicturePreview(null)
    setEditingInfluencer(null)
  }

  const generateFileSignature = (file: File): string => {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  const removeFile = (type: "photo" | "video", id: string) => {
    setFilePreview((prev) => {
      const key = (type + "s") as "photos" | "videos"
      const fileToRemove = prev[key].find((f) => f.id === id)

      // Clean up the URL object
      if (fileToRemove?.url) {
        URL.revokeObjectURL(fileToRemove.url)
      }

      // Reset file input if it was the last file of that type
      const remainingFiles = prev[key].filter((f) => f.id !== id)
      if (remainingFiles.length === 0) {
        if (type === "photo" && photoInputRef.current) {
          photoInputRef.current.value = ""
        }
        if (type === "video" && videoInputRef.current) {
          videoInputRef.current.value = ""
        }
      }

      return {
        ...prev,
        [key]: remainingFiles,
      }
    })
  }

  const isDuplicateFile = (file: File, type: "photo" | "video"): boolean => {
    const newFileSignature = generateFileSignature(file)
    const existingFiles = type === "photo" ? filePreview.photos : filePreview.videos
    const duplicateFile = existingFiles.find(
      (existingFile) => generateFileSignature(existingFile.file) === newFileSignature,
    )

    // If file is found but was marked for removal, allow re-upload
    if (duplicateFile) {
      const isRemoved = !(type === "photo"
        ? filePreview.photos.some((f) => f.id === duplicateFile.id)
        : filePreview.videos.some((f) => f.id === duplicateFile.id))
      return !isRemoved
    }

    return false
  }

  // Update uploadMedia function
  const uploadMedia = async (file: File, type: "photo" | "video" | "profilePicture"): Promise<string> => {
    try {
      // Get upload URL from server
      const response = await api.get("/admin/upload-url", {
        params: {
          fileName: file.name,
          fileType: type === "photo" ? "image" : type === "video" ? "video" : "image",
        },
      })

      const { url, key } = response.data

      // Upload file to the URL
      await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      })

      // Return the complete S3 URL
      return `${S3_BASE_URL}/${key}`
    } catch (error) {
      console.error("Error uploading file:", error)
      throw new Error("Failed to upload file")
    }
  }

  // Update handleFileSelect
  const handleFileSelect = async (type: "photo" | "video", files: FileList | null) => {
    if (!files || files.length === 0) return

    const currentFiles = type === "photo" ? filePreview.photos : filePreview.videos
    const maxFiles = type === "photo" ? 5 : 2

    if (currentFiles.length >= maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} ${type}s`)
      return
    }

    const file = files[0]
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (type === "photo" && !isImage) {
      alert("Please select an image file (jpg, png)")
      return
    }

    if (type === "video" && !isVideo) {
      alert("Please select a video file (mp4)")
      return
    }

    if (isDuplicateFile(file, type)) {
      alert(`This ${type} has already been uploaded`)
      return
    }

    // Create preview (initially with blob URL)
    const newFile: FilePreview = {
      id: Date.now().toString(),
      url: URL.createObjectURL(file),
      file,
      type: type === "photo" ? "image" : "video",
      signature: generateFileSignature(file),
    }

    // Add to preview
    setFilePreview((prev) => ({
      ...prev,
      [type === "photo" ? "photos" : "videos"]: [...prev[type === "photo" ? "photos" : "videos"], newFile],
    }))

    // Set loading state
    const mediaType = type === "photo" ? "photos" : "videos"
    setUploadLoading((prev) => ({
      ...prev,
      [mediaType]: { ...prev[mediaType], [newFile.id]: true },
    }))

    try {
      // Upload file
      const uploadedUrl = await uploadMedia(file, type)

      // Update form data with the uploaded S3 URL (replace blob URL)
      setFormData((prev) => ({
        ...prev,
        [type === "photo" ? "images" : "videos"]: [
          ...(prev[type === "photo" ? "images" : "videos"] || []).filter((url) => url.startsWith(S3_BASE_URL)),
          uploadedUrl,
        ],
      }))
      // Update the preview URL to use the S3 URL
      setFilePreview((prev) => ({
        ...prev,
        [mediaType]: prev[mediaType].map((media) =>
          media.id === newFile.id ? { ...media, url: uploadedUrl } : media
        ),
      }))

      // Clear loading state
      setUploadLoading((prev) => ({
        ...prev,
        [mediaType]: { ...prev[mediaType], [newFile.id]: false },
      }))
    } catch (error) {
      console.error("Error uploading file:", error)
      // Remove the preview if upload fails
      setFilePreview((prev) => ({
        ...prev,
        [type === "photo" ? "photos" : "videos"]: prev[type === "photo" ? "photos" : "videos"].filter(
          (f) => f.id !== newFile.id,
        ),
      }))
      alert("Failed to upload file. Please try again.")
    }
  }

  // Update handleProfilePictureSelect
  const handleProfilePictureSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file for profile picture")
      return
    }

    // Set loading state
    setUploadLoading((prev) => ({
      ...prev,
      profilePicture: true,
    }))

    try {
      // Upload file
      // const uploadedUrl = await uploadMedia(file, 'profilePicture');

      // // Update form data
      // setFormData(prev => ({
      //     ...prev,
      //     profileImage: uploadedUrl
      // }));

      // Create preview
      const reader = new FileReader()
      reader.addEventListener("load", () => {
        setProfilePictureState((prev) => ({
          ...prev,
          src: reader.result?.toString() || "",
          crop: undefined,
        }))
        setShowCropModal(true)
      })
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      alert("Failed to upload profile picture. Please try again.")
    } finally {
      setUploadLoading((prev) => ({
        ...prev,
        profilePicture: false,
      }))
    }
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const cropWidth = Math.min(width, height)
    const cropHeight = cropWidth
    const x = (width - cropWidth) / 2
    const y = (height - cropHeight) / 2

    setProfilePictureState((prev) => ({
      ...prev,
      crop: {
        unit: "px",
        x,
        y,
        width: cropWidth,
        height: cropHeight,
      },
    }))
  }

  const handleCropComplete = (crop: PixelCrop) => {
    setProfilePictureState((prev) => ({
      ...prev,
      completedCrop: crop,
    }))
  }

  const handleCropChange = (crop: Crop) => {
    setProfilePictureState((prev) => ({
      ...prev,
      crop,
    }))
  }

  const handleCropApply = async () => {
    if (!imgRef.current || !profilePictureState.completedCrop) return

    setIsCropping(true)
    try {
      const image = imgRef.current
      const crop = profilePictureState.completedCrop
      const scale = profilePictureState.scale || 1

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const pixelRatio = window.devicePixelRatio

      const canvas = document.createElement("canvas")
      canvas.width = crop.width * pixelRatio
      canvas.height = crop.height * pixelRatio

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.imageSmoothingQuality = "high"

      ctx.drawImage(
        image,
        (crop.x * scaleX) / scale,
        (crop.y * scaleY) / scale,
        (crop.width * scaleX) / scale,
        (crop.height * scaleY) / scale,
        0,
        0,
        crop.width,
        crop.height,
      )

      // Convert canvas to blob
      canvas.toBlob(
        async (blob) => {
          if (!blob) return

          // Create a File object from the blob
          const croppedFile = new File([blob], "cropped-profile.jpg", { type: "image/jpeg" })

          try {
            setUploadLoading((prev) => ({ ...prev, profilePicture: true }))
            const url: string = await uploadMedia(croppedFile, "photo")

            if (url) {
              setFormData((prev) => ({ ...prev, profileImage: url }))
              setProfilePicturePreview({
                id: Date.now().toString(),
                url: url,
                file: croppedFile,
                type: "image",
                signature: generateFileSignature(croppedFile),
              })
            }
          } catch (error) {
            console.error("Error uploading cropped image:", error)
            alert("Failed to upload cropped image. Please try again.")
          } finally {
            setUploadLoading((prev) => ({ ...prev, profilePicture: false }))
            setShowCropModal(false)
            setIsCropping(false)
          }
        },
        "image/jpeg",
        0.95,
      )
    } catch (error) {
      console.error("Error processing crop:", error)
      alert("Failed to process image crop. Please try again.")
      setIsCropping(false)
    }
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTagInput(value)

    if (value.trim()) {
      const filtered = PREDEFINED_TAGS.filter(
        (tag) => tag.toLowerCase().includes(value.toLowerCase()) && !selectedTags.includes(tag),
      )
      setSuggestedTags(filtered)
    } else {
      setSuggestedTags([])
    }
    setSelectedTagIndex(-1)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedTagIndex((prev) => (prev < suggestedTags.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedTagIndex((prev) => (prev > -1 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedTagIndex > -1 && suggestedTags[selectedTagIndex]) {
        handleTagSelect(suggestedTags[selectedTagIndex])
      } else if (tagInput.trim()) {
        if (!selectedTags.includes(tagInput)) {
          setSelectedTags((prev) => [...prev, tagInput])
        }
        setTagInput("")
        setSuggestedTags([])
      }
      setSelectedTagIndex(-1)
    } else if (e.key === "Escape") {
      setSuggestedTags([])
      setSelectedTagIndex(-1)
    }
  }

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag])
    }
    setTagInput("")
    setSuggestedTags([])
    setSelectedTagIndex(-1)
  }

  const handleTagRemove = (tagToRemove: string) => {
    setSelectedTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleCloseAddModal = () => {
    resetForm()
    setEditingInfluencer(null)
    closeAddModal()
  }

  const isAnyMediaUploading = () => {
    return (
      uploadLoading.profilePicture ||
      Object.values(uploadLoading.photos).some(Boolean) ||
      Object.values(uploadLoading.videos).some(Boolean)
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          onClick={openAddModal}
          startIcon={<PlusIcon />}
          disabled={isLoading || isTableLoading}
          className="transform transition-transform hover:scale-105 active:scale-95"
        >
          {isLoading ? "Loading..." : "Add Influencer"}
        </Button>
      </div>

      {/* Influencers Table */}
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
        ) : influencers.length === 0 ? (
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
            <p className="mb-4 text-gray-600 dark:text-gray-400">No influencers added yet</p>
            <Button
              size="sm"
              onClick={openAddModal}
              startIcon={<PlusIcon />}
              disabled={isLoading || isTableLoading}
              className="transform transition-transform hover:scale-105 active:scale-95"
            >
              Add Your First Influencer
            </Button>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
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
                    Categories
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Email Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((influencer) => (
                  <tr
                    key={influencer._id}
                    className="border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-6 py-4">
                      {influencer.profileImage && (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={influencer.profileImage || "/placeholder.svg"}
                            alt={influencer.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{influencer.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{influencer.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{influencer.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {influencer?.category?.map((cat) => (
                          <span
                            key={cat._id}
                            className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-full"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {influencer.updates?.welcomeMailWithPasswordSent ? (
                        <span className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/40 rounded-full">
                          Sent
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="!px-2 !py-1 !text-xs rounded-xl border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200"
                          onClick={() => {
                            setCurrentInfluencer(influencer)
                            openEmailModal()
                          }}
                          disabled={isSendingCredentials === influencer._id || isTableLoading}
                        >
                          {isSendingCredentials === influencer._id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                              Sending...
                            </div>
                          ) : (
                            "Send Credentials"
                          )}
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(influencer)}
                          startIcon={<PencilIcon />}
                          disabled={isLoading || isSendingCredentials === influencer._id || isTableLoading}
                          className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(influencer._id)}
                          startIcon={<TrashBinIcon />}
                          disabled={isLoading || isSendingCredentials === influencer._id || isTableLoading}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border-gray-300 dark:border-slate-700"
                        >
                          Delete
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

      {/* Add Influencer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
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
                    {editingInfluencer ? "Edit Influencer" : "Add New Influencer"}
                  </h4>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <CloseIcon
                      className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                      onClick={handleCloseAddModal}
                    />
                  </motion.div>
                </motion.div>

                <motion.div
                  className="flex-1 overflow-y-auto p-5 lg:p-6 max-h-[calc(100vh-90px)]"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    {/* Basic Information */}
                    <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={itemVariants}>
                      <div>
                        <label
                          htmlFor="name"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200"
                        >
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200"
                        >
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200"
                        >
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 dark:text-gray-400">
                            +965
                          </span>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber.replace("+965", "")}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "")
                              if (value.length <= 8) {
                                setFormData((prev) => ({
                                  ...prev,
                                  phoneNumber: "+965" + value,
                                }))
                              }
                            }}
                            className="w-full pl-14 pr-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                            placeholder="XXXXXXXX"
                            autoComplete="off"
                            required
                            maxLength={8}
                          />
                        </div>
                      </div>
                      <div>
                        <label
                          htmlFor="gender"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200"
                        >
                          Gender <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </motion.div>
                    {/* Profile Picture with Cropping */}
                    <motion.div variants={itemVariants}>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          Profile Picture <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          ref={profilePictureRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleProfilePictureSelect(e.target.files)}
                          disabled={uploadLoading.profilePicture}
                        />
                        <div className="space-y-4">
                          {profilePicturePreview ? (
                            <div className="relative w-32 h-32 group">
                              <div className="absolute inset-0 rounded-full overflow-hidden bg-gray-50">
                                <Image
                                  src={profilePicturePreview.url || "/placeholder.svg"}
                                  alt="Profile Preview"
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 128px) 100vw, 128px"
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => {
                                    if (profilePicturePreview.url) {
                                      URL.revokeObjectURL(profilePicturePreview.url)
                                    }
                                    setProfilePicturePreview(null)
                                    setFormData((prev) => ({ ...prev, profileImage: "" }))
                                    if (profilePictureRef.current) {
                                      profilePictureRef.current.value = ""
                                    }
                                  }}
                                  disabled={uploadLoading.profilePicture}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => !uploadLoading.profilePicture && profilePictureRef.current?.click()}
                              className={`w-32 h-32 flex items-center justify-center rounded-full border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-300 transition-all hover:scale-105 active:scale-95 ${uploadLoading.profilePicture ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {uploadLoading.profilePicture ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                      />
                                    </svg>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 p-2">Upload Profile Picture</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Categories */}
                    <motion.div variants={itemVariants}>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedCategories.map((catId) => {
                              const category = categories.find((c) => c._id === catId)
                              return category ? (
                                <motion.span
                                  key={catId}
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.9, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600  bg-blue-50 dark:bg-blue-900/40 rounded-full dark:text-blue-200 transition-transform hover:scale-105"
                                >
                                  {category.name}
                                  <button
                                    type="button"
                                    onClick={() => handleCategorySelect(catId)}
                                    className="ml-2 focus:outline-none hover:text-blue-800 dark:hover:text-blue-300"
                                  >
                                    <CloseIcon className="w-4 h-4 text-black" />
                                  </button>
                                </motion.span>
                              ) : null
                            })}
                          </div>
                          <div className="relative category-dropdown-container">
                            <input
                              type="text"
                              value={categoryInput}
                              onChange={handleCategoryInputChange}
                              onFocus={handleCategoryInputFocus}
                              onKeyDown={handleCategoryKeyDown}
                              placeholder="Search categories..."
                              className="w-full px-3 py-2  text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 dark:border-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 "
                            />
                            {isCategoryDropdownOpen && suggestedCategories.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className="absolute z-10 w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg shadow-lg dark:bg-slate-800 dark:border-gray-700 max-h-60 overflow-y-auto"
                              >
                                {suggestedCategories.map((category, index) => (
                                  <button
                                    key={category._id}
                                    type="button"
                                    onClick={() => handleCategorySelect(category._id)}
                                    className={`w-full px-3 py-2 text-left text-black dark:text-gray-200 dark:hover:bg-slate-700 hover:bg-gray-200 ${
                                      index === selectedCategoryIndex ? "bg-gray-200 dark:bg-slate-700" : ""
                                    }`}
                                  >
                                    {category.name}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tags */}
                    <motion.div variants={itemVariants}>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">Tags</label>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedTags.map((tag) => (
                              <motion.span
                                key={tag}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-600  bg-purple-50 dark:bg-purple-900/40 rounded-full dark:text-purple-200 transition-transform hover:scale-105"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleTagRemove(tag)}
                                  className="ml-2 focus:outline-none hover:text-purple-800 dark:hover:text-purple-300"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                              </motion.span>
                            ))}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              value={tagInput}
                              onChange={handleTagInputChange}
                              onKeyDown={handleTagKeyDown}
                              placeholder="Type and press Enter to add tags..."
                              className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 dark:border-slate-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800"
                            />
                            {suggestedTags.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className="absolute z-10 w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg shadow-lg dark:bg-slate-800 dark:border-gray-700 max-h-60 overflow-y-auto"
                              >
                                {suggestedTags.map((tag, index) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagSelect(tag)}
                                    className={`w-full px-3 py-2 text-left text-gray-900  dark:text-white dark:hover:bg-slate-700 hover:bg-gray-200 ${
                                      index === selectedTagIndex ? "bg-gray-200 dark:bg-slate-700" : ""
                                    }`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Bio */}
                    <motion.div variants={itemVariants}>
                      <div>
                        <label
                          htmlFor="bio"
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200"
                        >
                          Bio <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                        />
                      </div>
                    </motion.div>

                    {/* Platform URLs */}
                    <motion.div variants={itemVariants}>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          Social Media Platforms <span className="text-red-500">*</span>
                        </label>
                        {platforms.map((platform, index) => (
                          <div key={index} className="space-y-4 mb-6 transition-transform hover:scale-[1.02]">
                            <div className="flex gap-4">
                              <div className="w-1/4">
                                <select
                                  value={platform.platformId}
                                  onChange={(e) => handlePlatformChange(index, "platformId", e.target.value)}
                                  className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                                >
                                  <option value="">Select platform..</option>
                                  {PREDEFINED_PLATFORMS.map((p) => (
                                    <option
                                      key={p.id}
                                      value={p.id}
                                      disabled={platforms.some(
                                        (platform, i) => i !== index && platform.platformId === p.id,
                                      )}
                                    >
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1">
                                <input
                                  type="url"
                                  placeholder="URL"
                                  value={platform.url}
                                  onChange={(e) => handlePlatformChange(index, "url", e.target.value)}
                                  className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                                />
                              </div>
                              {platforms.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleRemovePlatform(index)}
                                  className="!p-2"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddPlatform}
                          startIcon={<PlusIcon />}
                          disabled={platforms.some((p) => !p.platformId || !p.url) }
                        >
                          Add Platform
                        </Button>
                      </div>
                    </motion.div>

                    {/* File Uploads */}
                    <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2" variants={itemVariants}>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          Upload Photos
                        </label>
                        <input
                          type="file"
                          ref={photoInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleFileSelect("photo", e.target.files)}
                          disabled={Object.values(uploadLoading.photos).some(Boolean)}
                        />
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {filePreview.photos.map((photo) => (
                              <div key={photo.id} className="relative group aspect-square">
                                <div className="absolute inset-0 rounded-lg overflow-hidden bg-gray-50">
                                  <Image
                                    src={photo.url || "/placeholder.svg" }
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  {uploadLoading.photos[photo.id] ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                  ) : (
                                    <Button size="sm" variant="primary" onClick={() => removeFile("photo", photo.id)}>
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {filePreview.photos.length < 5 && (
                            <div
                              onClick={() =>
                                !Object.values(uploadLoading.photos).some(Boolean) && photoInputRef.current?.click()
                              }
                              className={`aspect-square flex items-center justify-center w-full border-2 border-dashed rounded-lg border-gray-200 cursor-pointer hover:border-gray-300 transition-all hover:scale-105 active:scale-95 ${Object.values(uploadLoading.photos).some(Boolean) ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {Object.values(uploadLoading.photos).some(Boolean) ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                      />
                                    </svg>
                                  </div>
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Support formats: jpg, png (Max 5 photos)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          Upload Videos
                        </label>
                        <input
                          type="file"
                          ref={videoInputRef}
                          className="hidden"
                          accept="video/mp4"
                          onChange={(e) => handleFileSelect("video", e.target.files)}
                          disabled={Object.values(uploadLoading.videos).some(Boolean)}
                        />
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            {filePreview.videos.map((video) => (
                              <div key={video.id} className="relative group aspect-square">
                                <div className="absolute inset-0 rounded-lg overflow-hidden bg-gray-50">
                                  <video
                                    src={video.url}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    controls
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  {uploadLoading.videos[video.id] ? (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                  ) : (
                                    <Button size="sm" variant="primary" onClick={() => removeFile("video", video.id)}>
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {filePreview.videos.length < 2 && (
                            <div
                              onClick={() =>
                                !Object.values(uploadLoading.videos).some(Boolean) && videoInputRef.current?.click()
                              }
                              className={`aspect-square flex items-center justify-center w-full border-2 border-dashed rounded-lg border-gray-200 cursor-pointer hover:border-gray-300 transition-all hover:scale-105 active:scale-95 ${Object.values(uploadLoading.videos).some(Boolean) ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              {Object.values(uploadLoading.videos).some(Boolean) ? (
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-8 h-8 mx-auto mb-2 text-gray-500 dark:text-gray-400">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                      />
                                    </svg>
                                  </div>
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    Click to upload or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Support formats: Video Mp4 (Max 2 videos)
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Crop Modal */}
                    <motion.div variants={itemVariants}>
                      <Modal
                        isOpen={showCropModal}
                        onClose={() => setShowCropModal(false)}
                        className="max-w-[800px] p-5"
                      >
                        <div className="space-y-4">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">Crop Profile Picture</h4>
                          <div className="relative max-h-[60vh] overflow-auto flex items-center justify-center">
                            {profilePictureState.src && (
                              <div className="relative w-full max-w-[600px] mx-auto">
                                <ReactCrop
                                  crop={profilePictureState.crop}
                                  onChange={handleCropChange}
                                  onComplete={handleCropComplete}
                                  aspect={1}
                                  circularCrop
                                >
                                  <Image
                                    ref={imgRef}
                                    src={profilePictureState.src || "/placeholder.svg"}
                                    onLoad={onImageLoad}
                                    alt="Crop preview"
                                    className="max-w-full max-h-[50vh] object-contain"
                                  />
                                </ReactCrop>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowCropModal(false)
                                setProfilePictureState({
                                  aspect: 1,
                                })
                              }}
                              disabled={isCropping}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={handleCropApply} disabled={isCropping}>
                              {isCropping ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Applying...
                                </div>
                              ) : (
                                "Apply Crop"
                              )}
                            </Button>
                          </div>
                        </div>
                      </Modal>
                    </motion.div>

                    <motion.div className="flex items-center justify-end gap-3" variants={itemVariants}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCloseAddModal}
                        disabled={isLoading || isAnyMediaUploading()}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        className="add-influencer-btn"
                        disabled={isLoading || isAnyMediaUploading()}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </div>
                        ) : editingInfluencer ? (
                          "Update Influencer"
                        ) : (
                          "Add Influencer"
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <Modal
            isOpen={isConfirmOpen}
            onClose={closeConfirmModal}
            className="max-w-[600px] max-h-[80vh] !p-0 overflow-y-auto"
          >
            <motion.div
              className="h-full flex flex-col bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            //   exit={{ scale: 0.95, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.5,
              }}
            >
              <div className="p-6 lg:p-8 border-b border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">Confirm Influencer Details</h4>
              </div>

              {currentInfluencer && (
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Basic Information</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Name</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">{currentInfluencer.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">{currentInfluencer.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Phone Number</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200">
                            {currentInfluencer.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Gender</p>
                          <p className="font-medium text-gray-900 dark:text-gray-200 capitalize">
                            {currentInfluencer.gender}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Categories</h5>
                      <div className="flex flex-wrap gap-2">
                        {currentInfluencer.category.map((cat) => (
                          <span
                            key={cat._id}
                            className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-full"
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    {currentInfluencer.tags && currentInfluencer.tags.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Tags</h5>
                        <div className="flex flex-wrap gap-2">
                          {currentInfluencer.tags.map((tag) => (
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
                    {currentInfluencer.bio && (
                      <div>
                        <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Bio</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{currentInfluencer.bio}</p>
                      </div>
                    )}

                    {/* Platforms */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Platforms</h5>
                      <div className="space-y-2">
                        {currentInfluencer.socialMedia.map((platform, index) => (
                          <div key={platform._id || index} className="flex items-center gap-2 text-sm">
                            <span className="font-medium min-w-[80px] dark:text-gray-400">{platform.platform}:</span>
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

                    {/* Media Preview */}
                    {(filePreview.photos.length > 0 || filePreview.videos.length > 0) && (
                      <div className="space-y-4">
                        {filePreview.photos.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Photos</h5>
                            <div className="grid grid-cols-3 gap-3">
                              {filePreview.photos.map((photo) => (
                                <div
                                  key={photo.id}
                                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-50"
                                >
                                  <Image
                                    src={photo.url || "/placeholder.svg"}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {filePreview.videos.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-gray-200 mb-3">Videos</h5>
                            <div className="grid grid-cols-3 gap-3">
                              {filePreview.videos.map((video) => (
                                <div
                                  key={video.id}
                                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-50"
                                >
                                  <video
                                    src={video.url}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    controls
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="p-5 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-end gap-3">
                  <Button size="sm" variant="outline" onClick={closeConfirmModal}>
                    Cancel
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleConfirm}>
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      "Confirm & Proceed"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Send Credentials Modal */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <Modal isOpen={isEmailModalOpen} onClose={closeEmailModal} className="max-w-[500px] !p-0">
            <motion.div
              className="bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800 p-6 lg:p-8"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            //   exit={{ scale: 0.95, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.5,
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">Send Login Credentials</h4>
                </div>
                <div className="py-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Would you like to send the login credentials to{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-200">{currentInfluencer?.email}</span>?
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendCredentials(false)}
                    disabled={isSendingCredentials === currentInfluencer?._id}
                  >
                    Not Now
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSendCredentials(true)}
                    disabled={isSendingCredentials === currentInfluencer?._id}
                  >
                    {isSendingCredentials === currentInfluencer?._id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Sending...
                      </div>
                    ) : (
                      "Send Now"
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
