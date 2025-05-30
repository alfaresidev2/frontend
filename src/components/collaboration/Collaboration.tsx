"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import api from "@/utils/axios";
import Image from "next/image";
import Select, { MultiValue } from "react-select";

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
  users: string[];
  usersData: Influencer[];
  createdBy: string;
  imageUrl: string;
  title: string;
  description: string;
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
  const [formData, setFormData] = useState({
    users: [] as string[],
    imageUrl: "",
    title: "",
    description: "",
  });
  const [editingCollaboration, setEditingCollaboration] = useState<Collaboration | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [flag,setFlag] = useState(false);

  useEffect(() => {
    fetchCollaborations();
    fetchInfluencers();
  }, [flag]);

  const fetchCollaborations = async () => {
    try {
      const response = await api.get('/collaboration');
      setCollaborations(response.data?.data?.docs || []);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
      alert('Failed to load collaborations');
    }
  };

  const fetchInfluencers = async () => {
    try {
      const response = await api.get('/user/list-influencers');
      setInfluencers(response.data?.data?.docs || []);
    } catch (error) {
      console.error('Error fetching influencers:', error);
      alert('Failed to load influencers');
    }
  };

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

    // Create preview
    const newFile: FilePreview = {
      id: Date.now().toString(),
      url: URL.createObjectURL(file),
      file,
      type: "image",
      signature: generateFileSignature(file),
    };

    // Add to preview
    setFilePreview(newFile);

    // Set loading state
    setUploadLoading(true);

    try {
      // Upload file
      const uploadedUrl = await uploadMedia(file);

      // Update form data with the uploaded S3 URL
      setFormData(prev => ({
        ...prev,
        imageUrl: uploadedUrl
      }));

      // Update the preview URL to use the S3 URL
      setFilePreview(prev => prev ? { ...prev, url: uploadedUrl } : null);
    } catch (error) {
      console.error("Error uploading file:", error);
      // Remove the preview if upload fails
      setFilePreview(null);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.users.length !== 2) {
      alert('Please select exactly two influencers and provide a title');
      return;
    }

    setIsLoading(true);
    try {
      if (editingCollaboration) {
        // Update existing collaboration
        await api.put(`/collaboration/${editingCollaboration._id}`, formData);
      
        setFlag(!flag);
        setEditingCollaboration(null);
      } else {
        // Add new collaboration
        await api.post('/collaboration', formData);
        // setCollaborations([...collaborations, response.data.data]);
        setFlag(!flag);
      }

      setFormData({ users: [], imageUrl: "", title: "", description: "" });
      setFilePreview(null);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInfluencerChange = (selectedOptions: MultiValue<{ value: string; label: React.ReactNode }>) => {
    if (selectedOptions.length > 2) {
      alert('You can only select two influencers');
      return;
    }
    setFormData(prev => ({
      ...prev,
      users: selectedOptions.map((option) => option.value)
    }));
  };

  const handleEdit = (collaboration: Collaboration) => {
    setEditingCollaboration(collaboration);
    setFormData({
      users: collaboration.users,
      imageUrl: collaboration.imageUrl || "",
      title: collaboration.title,
      description: collaboration.description,
    });
    if (collaboration.imageUrl) {
      setFilePreview({
        id: "existing-image",
        url: collaboration.imageUrl.startsWith('http') ? collaboration.imageUrl : `${S3_BASE_URL}/${collaboration.imageUrl}`,
        file: new File([], collaboration.imageUrl.split("/").pop() || ""),
        type: "image",
        signature: collaboration.imageUrl,
      });
    }
    openModal();
  };

  const handleDelete = async (collaborationId: string) => {
    if (!window.confirm("Are you sure you want to delete this collaboration?")) return;

    setIsLoading(true);
    try {
      await api.delete(`/collaboration/${collaborationId}`);
      setCollaborations(collaborations.filter(collab => collab._id !== collaborationId));
    } catch (error) {
      console.error('Error deleting collaboration:', error);
      alert('Failed to delete collaboration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!formData.title.trim() || formData.users.length !== 2) {
      alert('Please select exactly two influencers and provide a title');
      return;
    }
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleModalClose = () => {
    setEditingCollaboration(null);
    setFormData({ users: [], imageUrl: "", title: "", description: "" });
    setFilePreview(null);
    closeModal();
  };

  const influencerOptions = influencers.map(influencer => ({
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
  }));

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
                  <th scope="col" className="px-6 py-4">Influencers</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collaborations?.map((collab) => (
                  <tr key={collab?._id} className="border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70">
                    <td className="px-6 py-4">
                      {collab?.imageUrl && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                          {imageLoading[collab._id] !== false && (
                            <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                          )}
                          <Image
                            src={collab.imageUrl}
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
                      {collab?.title}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {collab?.description || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {collab.usersData.map(user => (
                          <div key={user._id} className="flex items-center gap-2">
                            {user.profileImage && (
                              <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                <Image
                                  src={user.profileImage}
                                  alt={user.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="text-sm">{user.name}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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

      {/* Add/Edit Collaboration Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        className="max-w-[584px] !p-0"
      >
        <div className="h-full bg-white dark:bg-slate-900/95 backdrop-blur-sm p-6 lg:p-8 rounded-[20px] border border-gray-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h4 className="mb-6 text-lg font-medium text-gray-900 dark:text-gray-200">
              {editingCollaboration ? "Edit Collaboration" : "Add New Collaboration"}
            </h4>

            {/* Influencer Selection */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                Select Influencers (Select 2)
              </label>
              <Select
                isMulti
                options={influencerOptions}
                value={influencerOptions.filter(option => formData.users.includes(option.value))}
                onChange={handleInfluencerChange}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Select two influencers..."
                isDisabled={isLoading}
                maxMenuHeight={200}
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
                disabled={uploadLoading}
              />
              <div className="space-y-4">
                {filePreview ? (
                  <div className="relative w-32 h-32 group">
                    <div className="absolute inset-0 rounded-lg overflow-hidden bg-gray-50">
                      {imageLoading['modal-preview'] !== false && (
                        <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                      )}
                      <Image
                        src={filePreview.url || "/placeholder.svg"}
                        alt="Collaboration Preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 128px) 100vw, 128px"
                        onLoadingComplete={() => setImageLoading((prev) => ({ ...prev, ['modal-preview']: false }))}
                        onLoad={() => setImageLoading((prev) => ({ ...prev, ['modal-preview']: false }))}
                        style={imageLoading['modal-preview'] !== false ? { visibility: 'hidden' } : {}}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          if (filePreview.url) {
                            URL.revokeObjectURL(filePreview.url);
                          }
                          setFilePreview(null);
                          setFormData(prev => ({ ...prev, imageUrl: "" }));
                          if (imageInputRef.current) {
                            imageInputRef.current.value = "";
                          }
                        }}
                        disabled={uploadLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploadLoading && imageInputRef.current?.click()}
                    className={`w-32 h-32 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 cursor-pointer hover:border-gray-300 transition-all hover:scale-105 active:scale-95 ${uploadLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {uploadLoading ? (
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

            <div>
              <label htmlFor="title" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter collaboration title"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter collaboration description"
                disabled={isLoading}
              />
            </div>

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
    </div>
  );
} 