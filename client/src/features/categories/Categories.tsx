import React, { useState } from 'react';
import { selectAllCategories, useAddCategoryMutation, useGetCategoriesQuery } from './categoriesSlice';
import { useAppSelector } from '../../app/hooks';
import { Plus, Tag, MoreVertical, Edit2, Trash2, Folder } from 'lucide-react';
import AddCategory from './AddCategory';
import EditCategory from './EditCategory';
import DeleteCategory from './DeleteCategory';
import DemoRestrictionModal from '../../components/DemoRestrictionModal';
import { useDemoMode } from '../../hooks/useDemoMode';


export default function Categories() {
  const { isRestrictionOpen, setIsRestrictionOpen, protectAction } = useDemoMode();
  const { isLoading, isError } = useGetCategoriesQuery();
  const categories = useAppSelector(selectAllCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<any | null>(null);

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-pulse text-gray-400 font-medium">Loading categories...</div>
    </div>
  );

  if (isError) return (
    <div className="max-w-[1400px] mx-auto p-10 text-center">
      <p className="text-red-500">Error loading categories. Please try again.</p>
    </div>
  );

  return (
    <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Categories</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage your asset classifications and labels.</p>
        </div>

        <button
          onClick={() => protectAction(() => setIsModalOpen(true))}
          className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 uppercase text-xs tracking-widest">
          <Plus size={18} />
          Add New Category
        </button>
        {/* El modal se renderiza aquí si el hook lo activa */}
        {isRestrictionOpen && (
          <DemoRestrictionModal onClose={() => setIsRestrictionOpen(false)} />
        )}
      </div>

      {/* Grid de Categorías */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="group bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 relative overflow-hidden"
          >
            {/* Decoración sutil de fondo */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50 rounded-full group-hover:bg-blue-50 transition-colors duration-300" />

            <div className="relative flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg shadow-gray-200 group-hover:bg-blue-600 transition-colors">
                  <Tag size={20} />
                </div>
                <button className="text-gray-300 hover:text-gray-600 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-black text-gray-900 mb-1">{category.name}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                  <Folder size={12} />
                  <span>System Category</span>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => protectAction(() => setCategoryToEdit(category))}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => protectAction(() => setCategoryToDelete(category))}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
                <span className="text-[10px] font-mono text-gray-300">ID: {category.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL OVERLAY --- */}
      {isModalOpen && <AddCategory setIsModalOpen={setIsModalOpen} />}

      {/* Empty State si no hay nada */}
      {categories.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <Tag size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900">No categories found</h2>
          <p className="text-gray-500">Create your first category to start organizing assets.</p>
        </div>
      )}

      {categoryToEdit && (
        <EditCategory
          category={categoryToEdit}
          setCategoryToEdit={setCategoryToEdit}
        />
      )}
      {categoryToDelete && (
        <DeleteCategory
          category={categoryToDelete}
          onClose={() => setCategoryToDelete(false)}
        />
      )}
    </main>
  );
}