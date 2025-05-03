"use client";

import React, { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import api from "@/utils/axios";

interface Category {
  _id: string;
  name: string;
  description: string;
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/category');
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      console.log(editingCategory)
      if (editingCategory) {
        // Update existing category
        await api.put(`/admin/category/${editingCategory._id}`, formData);
        setCategories(categories.map(cat => 
          cat._id === editingCategory._id 
            ? { ...cat, name: formData.name, description: formData.description }
            : cat
        ));
        setEditingCategory(null);
      } else {
        // Add new category
        const response = await api.post('/admin/category', formData);
        setCategories([...categories, response.data.data]);
      }

      setFormData({ name: "", description: "" });
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
    });
    openModal();
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    setIsLoading(true);
    try {
      await api.delete(`/admin/category/${categoryId}`);
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
    setFormData({ name: "", description: "" });
    closeModal();
  };

  return (
    <div className="space-y-6">
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
                  <th scope="col" className="px-6 py-4">Name</th>
                  <th scope="col" className="px-6 py-4">Description</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category._id} className="border-b border-gray-200 dark:border-slate-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/70">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {category.description || "-"}
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
                disabled={isLoading}
                className="transform transition-transform hover:scale-105 active:scale-95 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2"
              >
                Close
              </Button>
              <Button 
                size="sm" 
                onClick={handleButtonClick} 
                disabled={isLoading}
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