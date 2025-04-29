"use client";

import React, { useState, useRef } from "react";
import { PlusIcon, CloseIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import Image from "next/image";

interface Platform {
    name: string;
    url: string;
    icon?: React.ReactNode;
}

interface Influencer {
    id: string;
    name: string;
    email: string;
    mobile: string;
    gender: string;
    categories: string[];
    bio: string;
    photos: string[];
    videos: string[];
    platforms: Platform[];
    profilePicture?: string;
    tags: string[];
    emailSent: boolean;
}

interface Category {
    id: string;
    name: string;
}

const PREDEFINED_PLATFORMS = [
    {
        id: "instagram",
        name: "Instagram",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
            </svg>
        )
    },
    {
        id: "youtube",
        name: "YouTube",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        )
    },
    {
        id: "tiktok",
        name: "TikTok",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
        )
    },
    {
        id: "facebook",
        name: "Facebook",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        )
    },
    {
        id: "twitter",
        name: "Twitter",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
        )
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        )
    },
    {
        id: "other",
        name: "Other",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-2h2V7h-2z" />
            </svg>
        )
    }
];

interface PlatformInput extends Platform {
    platformId: string;
}

interface FilePreview {
    id: string;
    url: string;
    file: File;
    type: 'image' | 'video';
    signature: string;
}

const PREDEFINED_TAGS = [
    "Giveaway",
    "Paid Partnership",
    "Brand Ambassador",
    "Product Review",
    "Sponsored",
    "Organic",
    "Event Coverage",
    "Contest"
];

