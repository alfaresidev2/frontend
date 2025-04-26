"use client";

import React, { useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlusIcon, EyeIcon, PencilIcon, TrashBinIcon, MailIcon } from "@/icons";
import InfluencerModal from "@/components/influencers/InfluencerModal";
import InfluencerDetail from "@/components/influencers/InfluencerDetail";
import Pagination from "@/components/tables/Pagination";

// Temporary data structure for influencers
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

// Mock data for demonstration
const mockInfluencers: Influencer[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    image: "/images/user/user-17.jpg",
    categories: ["Fashion", "Lifestyle"],
    status: "active",
    followersCount: "120K",
    bio: "Fashion and lifestyle influencer with a focus on sustainable brands and ethical clothing. Passionate about creating content that inspires others to make conscious consumer choices.",
    phone: "+1 (555) 123-4567",
    location: "Los Angeles, USA",
  },
  {
    id: "2",
    name: "David Chen",
    email: "david.chen@example.com",
    image: "/images/user/user-18.jpg",
    categories: ["Tech", "Gaming"],
    status: "active",
    followersCount: "450K",
    bio: "Tech reviewer and gaming enthusiast. Covering the latest gadgets, gaming trends, and tech innovations since 2015.",
    phone: "+1 (555) 987-6543",
    location: "San Francisco, USA",
  },
  {
    id: "3",
    name: "Emma Williams",
    email: "emma.w@example.com",
    image: "/images/user/user-19.jpg",
    categories: ["Beauty", "Travel"],
    status: "inactive",
    followersCount: "210K",
    bio: "Beauty expert and globe trotter sharing skincare routines and travel adventures. Certified makeup artist with 7+ years of experience.",
    location: "London, UK",
  },
  {
    id: "4",
    name: "Michael Brown",
    email: "michael.b@example.com",
    image: "/images/user/user-20.jpg",
    categories: ["Fitness", "Health"],
    status: "pending",
    followersCount: "85K",
    bio: "Personal trainer and nutrition coach. Helping people achieve their fitness goals through science-based methods and sustainable lifestyle changes.",
    phone: "+1 (555) 234-5678",
    location: "Chicago, USA",
  },
  {
    id: "5",
    name: "Jessica Martinez",
    email: "jessica.m@example.com",
    image: "/images/user/user-21.jpg",
    categories: ["Food", "Cooking"],
    status: "active",
    followersCount: "320K",
    bio: "Culinary artist and food photographer. Creating delicious recipes and stunning food content for brands and personal enjoyment.",
    phone: "+1 (555) 345-6789",
    location: "Miami, USA",
  },
];

export default function InfluencersPage() {
  const router = useRouter();
  const [influencers, setInfluencers] = useState<Influencer[]>(mockInfluencers);
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>(mockInfluencers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentInfluencer, setCurrentInfluencer] = useState<Influencer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Apply filters and search
  const applyFilters = () => {
    let filtered = [...influencers];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inf => 
        inf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inf.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(inf => inf.status === filterStatus);
    }
    
    setFilteredInfluencers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };
  
  // Effect to apply filters when search term or filter status changes
  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, influencers]);
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInfluencers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage);

  // Modal handlers
  const openCreateModal = () => {
    setCurrentInfluencer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (influencer: Influencer) => {
    setCurrentInfluencer(influencer);
    setIsModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const openDetailModal = (influencer: Influencer) => {
    setCurrentInfluencer(influencer);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentInfluencer(null);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  // CRUD operations
  const handleSave = (influencer: Influencer) => {
    if (currentInfluencer) {
      // Update existing influencer
      setInfluencers(influencers.map(inf => 
        inf.id === influencer.id ? influencer : inf
      ));
    } else {
      // Create new influencer with generated ID
      const newInfluencer = {
        ...influencer,
        id: Math.random().toString(36).substring(2, 9),
      };
      setInfluencers([...influencers, newInfluencer]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this influencer?")) {
      setInfluencers(influencers.filter(inf => inf.id !== id));
      closeDetailModal();
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'inactive': return 'error';
      default: return 'light';
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Influencer Management" />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          All Influencers
        </h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              className="h-11 w-full rounded-lg border appearance-none pl-10 pr-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
              placeholder="Search by name, email, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MailIcon className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          {/* Add Button */}
          <div className="flex justify-end">
            <Button 
              variant="primary" 
              size="md" 
              startIcon={<PlusIcon className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Add Influencer
            </Button>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {filteredInfluencers.length === 0 ? (
            'No influencers found'
          ) : (
            <>
              Showing <span className="font-medium">{Math.min(indexOfFirstItem + 1, filteredInfluencers.length)}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredInfluencers.length)}</span> of{' '}
              <span className="font-medium">{filteredInfluencers.length}</span> influencers
            </>
          )}
        </div>
      </div>
      
      {filteredInfluencers.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800/50 mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                 className="text-gray-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white/90 mb-1">No influencers found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your search or filter to find what you're looking for.</p>
          <Button 
            variant="primary" 
            size="sm" 
            startIcon={<PlusIcon className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            Add Influencer
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1000px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Influencer
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Categories
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Followers
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {currentItems.map((influencer) => (
                    <TableRow key={influencer.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <Image
                              width={40}
                              height={40}
                              src={influencer.image}
                              alt={influencer.name}
                            />
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {influencer.name}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {influencer.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex flex-wrap gap-1">
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
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {influencer.followersCount}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={getStatusBadgeColor(influencer.status)}
                        >
                          {influencer.status.charAt(0).toUpperCase() + influencer.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2"
                            onClick={() => openDetailModal(influencer)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2"
                            onClick={() => openEditModal(influencer)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2"
                            onClick={() => handleDelete(influencer.id)}
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex justify-center border-t border-gray-100 dark:border-white/[0.05]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <InfluencerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        influencer={currentInfluencer}
        onSave={handleSave}
      />
      
      {/* Detail Modal */}
      <InfluencerDetail
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        influencer={currentInfluencer}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />
    </div>
  );
} 