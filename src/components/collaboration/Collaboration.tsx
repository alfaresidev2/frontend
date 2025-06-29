"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import api from "@/utils/axios";
import Image from "next/image";
import Select, { MultiValue } from "react-select";
import { useRouter } from "next/navigation";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Service {
    _id: string;
    title: string;
    description: string;
    price: number;
    imageUrl: string;
    requireTimeSlot: boolean;
    duration: number;
    type: string;
}

interface Influencer {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    role: string;
    phoneNumber: string;
    disabled: boolean;
    accountType: string;
    socialMedia: Array<{
        platform: string;
        followers: number;
        url: string;
        _id: string;
    }>;
    category: string[];
    tags: string[];
    bio: string;
    images: string[];
    videos: string[];
    gender: string;
    services: Service[];
    meta: {
        isVerified: boolean;
        verificationCode?: string;
        welcomeMailWithPasswordSent: boolean;
        welcomeMailWithPasswordSentAt: string;
        _id: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Collaboration {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    requireTimeSlot: boolean;
    price: number;
    duration: number;
    type: string;
    // users: string[];
    users: Influencer[];
    createdBy: string;
    collaborationDetails: {
        title: string;
        images: string[];
        description: string;
    };
    createdAt: string;
    updatedAt: string;
    __v: number;
}

interface FilePreview {
    id: string;
    url: string;
    file: File;
    type: "image";
    signature: string;
}

// Add interface for cropping state
interface CropState {
    src?: string;
    crop?: Crop;
    completedCrop?: PixelCrop;
    aspect?: number;
}

// Add S3 base URL constant
const S3_BASE_URL = "https://influencer-mega-bucket.s3.ap-south-1.amazonaws.com";

// Add shimmer CSS
const shimmerStyle = {
    background: 'linear-gradient(90deg, #f3f3f3 25%, #e0e0e0 37%, #f3f3f3 63%)',
    backgroundSize: '400% 100%',
    animation: 'shimmer 1.4s ease infinite',
};

const shimmerKeyframes = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}`;

export default function CollaborationPage() {
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [allInfluencers, setAllInfluencers] = useState<Influencer[]>([]);
    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        imageUrl: "",
        requireTimeSlot: true,
        price: 0,
        duration: 30,
        type: "collaboration",
        users: [] as string[],
        collaborationDetails: {
            title: "",
            images: [] as string[],
            description: ""
        }
    });
    const [editingCollaboration, setEditingCollaboration] = useState<Collaboration | null>(null);
    const { isOpen, openModal, closeModal } = useModal();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
    const [flag, setFlag] = useState(false);
    const router = useRouter();

    // Add state for pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [total, setTotal] = useState(0);

    // Add state for image cropping
    const [cropState, setCropState] = useState<CropState>({
        aspect: 3 / 2, // Set initial aspect ratio to 3:2
    });
    const imgRef = useRef<HTMLImageElement>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [isCropping, setIsCropping] = useState(false);

    useEffect(() => {
        fetchCollaborations();
        fetchInfluencers();
        fetchAllInfluencers().then(setAllInfluencers);
    }, [flag, page, limit]);

    const fetchCollaborations = async () => {
        try {
            const response = await api.get('/influencer-service/collaborations', {
                params: { page, limit }
            });
            setCollaborations(response.data?.data?.docs || []);
            setTotal(response.data?.data?.totalDocs || response.data?.data?.total || 0);
        } catch (error) {
            console.error('Error fetching collaborations:', error);
            alert('Failed to load collaborations');
        }
    };

    const fetchInfluencers = async () => {
        try {
            const response = await api.get('/user/influencer-search', {
                params: { hasService: true, hideDisabledUsers: true, serviceType: "individual" }
            });
            setInfluencers(response.data?.data?.docs || []);
        } catch (error) {
            console.error('Error fetching influencers:', error);
            alert('Failed to load influencers');
        }
    };

    const fetchAllInfluencers = async () => {
        try {
            const response = await api.get('/user/influencer-search', {
                params: { limit: 100, hideDisabledUsers: true }
            });
            console.log(response)
            return response.data?.data?.docs || [];
        } catch (error) {
            console.error('Error fetching all influencers:', error);
            return [];
        }
    };

    // Add state syncing with URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const pageParam = parseInt(params.get("page") || "1", 10);
        const limitParam = parseInt(params.get("limit") || "5", 10);

        if (pageParam !== page) setPage(pageParam);
        if (limitParam !== limit) setLimit(limitParam);
    }, []); // Run only on mount to read initial params

    useEffect(() => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        window.history.replaceState(null, "", `?${params.toString()}`);
    }, [page, limit]); // Update URL when page or limit changes

    const generateFileSignature = (file: File): string => {
        return `${file.name}-${file.size}-${file.lastModified}`;
    };

    const uploadMedia = async (file: File): Promise<string> => {
        try {
            // Get upload URL from server
            const response = await api.get("/upload-url", {
                params: {
                    fileName: file.name,
                    fileType: "image",
                },
            });

            const { url, key } = response.data.data;

            // Upload file to the URL
            await fetch(url, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            // Return the complete S3 URL
            return `${S3_BASE_URL}/${key}`;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error("Failed to upload file");
        }
    };

    // Handle influencer selection
    const handleInfluencerSelection = (selected: Influencer | null) => {
        setSelectedInfluencer(selected);
        setSelectedService(null);
        setFormData(prev => ({
            ...prev,
            title: "",
            description: "",
            imageUrl: "",
            requireTimeSlot: true,
            price: 0,
            duration: 30,
            users: [],
            collaborationDetails: {
                title: "",
                images: [],
                description: ""
            }
        }));
    };

    // Handle service selection
    const handleServiceChange = (service: Service) => {
        setSelectedService(service);
        setFormData(prev => ({
            ...prev,
            title: service.title,
            description: service.description,
            imageUrl: service.imageUrl,
            requireTimeSlot: service.requireTimeSlot,
            price: service.price,
            duration: service.duration,
            type: service.type,
            users: selectedInfluencer ? [selectedInfluencer._id] : [],
            collaborationDetails: {
                title: "",
                images: [],
                description: ""
            }
        }));
    };

    // Updated handleFileSelect to use the cropper
    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // If there's an existing preview from editing, clear its URL object
        if (filePreview?.url && filePreview.url.startsWith('blob:')) {
            URL.revokeObjectURL(filePreview.url);
        }

        // Create a temporary URL for the cropper
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setCropState({
                src: reader.result?.toString() || "",
                crop: undefined, // Clear previous crop
                aspect: 3 / 2, // Ensure 3:2 aspect ratio
            });
            setShowCropModal(true);
        });
        reader.readAsDataURL(file);

        // Set initial preview with blob URL and file object (needed for signature/upload later)
        setFilePreview({
            id: Date.now().toString(),
            url: URL.createObjectURL(file), // This will be replaced by S3 URL after crop & upload
            file, // Store the original file temporarily
            type: "image",
            signature: generateFileSignature(file),
        });

    };

    // Image load handler for cropper
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        // Calculate a default crop based on the 3:2 aspect ratio
        const aspect = 3 / 2;
        let newCropWidth, newCropHeight;

        if (width / height > aspect) {
            // Image is wider than the aspect ratio, crop width
            newCropHeight = height;
            newCropWidth = height * aspect;
        } else {
            // Image is taller or matches aspect ratio, crop height
            newCropWidth = width;
            newCropHeight = width / aspect;
        }

        const x = (width - newCropWidth) / 2;
        const y = (height - newCropHeight) / 2;

        setCropState(prev => ({
            ...prev,
            crop: {
                unit: 'px',
                x,
                y,
                width: newCropWidth,
                height: newCropHeight,
            },
        }));
    };

    const handleCropComplete = (crop: PixelCrop) => {
        setCropState(prev => ({
            ...prev,
            completedCrop: crop,
        }));
    };

    const handleCropChange = (crop: Crop) => {
        setCropState(prev => ({ ...prev, crop }));
    };

    const handleCropApply = async () => {
        if (!imgRef.current || !cropState.completedCrop || !filePreview) return;

        setIsCropping(true);

        try {
            const image = imgRef.current;
            const crop = cropState.completedCrop;

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            const pixelRatio = window.devicePixelRatio;

            const canvas = document.createElement('canvas');
            canvas.width = crop.width * pixelRatio;
            canvas.height = crop.height * pixelRatio;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            );

            // Convert canvas to blob and upload
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                // Create a File object from the blob
                const croppedFile = new File([blob], filePreview.file.name, { type: blob.type || filePreview.file.type });

                try {
                    setUploadLoading(true); // Use component-level upload loading
                    const uploadedUrl = await uploadMedia(croppedFile);

                    // Update form data and file preview with the S3 URL
                    setFormData(prev => ({
                        ...prev, collaborationDetails: {
                            ...prev.collaborationDetails,
                            images: [uploadedUrl as string]
                        }
                    }));
                    setFilePreview(prev => prev ? { ...prev, url: uploadedUrl, file: croppedFile, signature: generateFileSignature(croppedFile) } : null);

                } catch (error) {
                    console.error("Error uploading cropped image:", error);
                    alert("Failed to upload cropped image. Please try again.");
                    // Clear the preview if upload fails
                    if (filePreview?.url && filePreview.url.startsWith('blob:')) {
                        URL.revokeObjectURL(filePreview.url);
                    }
                    setFilePreview(null);
                    setFormData(prev => ({ ...prev, imageUrl: "" }));

                } finally {
                    setUploadLoading(false);
                    setShowCropModal(false);
                    setIsCropping(false);
                }
            }, filePreview.file.type || 'image/jpeg', 0.95); // Use original file type for blob or default to jpeg

        } catch (error) {
            console.error("Error processing crop:", error);
            alert("Failed to process image crop. Please try again.");
            setIsCropping(false);
            setUploadLoading(false);
            // Clear the preview on crop processing failure as well
            if (filePreview?.url && filePreview.url.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview.url);
            }
            setFilePreview(null);
            setFormData(prev => ({ ...prev, imageUrl: "" }));
        }
    };

    // Update removeFile to handle blob URLs
    const removeFile = () => {
        if (filePreview?.url && filePreview.url.startsWith('blob:')) {
            URL.revokeObjectURL(filePreview.url);
        }
        setFilePreview(null);
        setFormData(prev => ({ ...prev, imageUrl: "" }));
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsLoading(true);
        try {
            if (editingCollaboration) {
                const collaboration = {
                    collaborationDetails: {
                        title: formData.collaborationDetails.title,
                        description: formData.collaborationDetails.description,
                        images: formData.collaborationDetails.images
                    }
                };
                // Update existing collaboration
                await api.put(`/influencer-service/${editingCollaboration._id}`, collaboration);
                setFlag(!flag);
                setEditingCollaboration(null);
            } else {
                if (!formData.title.trim() || !selectedService || formData.users.length < 2) {
                    alert('Please select a service and at least two influencers for collaboration');
                    return;
                }
                // Add new collaboration
                await api.post('/influencer-service/collaboration', formData);
                setFlag(!flag);
            }

            setFormData({
                title: "",
                description: "",
                imageUrl: "",
                requireTimeSlot: true,
                price: 0,
                duration: 30,
                type: "collaboration",
                users: [],
                collaborationDetails: {
                    title: "",
                    images: [],
                    description: ""
                }
            });
            setFilePreview(null);
            setSelectedInfluencer(null);
            setSelectedService(null);
            closeModal();
        } catch (error) {
            console.error('Error saving collaboration:', error);
            alert('Failed to save collaboration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('collaborationDetails.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                collaborationDetails: {
                    ...prev.collaborationDetails,
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleInfluencerChange = (selectedOptions: MultiValue<{ value: string; label: React.ReactNode }>) => {
        const additionalUserIds = selectedOptions.map((option) => option.value);
        const allUserIds = selectedInfluencer ? [selectedInfluencer._id, ...additionalUserIds] : additionalUserIds;
        setFormData(prev => ({
            ...prev,
            users: allUserIds
        }));
    };

    const handleEdit = async (collaboration: Collaboration) => {
        console.log(collaboration)
        setEditingCollaboration(collaboration);
        setEditLoading(true);

        try {
            // Set form data with only collaboration details (editable part)
            setFormData({
                title: collaboration.title,
                description: collaboration.description,
                imageUrl: collaboration.imageUrl || "",
                requireTimeSlot: collaboration.requireTimeSlot,
                price: collaboration.price,
                duration: collaboration.duration,
                type: collaboration.type,
                users: collaboration.users.map(user => user._id),
                collaborationDetails: {
                    title: collaboration.collaborationDetails?.title || "",
                    images: collaboration.collaborationDetails?.images || [],
                    description: collaboration.collaborationDetails?.description || ""
                }
            });

            // Set image preview for existing images
            if (collaboration.imageUrl) {
                // For existing images, create a preview without triggering the cropper
                setFilePreview({
                    id: "existing-image",
                    url: collaboration?.collaborationDetails?.images?.[0]?.startsWith('http') ? collaboration?.collaborationDetails.images[0] : `${S3_BASE_URL}/${collaboration.collaborationDetails?.images?.[0]}`,
                    file: new File([], collaboration.imageUrl.split("/").pop() || ""), // Dummy file for consistency
                    type: "image",
                    signature: collaboration.collaborationDetails?.images?.[0],
                });
            } else {
                setFilePreview(null);
            }

            openModal();
        } catch (error) {
            console.error('Error loading collaboration data for editing:', error);
            alert('Failed to load collaboration data for editing');
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (collaborationId: string) => {
        if (!window.confirm("Are you sure you want to delete this collaboration?")) return;

        setIsLoading(true);
        try {
            await api.delete(`/influencer-service/${collaborationId}`);
            setCollaborations(collaborations.filter(collab => collab._id !== collaborationId));
        } catch (error) {
            console.error('Error deleting collaboration:', error);
            alert('Failed to delete collaboration');
        } finally {
            setIsLoading(false);
        }
    };

    const handleButtonClick = () => {
        // Only proceed with submit if validation passes
        handleSubmit({ preventDefault: () => { } } as React.FormEvent);
    };

    const handleModalClose = () => {
        setEditingCollaboration(null);
        setFormData({
            title: "",
            description: "",
            imageUrl: "",
            requireTimeSlot: true,
            price: 0,
            duration: 30,
            type: "collaboration",
            users: [],
            collaborationDetails: {
                title: "",
                images: [],
                description: ""
            }
        });
        setFilePreview(null);
        setSelectedInfluencer(null);
        setSelectedService(null);
        closeModal();
    };



    // Add navigation function
    const handleRowClick = (collaborationId: string) => {
        router.push(`/collaboration/${collaborationId}`);
    };

    return (
        <div className="space-y-6">
            <style>{shimmerKeyframes}</style>
            <div className="flex items-center justify-end">
                <Button
                    size="sm"
                    onClick={openModal}
                    startIcon={<PlusIcon />}
                    disabled={isLoading}
                >
                    Add Collaboration
                </Button>
            </div>

            {/* Add items per page control */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Collaborations per page:</span>
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

            {/* Collaborations Table */}
            <div className="p-6 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800 shadow-sm">
                {collaborations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="mb-4 text-gray-600 dark:text-gray-400">No collaborations added yet</p>
                        <Button
                            size="sm"
                            onClick={openModal}
                            startIcon={<PlusIcon />}
                            disabled={isLoading}
                            className="transform transition-transform hover:scale-105 active:scale-95"
                        >
                            Add Your First Collaboration
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                            <thead className="text-xs uppercase bg-gray-50 dark:bg-slate-800/90 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Image</th>
                                    <th scope="col" className="px-6 py-4">Title</th>
                                    <th scope="col" className="px-6 py-4">Description</th>
                                    <th scope="col" className="px-6 py-4">Price</th>
                                    <th scope="col" className="px-6 py-4">Duration</th>
                                    <th scope="col" className="px-6 py-4">Influencers</th>
                                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collaborations?.map((collab) => (
                                    <tr
                                        key={collab?._id}
                                        className="border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70 cursor-pointer"
                                        onClick={() => handleRowClick(collab._id)}
                                    >
                                        <td className="px-6 py-4">
                                            {collab?.imageUrl && (
                                                <div className="relative w-16 h-10 rounded-lg overflow-hidden">
                                                    {imageLoading[collab._id] !== false && (
                                                        <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                                                    )}
                                                    <Image
                                                        src={collab?.collaborationDetails?.images?.[0] || collab?.imageUrl}
                                                        alt={collab.title}
                                                        fill
                                                        className="object-cover"
                                                        onLoadingComplete={() => setImageLoading((prev) => ({ ...prev, [collab._id]: false }))}
                                                        onLoad={() => setImageLoading((prev) => ({ ...prev, [collab._id]: false }))}
                                                        style={imageLoading[collab._id] !== false ? { visibility: 'hidden' } : {}}
                                                    />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                            {collab?.collaborationDetails?.title.length < 30 ? collab?.collaborationDetails?.title.slice(0, 30) : collab?.collaborationDetails?.title.slice(0, 30) + "..." || "-"}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {collab?.collaborationDetails?.description.length < 60 ? collab?.collaborationDetails?.description.slice(0, 60) : collab?.collaborationDetails?.description.slice(0, 50) + "..." || "-" }
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            ${collab?.price || 0}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                            {collab?.duration || 0} min
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center -space-x-2">
                                                {collab.users.map(user => (
                                                    user.profileImage && (
                                                        <div key={user._id} className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-slate-900">
                                                            <Image
                                                                src={user.profileImage}
                                                                alt={user.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}> {/* Prevent row click */}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEdit(collab)}
                                                    startIcon={<PencilIcon />}
                                                    disabled={isLoading}
                                                    className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200"
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(collab._id)}
                                                    startIcon={<TrashBinIcon />}
                                                    disabled={isLoading}
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

            {/* Add Pagination Controls */}
            {collaborations.length > 0 && total > limit && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} of {total}
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

            {/* Add/Edit Collaboration Modal */}
            <Modal
                isOpen={isOpen}
                onClose={handleModalClose}
                className="max-w-[800px] !p-0"
            >
                <div className="h-full max-h-[95vh] overflow-auto bg-white dark:bg-slate-900/95 backdrop-blur-sm p-6 lg:p-8 rounded-[20px] border border-gray-200 dark:border-slate-800">
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                        <h4 className="mb-6 text-lg font-medium text-gray-900 dark:text-gray-200">
                            {editingCollaboration ? "Edit Collaboration" : "Add New Collaboration"}
                        </h4>

                        {/* Show service information in read-only card when editing */}
                        {editingCollaboration && (
                            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">Service Information (Read Only)</h5>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Service Title</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-200">{formData.title}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Service Description</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-200">{formData.description}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Price</label>
                                            <p className="text-sm text-green-600 dark:text-green-400">${formData.price}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Duration</label>
                                            <p className="text-sm text-gray-900 dark:text-gray-200">{formData.duration} min</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 1: Select Influencer with Service - Only show when adding new */}
                        {!editingCollaboration && (
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                    Select Influencer with Service
                                </label>
                                <Select
                                    options={influencers.map(influencer => ({
                                        value: influencer._id,
                                        label: (
                                            <div className="flex items-center gap-2">
                                                {influencer.profileImage && (
                                                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                                        <Image
                                                            src={influencer.profileImage.startsWith('http') ? influencer.profileImage : `${S3_BASE_URL}/${influencer.profileImage}`}
                                                            alt={influencer.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <span>{influencer.name}</span>
                                            </div>
                                        ),
                                    }))}
                                    value={selectedInfluencer ? {
                                        value: selectedInfluencer._id,
                                        label: (
                                            <div className="flex items-center gap-2">
                                                {selectedInfluencer.profileImage && (
                                                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                                        <Image
                                                            src={selectedInfluencer.profileImage.startsWith('http') ? selectedInfluencer.profileImage : `${S3_BASE_URL}/${selectedInfluencer.profileImage}`}
                                                            alt={selectedInfluencer.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <span>{selectedInfluencer.name}</span>
                                            </div>
                                        ),
                                    } : null}
                                    onChange={(option) => handleInfluencerSelection(option ? influencers.find(inf => inf._id === option.value) || null : null)}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    placeholder="Select an influencer with services..."
                                    isDisabled={isLoading}
                                    maxMenuHeight={200}
                                />
                            </div>
                        )}

                        {/* Step 2: Select Service - Only show when adding new */}
                        {!editingCollaboration && selectedInfluencer && (
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                    Select Service
                                </label>
                                {editLoading ? (
                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                            <p className="text-gray-600 dark:text-gray-400">Loading services...</p>
                                        </div>
                                    </div>
                                ) : selectedInfluencer.services && selectedInfluencer.services.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedInfluencer.services.map((service) => (
                                            <div
                                                key={service._id}
                                                onClick={() => handleServiceChange(service)}
                                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedService?._id === service._id
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-blue-500"
                                                    }`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                                                        {imageLoading[`service-${service._id}`] !== false && (
                                                            <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                                                        )}
                                                        <Image
                                                            src={service.imageUrl || "/placeholder.svg"}
                                                            alt={service.title}
                                                            fill
                                                            className="object-cover"
                                                            onLoadingComplete={() => setImageLoading(prev => ({ ...prev, [`service-${service._id}`]: false }))}
                                                            onLoad={() => setImageLoading(prev => ({ ...prev, [`service-${service._id}`]: false }))}
                                                            style={imageLoading[`service-${service._id}`] !== false ? { visibility: 'hidden' } : {}}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-medium text-gray-900 dark:text-gray-200">{service.title}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{service.description}</p>
                                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                                            <span className="text-green-600 dark:text-green-400">${service.price}</span>
                                                            <span className="text-gray-500 dark:text-gray-400">{service.duration} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                                        <p className="text-gray-600 dark:text-gray-400">No services available for this influencer.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Select Additional Influencers for Collaboration - Only show when adding new */}
                        {!editingCollaboration && selectedInfluencer && (
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                    Select Additional Influencers for Collaboration (At least 1 more)
                                </label>
                                <Select
                                    isMulti
                                    options={allInfluencers
                                        .filter(influencer => influencer._id !== selectedInfluencer?._id)
                                        .map(influencer => ({
                                            value: influencer._id,
                                            label: (
                                                <div className="flex items-center gap-2">
                                                    {influencer.profileImage && (
                                                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                                            <Image
                                                                src={influencer.profileImage.startsWith('http') ? influencer.profileImage : `${S3_BASE_URL}/${influencer.profileImage}`}
                                                                alt={influencer.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <span>{influencer.name}</span>
                                                </div>
                                            ),
                                        }))}
                                    value={allInfluencers
                                        .filter(influencer => influencer._id !== selectedInfluencer?._id)
                                        .map(influencer => ({
                                            value: influencer._id,
                                            label: (
                                                <div className="flex items-center gap-2">
                                                    {influencer.profileImage && (
                                                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                                            <Image
                                                                src={influencer.profileImage.startsWith('http') ? influencer.profileImage : `${S3_BASE_URL}/${influencer.profileImage}`}
                                                                alt={influencer.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <span>{influencer.name}</span>
                                                </div>
                                            ),
                                        }))
                                        .filter(option => formData.users.includes(option.value) && option.value !== selectedInfluencer?._id)}
                                    onChange={handleInfluencerChange}
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    placeholder="Select additional influencers for collaboration..."
                                    isDisabled={isLoading}
                                    maxMenuHeight={200}
                                />
                            </div>
                        )}

                        {/* Collaboration Details - Show when adding new (with selectedService) or when editing */}
                        {(selectedService || editingCollaboration) && (
                            <>
                                <div>
                                    <label htmlFor="collaborationDetails.title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                        Collaboration Title
                                    </label>
                                    <input
                                        type="text"
                                        id="collaborationDetails.title"
                                        name="collaborationDetails.title"
                                        value={formData.collaborationDetails.title}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                                        placeholder="Enter collaboration title"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="collaborationDetails.description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                        Collaboration Description
                                    </label>
                                    <textarea
                                        id="collaborationDetails.description"
                                        name="collaborationDetails.description"
                                        value={formData.collaborationDetails.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2.5 text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                                        placeholder="Enter collaboration description"
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Image Upload with Cropper Integration */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                                        Collaboration Image
                                    </label>
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e.target.files)}
                                        disabled={uploadLoading || isCropping}
                                    />
                                    <div className="space-y-4">
                                        {filePreview ? (
                                            <div className="relative w-56 h-32 group">
                                                <div className="absolute inset-0 rounded-lg overflow-hidden bg-gray-50">
                                                    {imageLoading['modal-preview'] !== false && (
                                                        <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                                                    )}
                                                    <Image
                                                        src={filePreview.url}
                                                        alt="Collaboration Image Preview"
                                                        fill
                                                        className="object-cover"
                                                        sizes="(max-width: 128px) 100vw, 128px"
                                                        onLoadingComplete={() => setImageLoading((prev) => ({ ...prev, ['modal-preview']: false }))}
                                                        onLoad={() => setImageLoading((prev) => ({ ...prev, ['modal-preview']: false }))}
                                                        style={imageLoading['modal-preview'] !== false ? { visibility: 'hidden' } : {}}
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                    {(uploadLoading || isCropping) ? (
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                                    ) : (
                                                        <Button size="sm" variant="primary" onClick={removeFile}>
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => !(uploadLoading || isCropping) && imageInputRef.current?.click()}
                                                className={`w-44 h-32 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-300 transition-all hover:scale-105 active:scale-95 ${uploadLoading || isCropping ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                {(uploadLoading || isCropping) ? (
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
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 p-2">Upload Collaboration Image</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex items-center justify-end w-full gap-3 mt-6">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleModalClose}
                                disabled={isLoading || uploadLoading}
                                className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2"
                            >
                                Close
                            </Button>
                            <Button
                                size="sm"
                                type="button"
                                onClick={handleButtonClick}
                                disabled={isLoading || uploadLoading}
                                className="transform transition-transform hover:scale-105 active:scale-95 rounded-xl px-4 py-2"
                            >
                                {isLoading ? 'Saving...' : editingCollaboration ? 'Update Collaboration' : 'Add Collaboration'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Image Crop Modal */}
            <Modal
                isOpen={showCropModal}
                onClose={() => {
                    setShowCropModal(false);
                    setIsCropping(false);
                    if (filePreview?.url && filePreview.url.startsWith('blob:') && !editingCollaboration) {
                        URL.revokeObjectURL(filePreview.url);
                        setFilePreview(null);
                        setFormData(prev => ({ ...prev, imageUrl: "" }));
                        if (imageInputRef.current) {
                            imageInputRef.current.value = "";
                        }
                    }
                }}
                className="max-w-[800px] p-5"
            >
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">Crop Collaboration Image</h4>
                    <div className="relative max-h-[60vh] overflow-auto flex items-center justify-center">
                        {cropState.src && (
                            <div className="relative w-full max-w-[600px] mx-auto">
                                <ReactCrop
                                    crop={cropState.crop}
                                    onChange={handleCropChange}
                                    onComplete={handleCropComplete}
                                    aspect={cropState.aspect}
                                >
                                    <Image
                                        ref={imgRef}
                                        width={300}
                                        height={200}
                                        src={cropState.src}
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
                                setShowCropModal(false);
                                setIsCropping(false);
                                if (filePreview?.url && filePreview.url.startsWith('blob:') && !editingCollaboration) {
                                    URL.revokeObjectURL(filePreview.url);
                                    setFilePreview(null);
                                    setFormData(prev => ({ ...prev, imageUrl: "" }));
                                    if (imageInputRef.current) {
                                        imageInputRef.current.value = "";
                                    }
                                }
                            }}
                            disabled={isCropping}
                        >
                            Cancel
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleCropApply} disabled={isCropping || !cropState.completedCrop}>
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
        </div>
    );
} 