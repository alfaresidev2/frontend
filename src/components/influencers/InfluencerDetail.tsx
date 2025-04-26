"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { EnvelopeIcon, PhoneIcon, MapPinIcon, PencilIcon, TrashIcon } from "@/icons";

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

interface InfluencerDetailProps {
  isOpen: boolean;
  onClose: () => void;
  influencer: Influencer | null;
  onEdit: (influencer: Influencer) => void;
  onDelete: (id: string) => void;
}

const InfluencerDetail: React.FC<InfluencerDetailProps> = ({
  isOpen,
  onClose,
  influencer,
  onEdit,
  onDelete,
}) => {
  if (!influencer) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'error';
      default: return 'light';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[750px] p-0"
    >
      <div className="flex flex-col">
        {/* Header with cover image */}
        <div className="h-32 bg-gradient-to-r from-brand-600 to-brand-400 relative">
          <div className="absolute -bottom-16 left-6 rounded-full border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
            <Image
              src={influencer.image}
              alt={influencer.name}
              width={96}
              height={96}
              className="h-24 w-24 object-cover"
            />
          </div>
          
          {/* Actions */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-brand-500 hover:bg-brand-50"
              onClick={() => onEdit(influencer)}
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-error-500 hover:bg-error-50"
              onClick={() => {
                if (confirm("Are you sure you want to delete this influencer?")) {
                  onDelete(influencer.id);
                  onClose();
                }
              }}
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        
        {/* Profile info */}
        <div className="pt-20 px-6 pb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                {influencer.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge
                  size="sm"
                  color={getStatusBadgeColor(influencer.status)}
                >
                  {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Followers: {influencer.followersCount}
                </span>
              </div>
            </div>
          </div>
          
          {/* Bio section */}
          {influencer.bio && (
            <div className="mt-6">
              <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
                Bio
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {influencer.bio}
              </p>
            </div>
          )}
          
          {/* Contact info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{influencer.email}</p>
              </div>
            </div>
            
            {influencer.phone && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center">
                  <PhoneIcon className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{influencer.phone}</p>
                </div>
              </div>
            )}
            
            {influencer.location && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{influencer.location}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Categories */}
          <div className="mt-6">
            <h3 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-2">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {influencer.categories.map((category, idx) => (
                <Badge 
                  key={idx} 
                  variant="light" 
                  color="primary"
                  size="sm"
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Followers</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white/90 mt-1">
                {influencer.followersCount}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Categories</p>
              <p className="text-xl font-semibold text-gray-800 dark:text-white/90 mt-1">
                {influencer.categories.length}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <div className="flex justify-center mt-1">
                <Badge
                  size="md"
                  color={getStatusBadgeColor(influencer.status)}
                >
                  {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InfluencerDetail; 