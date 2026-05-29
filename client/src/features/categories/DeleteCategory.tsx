import React from 'react';
import { useDeleteCategoryMutation } from './categoriesSlice';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeleteCategoryProps {
    category: { id: number; name: string };
    onClose: () => void;
}

export default function DeleteCategory({ category, onClose }: DeleteCategoryProps) {
    const [deleteCategory, { isLoading }] = useDeleteCategoryMutation();
    const [errorMsg, setErrorMsg] = React.useState('');

    const handleDelete = async () => {
        try {
            toast.promise(deleteCategory({ id: category.id }).unwrap(), {
                loading: `Deleting "${category.name}"...`,
                success: `Category "${category.name}" deleted successfully`,
                error: (err) => err.data?.message || `Failed to delete "${category.name}"`,
            });
            onClose();
        } catch (err: any) {
            // "Root cause" analysis: Usually foreign key constraints
            setErrorMsg(err.data?.message || 'Failed to delete. Check if category is in use.');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl text-center">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} />
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2">Are you sure?</h2>
                <p className="text-gray-500 text-sm font-medium mb-8">
                    You are about to delete <span className="text-gray-900 font-bold">"{category.name}"</span>.
                    Associated assets will be unlinked.
                </p>

                {errorMsg && (
                    <p className="text-red-500 text-xs font-bold mb-4 uppercase">{errorMsg}</p>
                )}

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={isLoading}
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Delete Category'}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase text-[10px] tracking-widest"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}