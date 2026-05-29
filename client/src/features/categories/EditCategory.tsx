import React, { useState, type Dispatch, type SetStateAction } from 'react';
import { useUpdateCategoryMutation, useDeleteCategoryMutation } from './categoriesSlice';
import { Edit2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Definimos el tipo de la categoría basado en tu estructura
interface Category {
    id: number;
    name: string;
}

interface EditCategoryProps {
    category: Category;
    setCategoryToEdit: Dispatch<SetStateAction<Category | null>>;
}

export default function EditCategory({ category, setCategoryToEdit }: EditCategoryProps) {
    const [editName, setEditName] = useState(category.name);
    const [errorMsg, setErrorMsg] = useState('');

    // Mutations de RTK Query
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editName.trim()) {
            setErrorMsg('Name cannot be empty.');
            return;
        }

        try {
            toast.promise(updateCategory({ id: category.id, name: editName }).unwrap(), {
                loading: `Updating category to "${editName}"...`,
                success: (data) => (
                    <span>
                        Category renamed to <b>{editName}</b>
                    </span>
                ),
                error: (err) => err.data?.message || `Failed to update category`,
            });
            setCategoryToEdit(null); // Cerrar modal al éxito
        } catch (err: any) {
            setErrorMsg(err.data?.message || 'Update failed. Try again.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setCategoryToEdit(null)}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-200">

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                        <Edit2 size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Edit Category</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-tighter">ID: #{category.id}</p>
                </div>

                <form onSubmit={handleUpdate}>
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-4 mb-2 block">
                                Category Name
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold text-gray-700 transition-all"
                            />

                            {errorMsg && (
                                <div className="flex items-center gap-2 mt-3 ml-2 text-red-500">
                                    <AlertCircle size={14} />
                                    <p className="text-xs font-bold uppercase tracking-tight">{errorMsg}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-blue-600 disabled:bg-gray-400 transition-all uppercase text-xs tracking-[0.2em] shadow-lg shadow-gray-200"
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setCategoryToEdit(null)}
                                className="w-full py-4 bg-transparent text-gray-400 font-bold rounded-2xl hover:text-gray-600 transition-all uppercase text-[10px] tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}