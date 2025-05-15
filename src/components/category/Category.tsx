"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import api from "@/utils/axios";
import Image from "next/image";

interface Category {
  _id: string;
  name: string;
  description: string;
  imageUrl?: string;
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

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data?.docs || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories');
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

      const { url, key } = response.data;

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
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      if (editingCategory) {
        // Update existing category
        await api.put(`/categories/${editingCategory._id}`, formData);
        setCategories(categories.map(cat => 
          cat._id === editingCategory._id 
            ? { ...cat, name: formData.name, description: formData.description, imageUrl: formData.imageUrl }
            : cat
        ));
        setEditingCategory(null);
      } else {
        // Add new category
        const response = await api.post('/categories', formData);
        setCategories([...categories, response.data]);
      }

      setFormData({ name: "", description: "", imageUrl: "" });
      setFilePreview(null);
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl || "",
    });
    if (category.imageUrl) {
      setFilePreview({
        id: "existing-image",
        url: category.imageUrl.startsWith('http') ? category.imageUrl : `${S3_BASE_URL}/${category.imageUrl}` ,
        file: new File([], category.imageUrl.split("/").pop() || ""),
        type: "image",
        signature: category.imageUrl,
      });
    }
    openModal();
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    setIsLoading(true);
    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories(categories.filter(cat => cat._id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (!formData.name.trim()) return;
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleModalClose = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", imageUrl: "" });
    setFilePreview(null);
    closeModal();
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
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <div className="p-6 bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800 shadow-sm">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-400">No categories added yet</p>
            <Button
              size="sm"
              onClick={openModal}
              startIcon={<PlusIcon />}
              disabled={isLoading}
              className="transform transition-transform hover:scale-105 active:scale-95"
            >
              Add Your First Category
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-slate-800/90 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4">Image</th>
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Description</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((category) => (
                  <tr key={category?._id} className="border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70">
                    <td className="px-6 py-4">
                      {category?.imageUrl && (
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                          {imageLoading[category._id] !== false && (
                            <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                          )}
                          <Image
                            src={category.imageUrl.startsWith('http') ? category.imageUrl : `${S3_BASE_URL}/${category.imageUrl}`}
                            alt={category.name}
                            fill
                            className="object-cover"
                            onLoadingComplete={() => setImageLoading((prev) => ({ ...prev, [category._id]: false }))}
                            onLoad={() => setImageLoading((prev) => ({ ...prev, [category._id]: false }))}
                            style={imageLoading[category._id] !== false ? { visibility: 'hidden' } : {}}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                      {category?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {category?.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(category)}
                          startIcon={<PencilIcon />}
                          disabled={isLoading}
                          className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(category._id)}
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

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        className="max-w-[584px] !p-0"
      >
        <div className="h-full bg-white dark:bg-slate-900/95 backdrop-blur-sm p-6 lg:p-8 rounded-[20px] border border-gray-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h4 className="mb-6 text-lg font-medium text-gray-900 dark:text-gray-200">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h4>

            {/* Image Upload */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                Category Image
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
                        alt="Category Preview"
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 p-2">Upload Category Image</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                Category Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Enter category name"
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
                placeholder="Enter category description"
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
                {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
} 