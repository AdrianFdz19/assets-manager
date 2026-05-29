import React, { useState, type Dispatch, type SetStateAction } from 'react'
import { useAddCategoryMutation } from './categoriesSlice';
import { Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddCategoryProps {
    setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AddCategory({ setIsModalOpen }: AddCategoryProps) {

    const [newCategoryName, setNewCategoryName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Add a category
    const [addCategory, { isLoading: addingCategory }] = useAddCategoryMutation();

    const saveNewCategory = async (e?: React.FormEvent) => {
        if (e) e.preventDefault(); // Prevenir recarga si viene del form

        if (!newCategoryName.trim()) {
            setErrorMsg('Please enter a category name.');
            return;
        }

        setErrorMsg('');

        try {
            toast.promise(addCategory({ name: newCategoryName }).unwrap(), {
                loading: `Creating category "${newCategoryName}"...`,
                success: (data) => (
                    <span>
                        New category <b>{newCategoryName}</b> is ready to use
                    </span>
                ),
                error: (err) => err.data?.message || `Failed to create category`,
            });
            setIsModalOpen(false);
            setNewCategoryName('');
        } catch (err: any) {
            // Manejo de errores basado en tu experiencia con 'root cause'
            setErrorMsg(err.data?.message || 'Failed to save category');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop (Fondo oscuro) */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsModalOpen(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-200">

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <Tag size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">New Category</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Organize your assets with a new label.</p>
                </div>

                <form onSubmit={saveNewCategory} >
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-4 mb-2 block">
                                Category Name
                            </label>
                            <input
                                autoFocus
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Peripherals"
                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl outline-none font-bold text-gray-700 transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={addingCategory}
                                className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 uppercase text-xs tracking-[0.2em]"
                            >
                                Create Category
                            </button>

                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="w-full py-4 bg-transparent text-gray-400 font-bold rounded-2xl hover:text-gray-600 transition-all uppercase text-[10px] tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
