"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Form from "@/components/form/Form";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import MultiSelect from "@/components/form/MultiSelect";
import Image from "next/image";
import { CameraIcon, PlusIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";

// Category options for the MultiSelect component
const CATEGORY_OPTIONS = [
  { value: "Fashion", label: "Fashion" },
  { value: "Lifestyle", label: "Lifestyle" },
  { value: "Tech", label: "Tech" },
  { value: "Gaming", label: "Gaming" },
  { value: "Beauty", label: "Beauty" },
  { value: "Travel", label: "Travel" },
  { value: "Fitness", label: "Fitness" },
  { value: "Health", label: "Health" },
  { value: "Food", label: "Food" },
  { value: "Cooking", label: "Cooking" },
  { value: "Business", label: "Business" },
  { value: "Finance", label: "Finance" },
  { value: "Music", label: "Music" },
  { value: "Art", label: "Art" },
  { value: "Photography", label: "Photography" },
  { value: "Sports", label: "Sports" },
];

// Status options
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];

// Sample image options (in a real app, these might come from an API)
const SAMPLE_IMAGES = [
  "/images/user/user-17.jpg",
  "/images/user/user-18.jpg",
  "/images/user/user-19.jpg",
  "/images/user/user-20.jpg",
  "/images/user/user-21.jpg",
  "/images/user/user-22.jpg",
];

interface Influencer {
  id: string;
  name: string;
  email: string;
  image: string;
  categories: string[];
  status: "active" | "inactive" | "pending";
  followersCount: string;
  bio?: string;
  phone?: string;
  location?: string;
}

interface InfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: Influencer | null;
  onSave: (influencer: Influencer) => void;
}

const InfluencerModal: React.FC<InfluencerModalProps> = ({
  isOpen,
  onClose,
  influencer,
  onSave,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<Influencer>>({
    name: "",
    email: "",
    image: "/images/user/user-22.jpg", // Default image
    categories: [],
    status: "active",
    followersCount: "0",
    bio: "",
    phone: "",
    location: "",
  });

  // Image selection state
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Update form data when influencer changes
  useEffect(() => {
    if (influencer) {
      setFormData({
        ...influencer,
      });
    } else {
      // Reset form when creating new
      setFormData({
        name: "",
        email: "",
        image: "/images/user/user-22.jpg",
        categories: [],
        status: "active",
        followersCount: "0",
        bio: "",
        phone: "",
        location: "",
      });
    }
  }, [influencer]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle multi-select changes for categories
  const handleCategoriesChange = (selectedOptions: { value: string; label: string }[]) => {
    setFormData({
      ...formData,
      categories: selectedOptions.map(option => option.value),
    });
  };

  // Handle status change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      status: e.target.value as "active" | "inactive" | "pending",
    });
  };

  // Handle image selection
  const handleImageSelect = (image: string) => {
    setFormData({
      ...formData,
      image,
    });
    setShowImageSelector(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email) {
      alert("Please fill out all required fields.");
      return;
    }
    
    // Save the influencer
    onSave({
      id: influencer?.id || "", // ID will be generated if it's a new influencer
      name: formData.name!,
      email: formData.email!,
      image: formData.image!,
      categories: formData.categories!,
      status: formData.status!,
      followersCount: formData.followersCount!,
      bio: formData.bio || "",
      phone: formData.phone || "",
      location: formData.location || "",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[750px] p-5 lg:p-6"
    >
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-800 dark:text-white/90">
          {influencer ? "Edit Influencer" : "Create New Influencer"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {influencer
            ? "Update the influencer's information below."
            : "Fill in the information to create a new influencer."}
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
          <div className="relative">
            <div className="w-24 h-24 overflow-hidden rounded-full border-2 border-gray-200">
              <Image
                src={formData.image || "/images/user/user-22.jpg"}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowImageSelector(!showImageSelector)}
              className="absolute bottom-0 right-0 bg-brand-500 text-white rounded-full p-2 shadow-md hover:bg-brand-600 transition-colors"
            >
              <CameraIcon className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 dark:text-white/90 mb-1">Profile Image</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a profile image for the influencer
            </p>
            <button
              type="button"
              onClick={() => setShowImageSelector(!showImageSelector)}
              className="mt-2 text-sm text-brand-500 hover:text-brand-600 font-medium"
            >
              {showImageSelector ? "Hide options" : "Choose image"}
            </button>
          </div>
        </div>

        {/* Image Selector */}
        {showImageSelector && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 p-3 border border-gray-200 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {SAMPLE_IMAGES.map((img, index) => (
              <div
                key={index}
                onClick={() => handleImageSelect(img)}
                className={`cursor-pointer relative w-16 h-16 rounded-full overflow-hidden border-2 
                  ${formData.image === img 
                    ? "border-brand-500 ring-2 ring-brand-500/20" 
                    : "border-gray-200 hover:border-brand-300 dark:border-gray-700"}`}
              >
                <Image
                  src={img}
                  alt={`Profile option ${index + 1}`}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
                {formData.image === img && (
                  <div className="absolute inset-0 bg-brand-500/10 flex items-center justify-center">
                    <div className="w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-white"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          {/* Name */}
          <div className="col-span-1">
            <Label>Name *</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter influencer name"
              required
            />
          </div>

          {/* Email */}
          <div className="col-span-1">
            <Label>Email *</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Phone */}
          <div className="col-span-1">
            <Label>Phone</Label>
            <Input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (123) 456-7890"
            />
          </div>

          {/* Location */}
          <div className="col-span-1">
            <Label>Location</Label>
            <Input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country"
            />
          </div>

          {/* Bio */}
          <div className="col-span-2">
            <Label>Bio</Label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Brief description about the influencer"
              className="h-24 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>

          {/* Categories */}
          <div className="col-span-2">
            <Label>Categories</Label>
            <MultiSelect
              options={CATEGORY_OPTIONS}
              placeholder="Select categories"
              selected={formData.categories?.map(cat => ({
                value: cat,
                label: cat,
              })) || []}
              onChange={handleCategoriesChange}
              isClearable={true}
            />
          </div>

          {/* Status */}
          <div className="col-span-1">
            <Label>Status</Label>
            <select
              name="status"
              value={formData.status}
              onChange={handleStatusChange}
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Followers Count */}
          <div className="col-span-1">
            <Label>Followers Count</Label>
            <Input
              type="text"
              name="followersCount"
              value={formData.followersCount}
              onChange={handleChange}
              placeholder="e.g. 120K"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {influencer ? "Update" : "Create"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default InfluencerModal; 