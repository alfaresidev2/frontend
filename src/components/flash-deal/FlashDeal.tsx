"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PlusIcon, CloseIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import Image from "next/image";
import api from "@/utils/axios";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
}

interface Influencer {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  services: Service[];
}

interface FlashDeal {
  _id: string;
  serviceId: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  startDate: string; // ISO string with time
  endDate: string; // ISO string with time
  maxQuantity: number;
  imageUrl: string;
  service?: Service;
}

interface FormData {
  serviceId: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: string;
  startDate: string;
  endDate: string;
  maxQuantity: number;
  imageUrl: string;
}

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

// Add custom datepicker styles
const datePickerStyles = {
  width: "100%",
  height: "42px",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  color: "rgb(17 24 39)",
  backgroundColor: "rgb(249 250 251)",
  border: "1px solid rgb(229 231 235)",
  borderRadius: "0.5rem",
  outline: "none",
};

const darkDatePickerStyles = {
  ...datePickerStyles,
  color: "rgb(229 231 235)",
  backgroundColor: "rgb(30 41 59)",
  border: "1px solid rgb(55 65 81)",
};


export default function FlashDealPage() {
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [flag, setFlag] = useState(false);
  const { isOpen: isAddModalOpen, openModal: openAddModal, closeModal: closeAddModal } = useModal();
  const { isOpen: isConfirmModalOpen, openModal: openConfirmModal, closeModal: closeConfirmModal } = useModal();
  const [darkMode, setDarkMode] = useState(false);

  // Add state for pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    serviceId: "",
    title: "",
    description: "",
    originalPrice: 0,
    discountedPrice: "",
    startDate: "",
    endDate: "",
    maxQuantity: 0,
    imageUrl: "",
  });

  const [editingFlashDeal, setEditingFlashDeal] = useState<FlashDeal | null>(null);
  const [currentFlashDeal, setCurrentFlashDeal] = useState<FlashDeal | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});

  // Fetch flash deals
  const fetchFlashDeals = useCallback(async () => {
    try {
      setIsTableLoading(true);
      const response = await api.get("/flash-deal", {
        params: { page, limit }
      });
      setFlashDeals(response.data?.data?.docs || []);
      setTotal(response.data?.data?.totalDocs || response.data?.data?.total || 0);
    } catch (error) {
      console.error("Error fetching flash deals:", error);
      alert("Failed to fetch flash deals. Please try again later.");
    } finally {
      setIsTableLoading(false);
    }
  }, [page, limit]);

  const theme = localStorage.getItem("theme");

  // Fetch influencers with services
  const fetchInfluencers = useCallback(async () => {
    try {
      const response = await api.get("/user/influencer-search", {
        params: { hasService: true }
      });
      setInfluencers(response.data.data.docs);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      alert("Failed to fetch influencers. Please try again later.");
    }
  }, []);

  useEffect(() => {
    fetchFlashDeals();
  }, [fetchFlashDeals, flag]);

  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers, flag]);

  useEffect(() => {
    setDarkMode(theme === "dark" ? true : false);
  },[theme])

  // Add click outside handler for action menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openActionMenu && !(event.target as Element).closest('.relative')) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenu]);

  // Add state syncing with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = parseInt(params.get("page") || "1", 10);
    const limitParam = parseInt(params.get("limit") || "5", 10);

    if (pageParam !== page) setPage(pageParam);
    if (limitParam !== limit) setLimit(limitParam);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, [page, limit]);

  const handleInfluencerChange = (selected: Influencer | null) => {
    setSelectedInfluencer(selected);
    setSelectedService(null);
    setFormData(prev => ({
      ...prev,
      serviceId: "",
      originalPrice: 0,
      imageUrl: "",
    }));
  };

  const handleServiceChange = (service: Service) => {
    setSelectedService(service);
    setFormData(prev => ({
      ...prev,
      serviceId: service._id,
      title: service.title,
      description: service.description,
      originalPrice: service.price,
      discountedPrice: "",
      imageUrl: service.imageUrl,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | Date | null,
    name?: string
  ) => {
    if (name === "startDate" || name === "endDate") {
      const date = e as Date;
      if (!date) return;
      
      // Create date string in YYYY-MM-DD format
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      if (name === "startDate") {
        // If start date is changed and end date is before new start date, update end date
        const currentEndDate = new Date(formData.endDate);
        const newStartDate = new Date(dateString);
        
        setFormData(prev => ({
          ...prev,
          [name]: dateString,
          endDate: currentEndDate < newStartDate ? dateString : prev.endDate,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: dateString,
        }));
      }
    } else {
      const event = e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
      const { name: inputName, value } = event.target;
      
      if (inputName === "discountedPrice") {
        if (value === "" || /^\d*\.?\d*$/.test(value)) {
          setFormData(prev => ({
            ...prev,
            [inputName]: value,
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          [inputName]: inputName === "maxQuantity" || inputName === "originalPrice" 
            ? Number(value) 
            : value,
        }));
      }
    }
  };

  const handleSubmit = () => {
    // Validate form data
    if (!formData.serviceId) {
      alert("Please select a service");
      return;
    }
    if (!formData.title.trim()) {
      alert("Title is required");
      return;
    }
    if (!formData.description.trim()) {
      alert("Description is required");
      return;
    }
    
    // Convert discounted price to number for validation
    const discountedPrice = Number(formData.discountedPrice);
    if (isNaN(discountedPrice) || discountedPrice <= 0) {
      alert("Please enter a valid discounted price");
      return;
    }
    if (discountedPrice >= formData.originalPrice) {
      alert("Discounted price must be less than original price");
      return;
    }
    
    // Date validation
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(formData.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day

    if (!formData.startDate || !formData.endDate) {
      alert("Start and end dates are required");
      return;
    }

    if (startDate < currentDate) {
      alert("Start date cannot be before today");
      return;
    }

    if (endDate < startDate) {
      alert("End date must be after start date");
      return;
    }

    if (formData.maxQuantity <= 0) {
      alert("Maximum quantity must be greater than 0");
      return;
    }

    // Format dates to ISO strings with proper time
    const formattedStartDate = new Date(formData.startDate);
    formattedStartDate.setHours(0, 0, 0, 0);
    
    const formattedEndDate = new Date(formData.endDate);
    formattedEndDate.setHours(23, 59, 59, 999);

    setCurrentFlashDeal({
      _id: editingFlashDeal?._id || "",
      serviceId: formData.serviceId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      originalPrice: formData.originalPrice,
      discountedPrice: Number(formData.discountedPrice),
      startDate: formattedStartDate.toISOString(),
      endDate: formattedEndDate.toISOString(),
      maxQuantity: formData.maxQuantity,
      imageUrl: formData.imageUrl,
      service: selectedService || undefined,
    });

    // Close the form modal and open confirmation modal
    closeAddModal();
    openConfirmModal();
  };

  const handleConfirm = async () => {
    if (!currentFlashDeal) return;

    setIsLoading(true);
    try {
      // Prepare the payload with only the required fields
      const payload = {
        serviceId: currentFlashDeal.serviceId,
        title: currentFlashDeal.title,
        description: currentFlashDeal.description,
        originalPrice: currentFlashDeal.originalPrice,
        discountedPrice: currentFlashDeal.discountedPrice,
        startDate: currentFlashDeal.startDate,
        endDate: currentFlashDeal.endDate,
        maxQuantity: currentFlashDeal.maxQuantity,
        imageUrl: currentFlashDeal.imageUrl,
      };

      if (editingFlashDeal) {
        const response = await api.put(`/flash-deal/${editingFlashDeal._id}`, payload);
        setFlashDeals(prev => prev.map(deal => 
          deal._id === editingFlashDeal._id ? response.data.data : deal
        ));
      } else {
        const response = await api.post("/flash-deal", payload);
        setFlashDeals(prev => [...prev, response.data.data]);
      }
      setFlag(!flag);
      closeConfirmModal();
      resetForm();
    } catch (error) {
      console.error("Error saving flash deal:", error);
      alert("Failed to save flash deal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (flashDeal: FlashDeal) => {
    setEditingFlashDeal(flashDeal);
    
    // Convert ISO dates to YYYY-MM-DD format for input fields
    const startDate = new Date(flashDeal.startDate);
    const endDate = new Date(flashDeal.endDate);
    
    setFormData({
      serviceId: flashDeal.serviceId,
      title: flashDeal.title,
      description: flashDeal.description,
      originalPrice: flashDeal.originalPrice,
      discountedPrice: flashDeal.discountedPrice.toString(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      maxQuantity: flashDeal.maxQuantity,
      imageUrl: flashDeal.imageUrl,
    });

    // Find and set the influencer and service
    const influencer = influencers.find(inf => 
      inf.services.some(service => service._id === flashDeal.serviceId)
    );
    if (influencer) {
      setSelectedInfluencer(influencer);
      const service = influencer.services.find(s => s._id === flashDeal.serviceId);
      if (service) {
        setSelectedService(service);
      }
    }
    openAddModal();
  };

  const handleDelete = async (flashDealId: string) => {
    if (!window.confirm("Are you sure you want to delete this flash deal?")) return;

    setIsLoading(true);
    try {
      await api.delete(`/flash-deal/${flashDealId}`);
      setFlashDeals(prev => prev.filter(deal => deal._id !== flashDealId));
    } catch (error) {
      console.error("Error deleting flash deal:", error);
      alert("Failed to delete flash deal");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceId: "",
      title: "",
      description: "",
      originalPrice: 0,
      discountedPrice: "",
      startDate: "",
      endDate: "",
      maxQuantity: 0,
      imageUrl: "",
    });
    setSelectedInfluencer(null);
    setSelectedService(null);
    setEditingFlashDeal(null);
  };

  const handleCloseAddModal = () => {
    resetForm();
    closeAddModal();
  };

  const handleActionMenuToggle = (dealId: string | null) => {
    setOpenActionMenu(openActionMenu === dealId ? null : dealId);
  };

  return (
    <div className="space-y-6">
      <style>{shimmerKeyframes}</style>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex-1">
          
        </div>
        <Button
          size="sm"
          onClick={openAddModal}
          startIcon={<PlusIcon />}
          disabled={isLoading || isTableLoading}
          className="transform transition-transform hover:scale-105 active:scale-95"
        >
          {isLoading ? "Loading..." : "Add Flash Deal"}
        </Button>
      </div>

      {/* Add items per page control */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Flash Deals per page:</span>
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

      {/* Flash Deals Table */}
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
        ) : flashDeals.length === 0 ? (
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
            <p className="mb-4 text-gray-600 dark:text-gray-400">No flash deals added yet</p>
            <Button
              size="sm"
              onClick={openAddModal}
              startIcon={<PlusIcon />}
              disabled={isLoading || isTableLoading}
              className="transform transition-transform hover:scale-105 active:scale-95"
            >
              Add Your First Flash Deal
            </Button>
          </motion.div>
        ) : (
          <div className="">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
              <thead className="text-xs uppercase bg-gray-50 dark:bg-slate-800/90 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4">Image</th>
                  <th scope="col" className="px-6 py-4">Title</th>
                  <th scope="col" className="px-6 py-4">Service</th>
                  <th scope="col" className="px-6 py-4">Price</th>
                  <th scope="col" className="px-6 py-4">Discount</th>
                  <th scope="col" className="px-6 py-4">Duration</th>
                  <th scope="col" className="px-6 py-4">Quantity</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flashDeals.map((deal) => (
                  <tr
                    key={deal._id}
                    className="border-b border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800/70"
                  >
                    <td className="px-6 py-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        {imageLoading[deal._id] !== false && (
                          <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                        )}
                        <Image
                          src={deal.imageUrl || "/placeholder.svg"}
                          alt={deal.title}
                          fill
                          className="object-cover"
                          onLoadingComplete={() => setImageLoading(prev => ({ ...prev, [deal._id]: false }))}
                          onLoad={() => setImageLoading(prev => ({ ...prev, [deal._id]: false }))}
                          style={imageLoading[deal._id] !== false ? { visibility: 'hidden' } : {}}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                      {deal.title}
                    </td>
                    <td className="px-6 py-4">
                      {deal.service?.title || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="line-through text-gray-400">
                          KWD {deal.originalPrice}
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          KWD {deal.discountedPrice}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <span className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/40 rounded-full">
                        {Math.round(((deal.originalPrice - deal.discountedPrice) / deal.originalPrice) * 100)}% OFF
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        <span>From: {new Date(deal.startDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}</span>
                        <span>To: {new Date(deal.endDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 rounded-full">
                        {deal.maxQuantity} available
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionMenuToggle(deal._id);
                            }}
                            className="w-9 h-11 flex items-center justify-center rounded-lg border border-gray-300 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"
                          >
                            <span className="text-xl leading-none text-gray-600 dark:text-gray-400 font-bold">⋮</span>
                          </div>

                          {openActionMenu === deal._id && (
                            <div
                              className="absolute right-0 mt-2 w-48 rounded-lg z-50 shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 py-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  handleEdit(deal);
                                  handleActionMenuToggle(null);
                                }}
                                disabled={isLoading || isTableLoading}
                                className="w-full px-6 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <PencilIcon className="w-6 h-6" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(deal._id);
                                  handleActionMenuToggle(null);
                                }}
                                disabled={isLoading || isTableLoading}
                                className="w-full px-6 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <TrashBinIcon className="w-6 h-6" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
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
      {flashDeals.length > 0 && total > limit && (
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={handleCloseAddModal}
            className="max-w-[800px] !fixed !right-0 !top-0 !bottom-0 !translate-x-0 !rounded-l-[20px] !rounded-r-none !p-0 dark:border-l dark:border-slate-700"
          >
            <motion.div
              className="h-full bg-white dark:bg-slate-900/95 backdrop-blur-sm"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200 dark:border-slate-700">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                    {editingFlashDeal ? "Edit Flash Deal" : "Add New Flash Deal"}
                  </h4>
                  <CloseIcon
                    className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                    onClick={handleCloseAddModal}
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    {/* Influencer Selection */}
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                        Select Influencer <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={selectedInfluencer}
                        onChange={handleInfluencerChange}
                        options={influencers}
                        getOptionLabel={(option: Influencer) => option.name}
                        getOptionValue={(option: Influencer) => option._id}
                        placeholder="Select an influencer..."
                        className="react-select-container"
                        classNamePrefix="react-select"
                        isDisabled={isLoading}
                        styles={{
                          control: (base) => ({
                            ...base,
                            backgroundColor: darkMode ? "rgb(30 41 59)" : "white",
                            borderColor: darkMode ? "rgb(55 65 81)" : "rgb(229 231 235)",
                          }),
                          option: (base) => ({
                            ...base,
                            backgroundColor: darkMode ? "rgb(30 41 59)" : "white",
                            color: darkMode ? "white" : "black",
                          }),
                          menu: (base) => ({
                            ...base,
                            backgroundColor: darkMode ? "rgb(30 41 59)" : "white",
                          }),
                          menuList: (base) => ({
                            ...base,
                            backgroundColor: darkMode ? "rgb(30 41 59)" : "white",  
                          }),
                          singleValue: (base) => ({
                            ...base,
                            color: darkMode ? "white" : "black",
                          }),
                          placeholder: (base) => ({
                            ...base,
                            color: darkMode ? "white" : "black",
                          }),
                          input: (base) => ({
                            ...base,
                            color: darkMode ? "white" : "black",
                          }),
                          indicatorSeparator: (base) => ({
                            ...base,
                            backgroundColor: darkMode ? "rgb(55 65 81)" : "rgb(229 231 235)",
                          }),
                          dropdownIndicator: (base) => ({
                            ...base,
                            color: darkMode ? "white" : "black",
                          }),
                          clearIndicator: (base) => ({
                            ...base,
                            color: darkMode ? "white" : "black",
                          }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: darkMode ? "rgb(30 41 59)" : "white",
                            color: darkMode ? "white" : "black",
                          }),
                        }}
                      />
                    </div>

                    {/* Service Selection */}
                    {selectedInfluencer && (
                      <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                          Select Service <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedInfluencer.services.map((service) => (
                            <div
                              key={service._id}
                              onClick={() => handleServiceChange(service)}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedService?._id === service._id
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
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-gray-200">
                                    {service.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    KWD {service.price}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Flash Deal Details */}
                    {selectedService && (
                      <>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                            Title <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                            required
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                              Original Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              name="originalPrice"
                              value={formData.originalPrice}
                              disabled
                              className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-200 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                              required
                              min={0}
                              step={1}
                            />
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                              Discounted Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="discountedPrice"
                              value={formData.discountedPrice}
                              onChange={handleChange}
                              placeholder="Enter discounted price"
                              className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                              required
                            />
                            {formData.discountedPrice && Number(formData.discountedPrice) >= formData.originalPrice && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                Discounted price must be less than original price
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                              Start Date <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                              selected={formData.startDate ? new Date(formData.startDate + 'T00:00:00Z') : null}
                              onChange={(date) => handleChange(date, "startDate")}
                              minDate={new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')}
                              dateFormat="dd-MM-yyyy"
                              className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                              wrapperClassName="w-full"
                              required
                              customInput={
                                <input
                                  style={darkMode ? darkDatePickerStyles : datePickerStyles}
                                  className="w-full"
                                />
                              }
                            />
                            {formData.startDate && new Date(formData.startDate + 'T00:00:00Z') < new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z') && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                Start date cannot be before today
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                              End Date <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                              selected={formData.endDate ? new Date(formData.endDate + 'T00:00:00Z') : null}
                              onChange={(date) => handleChange(date, "endDate")}
                              minDate={formData.startDate ? new Date(formData.startDate + 'T00:00:00Z') : new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z')}
                              dateFormat="dd-MM-yyyy"
                              className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                              wrapperClassName="w-full"
                              required
                             
                            />
                            {formData.startDate && formData.endDate && new Date(formData.endDate + 'T00:00:00Z') < new Date(formData.startDate + 'T00:00:00Z') && (
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                End date must be after start date
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                            Maximum Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="maxQuantity"
                            value={formData.maxQuantity}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-gray-900 dark:text-gray-200 bg-gray-50 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-gray-700"
                            required
                            min={1}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCloseAddModal}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedService}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </div>
                        ) : editingFlashDeal ? (
                          "Update Flash Deal"
                        ) : (
                          "Add Flash Deal"
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && currentFlashDeal && (
          <Modal
            isOpen={isConfirmModalOpen}
            onClose={closeConfirmModal}
            className="max-w-[600px] !p-0"
          >
            <motion.div
              className="bg-white dark:bg-slate-900/95 backdrop-blur-sm rounded-[20px] border border-gray-200 dark:border-slate-800"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 200,
                duration: 0.5,
              }}
            >
              <div className="p-6 lg:p-8 border-b border-gray-200 dark:border-slate-700">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-200">
                  Confirm Flash Deal Details
                </h4>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Service</p>
                    <div className="flex items-center gap-2">
                      {currentFlashDeal.service && currentFlashDeal.service.imageUrl && currentFlashDeal.service._id && (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden">
                          {imageLoading[`confirm-${currentFlashDeal.service._id}`] !== false && (
                            <div style={shimmerStyle} className="absolute inset-0 w-full h-full" />
                          )}
                          <Image
                            src={currentFlashDeal.service.imageUrl}
                            alt={currentFlashDeal.service.title}
                            fill
                            className="object-cover"
                            onLoadingComplete={() => {
                              const serviceId = currentFlashDeal.service?._id;
                              if (serviceId) {
                                setImageLoading(prev => ({ ...prev, [`confirm-${serviceId}`]: false }));
                              }
                            }}
                            onLoad={() => {
                              const serviceId = currentFlashDeal.service?._id;
                              if (serviceId) {
                                setImageLoading(prev => ({ ...prev, [`confirm-${serviceId}`]: false }));
                              }
                            }}
                            style={currentFlashDeal.service._id && imageLoading[`confirm-${currentFlashDeal.service._id}`] !== false ? { visibility: 'hidden' } : {}}
                          />
                        </div>
                      )}
                      <p className="font-medium text-gray-900 dark:text-gray-200">
                        {currentFlashDeal.service?.title}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Title</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {currentFlashDeal.title}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Original Price</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      KWD {currentFlashDeal.originalPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Discounted Price</p>
                    <p className="font-medium text-green-600 dark:text-green-400">
                      KWD {currentFlashDeal.discountedPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {new Date(currentFlashDeal.startDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })} -{" "}
                      {new Date(currentFlashDeal.endDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Maximum Quantity</p>
                    <p className="font-medium text-gray-900 dark:text-gray-200">
                      {currentFlashDeal.maxQuantity}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="mt-1 text-gray-900 dark:text-gray-200">
                    {currentFlashDeal.description}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={closeConfirmModal}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      "Confirm & Save"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
} 