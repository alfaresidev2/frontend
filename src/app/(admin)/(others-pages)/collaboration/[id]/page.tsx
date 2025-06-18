"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/utils/axios";
import Button from "@/components/ui/button/Button";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { ChevronLeftIcon, PencilIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Influencer {
    _id: string;
    name: string;
    profileImage?: string;
}

interface Collaboration {
    _id: string;
    // users: string[];
    users: Influencer[];
    imageUrl: string;
    title: string;
    description: string;
    price: number;
    duration: number;
    requireTimeSlot: boolean;
    type: string;
    collaborationDetails: {
        title: string;
        images: string[];
        description: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface FilePreview {
    id: string;
    url: string;
    file: File;
    type: "image";
    signature: string;
}

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

export default function CollaborationDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [isCropping, setIsCropping] = useState(false);
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropState, setCropState] = useState<CropState>({
        aspect: 3 / 2,
    });
    const imgRef = useRef<HTMLImageElement>(null);

    const [formData, setFormData] = useState({
        collaborationDetails: {
            title: "",
            images: [] as string[],
            description: ""
        }
    });

    useEffect(() => {
        const fetchCollaboration = async () => {
            try {
                const response = await api.get(`/influencer-service/${params.id}`);
                setCollaboration(response.data.data);
            } catch (error) {
                console.error("Error fetching collaboration:", error);
                alert("Failed to fetch collaboration details");
            } finally {
                setIsLoading(false);
            }
        };

        if (params.id) {
            fetchCollaboration();
        }
    }, [params.id]);

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
                crop: undefined,
                aspect: 3 / 2,
            });
            setShowCropModal(true);
        });
        reader.readAsDataURL(file);

        // Set initial preview with blob URL and file object
        setFilePreview({
            id: Date.now().toString(),
            url: URL.createObjectURL(file),
            file,
            type: "image",
            signature: generateFileSignature(file),
        });
    };

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const aspect = 3 / 2;
        let newCropWidth, newCropHeight;

        if (width / height > aspect) {
            newCropHeight = height;
            newCropWidth = height * aspect;
        } else {
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

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const croppedFile = new File([blob], filePreview.file.name, { type: blob.type || filePreview.file.type });

                try {
                    setUploadLoading(true);
                    const uploadedUrl = await uploadMedia(croppedFile);

                    setFilePreview(prev => prev ? { ...prev, url: uploadedUrl, file: croppedFile, signature: generateFileSignature(croppedFile) } : null);

                } catch (error) {
                    console.error("Error uploading cropped image:", error);
                    alert("Failed to upload cropped image. Please try again.");
                    if (filePreview?.url && filePreview.url.startsWith('blob:')) {
                        URL.revokeObjectURL(filePreview.url);
                    }
                    setFilePreview(null);

                } finally {
                    setUploadLoading(false);
                    setShowCropModal(false);
                    setIsCropping(false);
                }
            }, filePreview.file.type || 'image/jpeg', 0.95);

        } catch (error) {
            console.error("Error processing crop:", error);
            alert("Failed to process image crop. Please try again.");
            setIsCropping(false);
            setUploadLoading(false);
            if (filePreview?.url && filePreview.url.startsWith('blob:')) {
                URL.revokeObjectURL(filePreview.url);
            }
            setFilePreview(null);
        }
    };

    const removeFile = () => {
        if (filePreview?.url && filePreview.url.startsWith('blob:')) {
            URL.revokeObjectURL(filePreview.url);
        }
        setFilePreview(null);
        if (imageInputRef.current) {
            imageInputRef.current.value = "";
        }
    };

    const handleEdit = () => {
        if (!collaboration) return;
        
        setFormData({
            collaborationDetails: {
                title: collaboration.collaborationDetails?.title || "",
                images: collaboration.collaborationDetails?.images || [],
                description: collaboration.collaborationDetails?.description || ""
            }
        });

        if (collaboration.imageUrl) {
            setFilePreview({
                id: "existing-image",
                url: collaboration.imageUrl.startsWith('http') ? collaboration.imageUrl : `${S3_BASE_URL}/${collaboration.imageUrl}`,
                file: new File([], collaboration.imageUrl.split("/").pop() || ""),
                type: "image",
                signature: collaboration.imageUrl,
            });
        } else {
            setFilePreview(null);
        }

        setIsEditModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collaboration) return;

        setEditLoading(true);
        try {
            const updateData = {
                collaborationDetails: formData.collaborationDetails,
                imageUrl: filePreview?.url || collaboration.imageUrl
            };

            await api.put(`/influencer-service/${collaboration._id}`, updateData);
            
            // Refresh the collaboration data
            const response = await api.get(`/influencer-service/${params.id}`);
            setCollaboration(response.data.data);
            
            setIsEditModalOpen(false);
            alert('Collaboration updated successfully!');
        } catch (error) {
            console.error('Error updating collaboration:', error);
            alert('Failed to update collaboration');
        } finally {
            setEditLoading(false);
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
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!collaboration) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)]">
                <p className="text-gray-600 dark:text-gray-400 mb-4">Collaboration not found</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <>
            <style>{shimmerKeyframes}</style>
            <PageBreadcrumb pageTitle="Collaboration Details" />
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-1">
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back to List
                    </Button>
                    <Button onClick={handleEdit} startIcon={<PencilIcon />}>
                        Edit Collaboration
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-2">
                <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-md border-2 border-[#455eff]/20 dark:border-blue-900/40 p-0 md:p-0 flex flex-col md:flex-row overflow-hidden">

                    <div className="md:w-2/3 flex flex-col gap-6 p-6 bg-white dark:bg-slate-900 max-h-[80vh] overflow-y-auto">

                        {/* Service Information Card */}
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Service Information</h5>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Service Title</label>
                                    <p className="text-sm text-gray-900 dark:text-gray-200">{collaboration.title}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Service Description</label>
                                    <p className="text-sm text-gray-900 dark:text-gray-200">{collaboration.description}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Price</label>
                                        <p className="text-sm text-green-600 dark:text-green-400">${collaboration.price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Duration</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-200">{collaboration.duration} min</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Collaboration Details */}
                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Collaboration Details</h3>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{collaboration.collaborationDetails?.title || collaboration.title}</h1>
                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{collaboration.collaborationDetails?.description || collaboration.description}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Influencers</h3>
                            <div className="flex flex-wrap gap-4">
                                {collaboration.users.map((influencer) => (
                                    <div key={influencer._id} className="flex items-center gap-3 bg-gray-100 dark:bg-slate-700 rounded-full p-2 pr-4 shadow-sm">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-slate-900">
                                            <Image
                                                src={influencer.profileImage || "/placeholder.svg"}
                                                alt={influencer.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{influencer.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800 rounded-2xl shadow border border-blue-100 dark:border-blue-900/40 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Metadata</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Created At:</span> {new Date(collaboration.createdAt).toLocaleString()}
                                </div>
                                <div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">Updated At:</span> {new Date(collaboration.updatedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-1/3 flex-shrink-0 bg-gradient-to-b from-[#455eff]/10 to-white dark:from-slate-900 dark:to-slate-800 p-8 flex flex-col items-center justify-start border-l border-blue-100 dark:border-slate-800">
                        {collaboration.imageUrl && (
                            <div className="relative w-[300px] h-[200px] rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-slate-700">
                                <Image
                                    src={collaboration.imageUrl}
                                    alt={collaboration.collaborationDetails?.title || collaboration.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Collaboration Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                className="max-w-[600px] !p-0"
            >
                <div className="h-full max-h-[95vh] overflow-auto bg-white dark:bg-slate-900/95 backdrop-blur-sm p-6 lg:p-8 rounded-[20px] border border-gray-200 dark:border-slate-800">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <h4 className="mb-6 text-lg font-medium text-gray-900 dark:text-gray-200">
                            Edit Collaboration Details
                        </h4>

                        {/* Service Information Card (Read Only) */}
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">Service Information (Read Only)</h5>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Service Title</label>
                                    <p className="text-sm text-gray-900 dark:text-gray-200">{collaboration.title}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Service Description</label>
                                    <p className="text-sm text-gray-900 dark:text-gray-200">{collaboration.description}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Price</label>
                                        <p className="text-sm text-green-600 dark:text-green-400">${collaboration.price}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Duration</label>
                                        <p className="text-sm text-gray-900 dark:text-gray-200">{collaboration.duration} min</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editable Collaboration Details */}
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
                                disabled={editLoading}
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
                                disabled={editLoading}
                            />
                        </div>

                        {/* Image Upload */}
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

                        <div className="flex items-center justify-end w-full gap-3 mt-6">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                disabled={editLoading || uploadLoading}
                                className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                type="submit"
                                disabled={editLoading || uploadLoading}
                                className="transform transition-transform hover:scale-105 active:scale-95 rounded-xl px-4 py-2"
                            >
                                {editLoading ? 'Updating...' : 'Update Collaboration'}
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
                    if (filePreview?.url && filePreview.url.startsWith('blob:')) {
                        URL.revokeObjectURL(filePreview.url);
                        setFilePreview(null);
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
                                if (filePreview?.url && filePreview.url.startsWith('blob:')) {
                                    URL.revokeObjectURL(filePreview.url);
                                    setFilePreview(null);
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
        </>
    );
} 