export default function InfluencerPage() {
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [platforms, setPlatforms] = useState<PlatformInput[]>([{ platformId: "", name: "", url: "" }]);
    const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
    const { isOpen: isConfirmOpen, openModal: openConfirmModal, closeModal: closeConfirmModal } = useModal();
    const { isOpen: isEmailModalOpen, openModal: openEmailModal, closeModal: closeEmailModal } = useModal();
    const profilePictureRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        gender: "male",
        bio: "",
        photos: [],
        videos: [],
        profilePicture: "",
    });

    // Sample categories - replace with actual categories from your backend
    const categories: Category[] = [
        { id: "1", name: "Fashion" },
        { id: "2", name: "Technology" },
        { id: "3", name: "Lifestyle" },
        { id: "4", name: "Food" },
        { id: "5", name: "Travel" },
    ];

    const [filePreview, setFilePreview] = useState<{
        photos: FilePreview[];
        videos: FilePreview[];
    }>({
        photos: [],
        videos: []
    });
    const photoInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [profilePicturePreview, setProfilePicturePreview] = useState<FilePreview | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategorySelect = (categoryId: string) => {
        if (categoryId === "") return; // Prevent selecting the placeholder option
        setSelectedCategories((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            }
            return [...prev, categoryId];
        });
    };

    const handleAddPlatform = () => {
        setPlatforms([...platforms, { platformId: "", name: "", url: "" }]);
    };

    const handleRemovePlatform = (index: number) => {
        setPlatforms(platforms.filter((_, i) => i !== index));
    };

    const handlePlatformChange = (index: number, field: keyof PlatformInput, value: string) => {
        const newPlatforms = [...platforms];
        if (field === "platformId") {
            const platform = PREDEFINED_PLATFORMS.find(p => p.id === value);
            newPlatforms[index] = {
                ...newPlatforms[index],
                platformId: value,
                name: platform?.name || "",
                icon: platform?.icon
            };
        } else {
            newPlatforms[index][field] = value;
        }
        setPlatforms(newPlatforms);
    };

    const handleSubmit = () => {
        // Validate required fields
        if (!formData.name.trim()) {
            alert('Name is required');
            return;
        }
        if (!formData.email.trim()) {
            alert('Email is required');
            return;
        }
        if (!formData.mobile.trim()) {
            alert('Mobile number is required');
            return;
        }
        if (selectedCategories.length === 0) {
            alert('Please select at least one category');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Validate mobile format (assuming 10 digits)
        const mobileRegex = /^\+?[\d\s-]{10,}$/;
        if (!mobileRegex.test(formData.mobile)) {
            alert('Please enter a valid mobile number');
            return;
        }

        // Filter out empty platform entries
        const validPlatforms = platforms.filter(p => p.name && p.url);
        if (validPlatforms.length === 0) {
            alert('Please add at least one platform');
            return;
        }

        // Validate platform URLs
        const urlRegex = /^https?:\/\/.+/;
        for (const platform of validPlatforms) {
            if (!urlRegex.test(platform.url)) {
                alert(`Please enter a valid URL for ${platform.name}`);
                return;
            }
        }

        const newInfluencer: Influencer = {
            id: Date.now().toString(),
            ...formData,
            categories: selectedCategories,
            platforms: validPlatforms,
            photos: filePreview.photos.map(p => p.url),
            videos: filePreview.videos.map(v => v.url),
            profilePicture: profilePicturePreview?.url || "",
            tags: selectedTags,
            emailSent: false
        };
        openConfirmModal();
        setCurrentInfluencer(newInfluencer);
    };

    const [currentInfluencer, setCurrentInfluencer] = useState<Influencer | null>(null);

    const handleConfirm = () => {
        if (currentInfluencer) {
            setInfluencers(prev => [...prev, currentInfluencer]);
            closeConfirmModal();
            openEmailModal();
        }
    };

    const handleSendCredentials = (sendNow: boolean) => {
        if (currentInfluencer) {
            setInfluencers(prev => prev.map(inf =>
                inf.id === currentInfluencer.id
                    ? { ...inf, emailSent: sendNow }
                    : inf
            ));
        }
        closeEmailModal();
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            mobile: "",
            gender: "male",
            bio: "",
            photos: [],
            videos: [],
            profilePicture: "",
        });
        setSelectedCategories([]);
        setSelectedTags([]);
        setPlatforms([{ platformId: "", name: "", url: "" }]);
        setFilePreview({
            photos: [],
            videos: []
        });
        if (profilePicturePreview?.url) {
            URL.revokeObjectURL(profilePicturePreview.url);
        }
        setProfilePicturePreview(null);
        closeAddModal();
    };

    const generateFileSignature = (file: File): string => {
        return `${file.name}-${file.size}-${file.lastModified}`;
    };

    const removeFile = (type: 'photo' | 'video', id: string) => {
        setFilePreview(prev => {
            const key = type + 's' as 'photos' | 'videos';
            const fileToRemove = prev[key].find(f => f.id === id);

            // Clean up the URL object
            if (fileToRemove?.url) {
                URL.revokeObjectURL(fileToRemove.url);
            }

            // Reset file input if it was the last file of that type
            const remainingFiles = prev[key].filter(f => f.id !== id);
            if (remainingFiles.length === 0) {
                if (type === 'photo' && photoInputRef.current) {
                    photoInputRef.current.value = '';
                }
                if (type === 'video' && videoInputRef.current) {
                    videoInputRef.current.value = '';
                }
            }

            return {
                ...prev,
                [key]: remainingFiles
            };
        });
    };

    const isDuplicateFile = (file: File, type: 'photo' | 'video'): boolean => {
        const newFileSignature = generateFileSignature(file);
        const existingFiles = type === 'photo' ? filePreview.photos : filePreview.videos;
        const duplicateFile = existingFiles.find(existingFile =>
            generateFileSignature(existingFile.file) === newFileSignature
        );

        // If file is found but was marked for removal, allow re-upload
        if (duplicateFile) {
            const isRemoved = !(type === 'photo' ?
                filePreview.photos.some(f => f.id === duplicateFile.id) :
                filePreview.videos.some(f => f.id === duplicateFile.id));
            return !isRemoved;
        }

        return false;
    };

    const handleFileSelect = (type: 'photo' | 'video', files: FileList | null) => {
        if (!files || files.length === 0) return;

        const currentFiles = type === 'photo' ? filePreview.photos : filePreview.videos;
        const maxFiles = type === 'photo' ? 5 : 2;

        if (currentFiles.length >= maxFiles) {
            alert(`You can upload a maximum of ${maxFiles} ${type}s`);
            return;
        }

        const file = files[0];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (type === 'photo' && !isImage) {
            alert('Please select an image file (jpg, png)');
            return;
        }

        if (type === 'video' && !isVideo) {
            alert('Please select a video file (mp4)');
            return;
        }

        if (isDuplicateFile(file, type)) {
            alert(`This ${type} has already been uploaded`);
            return;
        }

        if (type === 'photo' && photoInputRef.current) {
            photoInputRef.current.value = '';
        }
        if (type === 'video' && videoInputRef.current) {
            videoInputRef.current.value = '';
        }

        const newFile: FilePreview = {
            id: Date.now().toString(),
            url: URL.createObjectURL(file),
            file,
            type: type === 'photo' ? 'image' : 'video',
            signature: generateFileSignature(file)
        };

        setFilePreview(prev => ({
            ...prev,
            [type === 'photo' ? 'photos' : 'videos']: [...prev[type === 'photo' ? 'photos' : 'videos'], newFile]
        }));
    };

    const handleProfilePictureSelect = (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file for profile picture');
            return;
        }

        if (profilePicturePreview?.url) {
            URL.revokeObjectURL(profilePicturePreview.url);
        }

        const newFile: FilePreview = {
            id: Date.now().toString(),
            url: URL.createObjectURL(file),
            file,
            type: 'image',
            signature: generateFileSignature(file)
        };

        setProfilePicturePreview(newFile);
    };

    const handleTagSelect = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            }
            return [...prev, tag];
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <Button
                    size="sm"
                    onClick={openAddModal}
                    startIcon={<PlusIcon />}
                >
                    Add Influencer
                </Button>
            </div>

            {/* Influencers Table */}
            <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
                {influencers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="mb-4 text-gray-500 dark:text-gray-400">No influencers added yet</p>
                        <Button
                            size="sm"
                            onClick={openAddModal}
                            startIcon={<PlusIcon />}
                        >
                            Add Your First Influencer
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Profile</th>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Email</th>
                                    <th scope="col" className="px-6 py-3">Mobile</th>
                                    <th scope="col" className="px-6 py-3">Categories</th>
                                    <th scope="col" className="px-6 py-3">Email Status</th>
                                    <th scope="col" className="px-6 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {influencers.map((influencer) => (
                                    <tr key={influencer.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                        <td className="px-6 py-4">
                                            {influencer.profilePicture && (
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                                                    <Image
                                                        src={influencer.profilePicture}
                                                        alt={influencer.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {influencer.name}
                                        </td>
                                        <td className="px-6 py-4">{influencer.email}</td>
                                        <td className="px-6 py-4">{influencer.mobile}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {influencer.categories.map((catId) => (
                                                    <span key={catId} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                                        {categories.find(c => c.id === catId)?.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {influencer.emailSent ? (
                                                <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full">
                                                    Sent
                                                </span>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="!px-2 !py-1 !text-xs rounded-md"
                                                    onClick={() => {
                                                        setCurrentInfluencer(influencer);
                                                        openEmailModal();
                                                    }}
                                                >
                                                    Send Credentials
                                                </Button>

                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline">Edit</Button>
                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
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
            <Modal
                isOpen={isAddModalOpen}
                onClose={closeAddModal}
                className="max-w-[800px] !fixed !right-0 !top-0 !bottom-0 !translate-x-0 !rounded-l-2xl !rounded-r-none "
            >
                <div className="h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm">

                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
                                Add New Influencer
                            </h4>

                            <CloseIcon className="w-4 h-4" onClick={closeAddModal} />
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 lg:p-6 max-h-[calc(100vh-90px)]">

                            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Mobile
                                        </label>
                                        <input
                                            type="tel"
                                            id="mobile"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="gender" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Categories
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedCategories.map((catId) => (
                                            <span
                                                key={catId}
                                                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200"
                                            >
                                                {categories.find(c => c.id === catId)?.name}
                                                <button
                                                    type="button"
                                                    onClick={() => handleCategorySelect(catId)}
                                                    className="ml-2 focus:outline-none  hover:text-blue-800 dark:hover:text-blue-300"
                                                >
                                                    <CloseIcon className="w-4 h-4 " />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <select
                                        value=""
                                        onChange={(e) => handleCategorySelect(e.target.value)}
                                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="">Select categories...</option>
                                        {categories.map((category) => (
                                            <option
                                                key={category.id}
                                                value={category.id}
                                                disabled={selectedCategories.includes(category.id)}
                                            >
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Tags
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200"
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTagSelect(tag)}
                                                        className="ml-2 focus:outline-none hover:text-purple-800 dark:hover:text-purple-300"
                                                    >
                                                        <CloseIcon className="w-4 h-4" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <select
                                            value=""
                                            onChange={(e) => handleTagSelect(e.target.value)}
                                            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">Select tags...</option>
                                            {PREDEFINED_TAGS.map((tag) => (
                                                <option
                                                    key={tag}
                                                    value={tag}
                                                    disabled={selectedTags.includes(tag)}
                                                >
                                                    {tag}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div>
                                    <label htmlFor="bio" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>

                                {/* Platform URLs */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Platform URLs
                                    </label>
                                    {platforms.map((platform, index) => (
                                        <div key={index} className="flex gap-4 mb-4">
                                            <div className="w-1/4.5">
                                                <select
                                                    value={platform.platformId}
                                                    onChange={(e) => handlePlatformChange(index, "platformId", e.target.value)}
                                                    className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                >
                                                    <option value="">Select platform..</option>
                                                    {PREDEFINED_PLATFORMS.map((p) => (
                                                        <option
                                                            key={p.id}
                                                            value={p.id}
                                                            disabled={platforms.some(
                                                                (platform, i) => i !== index && platform.platformId === p.id
                                                            )}
                                                        >

                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="flex-1 flex items-center gap-2">
                                                {platform.icon && (
                                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                        {platform.icon}
                                                    </div>
                                                )}
                                                <input
                                                    type="url"
                                                    placeholder="URL"
                                                    value={platform.url}
                                                    onChange={(e) => handlePlatformChange(index, "url", e.target.value)}
                                                    className="flex-1 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                    ))}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAddPlatform}
                                        startIcon={<PlusIcon />}
                                    >
                                        Add Platform
                                    </Button>
                                </div>

                                {/* File Uploads */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Upload Photos
                                        </label>
                                        <input
                                            type="file"
                                            ref={photoInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileSelect('photo', e.target.files)}
                                        />
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                {filePreview.photos.map((photo) => (
                                                    <div key={photo.id} className="relative group aspect-square">
                                                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={photo.url}
                                                                alt="Preview"
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => removeFile('photo', photo.id)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {filePreview.photos.length < 5 && (
                                                <div
                                                    onClick={() => photoInputRef.current?.click()}
                                                    className="aspect-square flex items-center justify-center w-full border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                                >
                                                    <div className="text-center">
                                                        <div className="w-8 h-8 mx-auto mb-2 text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                        </div>
                                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                            Click to upload or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Support formats: jpg, png (Max 5 photos)
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                            Upload Videos
                                        </label>
                                        <input
                                            type="file"
                                            ref={videoInputRef}
                                            className="hidden"
                                            accept="video/mp4"
                                            onChange={(e) => handleFileSelect('video', e.target.files)}
                                        />
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                {filePreview.videos.map((video) => (
                                                    <div key={video.id} className="relative group aspect-square">
                                                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                                                            <video
                                                                src={video.url}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                controls
                                                            />
                                                        </div>
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="primary"
                                                                onClick={() => removeFile('video', video.id)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {filePreview.videos.length < 2 && (
                                                <div
                                                    onClick={() => videoInputRef.current?.click()}
                                                    className="aspect-square flex items-center justify-center w-full border-2 border-dashed rounded-lg border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                                >
                                                    <div className="text-center">
                                                        <div className="w-8 h-8 mx-auto mb-2 text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                            </svg>
                                                        </div>
                                                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                            Click to upload or drag and drop
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Support formats: Video Mp4 (Max 2 videos)
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Picture */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                        Profile Picture
                                    </label>
                                    <input
                                        type="file"
                                        ref={profilePictureRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleProfilePictureSelect(e.target.files)}
                                    />
                                    <div className="space-y-4">
                                        {profilePicturePreview ? (
                                            <div className="relative w-32 h-32 group">
                                                <div className="absolute inset-0 rounded-full overflow-hidden">
                                                    <Image
                                                        src={profilePicturePreview.url}
                                                        alt="Profile Preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => {
                                                            if (profilePicturePreview.url) {
                                                                URL.revokeObjectURL(profilePicturePreview.url);
                                                            }
                                                            setProfilePicturePreview(null);
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => profilePictureRef.current?.click()}
                                                className="w-32 h-32 flex items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                            >
                                                <div className="text-center">
                                                    <div className="w-8 h-8 mx-auto mb-2 text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Upload Profile Picture
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>



                                <div className="flex items-center justify-end gap-3">
                                    <Button size="sm" variant="outline" onClick={() => { closeAddModal(), resetForm() }}>
                                        Cancel
                                    </Button>
                                    <Button size="sm">
                                        Add Influencer
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isConfirmOpen}
                onClose={closeConfirmModal}
                className="max-w-[600px] max-h-[80vh] !p-0 overflow-y-auto"
            >
                <div className="h-full flex flex-col">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
                            Confirm Influencer Details
                        </h4>
                    </div>

                    {currentInfluencer && (
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div>
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Basic Information</h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Name</p>
                                            <p className="font-medium">{currentInfluencer.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Email</p>
                                            <p className="font-medium">{currentInfluencer.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Mobile</p>
                                            <p className="font-medium">{currentInfluencer.mobile}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-400">Gender</p>
                                            <p className="font-medium capitalize">{currentInfluencer.gender}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div>
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Categories</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {currentInfluencer.categories.map(catId => (
                                            <span
                                                key={catId}
                                                className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200"
                                            >
                                                {categories.find(c => c.id === catId)?.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Bio */}
                                {currentInfluencer.bio && (
                                    <div>
                                        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Bio</h5>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{currentInfluencer.bio}</p>
                                    </div>
                                )}

                                {/* Platforms */}
                                <div>
                                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Platforms</h5>
                                    <div className="space-y-2">
                                        {currentInfluencer.platforms.map((platform, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm">
                                                <span className="font-medium min-w-[80px]">{platform.name}:</span>
                                                <a
                                                    href={platform.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline dark:text-blue-400 truncate"
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
                                                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Photos</h5>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {filePreview.photos.map((photo) => (
                                                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                            <Image
                                                                src={photo.url}
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
                                                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Videos</h5>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {filePreview.videos.map((video) => (
                                                        <div key={video.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
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

                    <div className="p-5 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-end gap-3">
                            <Button size="sm" variant="outline" onClick={closeConfirmModal}>
                                Cancel
                            </Button>
                            <Button size="sm" variant="primary" onClick={handleConfirm}>
                                Confirm & Proceed
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Send Credentials Modal */}
            <Modal
                isOpen={isEmailModalOpen}
                onClose={closeEmailModal}
                className="max-w-[500px] p-5"
            >
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
                        Send Login Credentials
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                        Would you like to send the login credentials now?
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-6">
                        <Button size="sm" variant="outline" onClick={() => handleSendCredentials(false)}>
                            Not Now
                        </Button>
                        <Button size="sm" onClick={() => handleSendCredentials(true)}>
                            Send Now
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
}
