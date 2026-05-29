import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import { selectAssetById, useDeleteAssetMutation, useGetAssetsQuery, useUpdateAssetMutation, useUploadImageMutation } from './assetsSlice';
import { selectAllUsers, useGetUsersQuery } from '../users/usersSlice';
import { selectAllCategories, useGetCategoriesQuery } from '../categories/categoriesSlice';
import { ArrowLeft, Save, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { RootState } from '../../app/store';
import toast from 'react-hot-toast';
import { useDemoMode } from '../../hooks/useDemoMode';

export default function EditAsset() {
    const { isRestrictionOpen, setIsRestrictionOpen, protectAction } = useDemoMode();
    const { assetId } = useParams();
    const navigate = useNavigate();

    // Obtener datos de Redux
    const { isLoading: isLoadingAssets } = useGetAssetsQuery({});
    const { isLoading: isLoadingCategories } = useGetCategoriesQuery();
    const { isLoading: isLoadingUsers } = useGetUsersQuery();
    const asset = useAppSelector((state: RootState) => selectAssetById(state, Number(assetId)));
    const users = useAppSelector(selectAllUsers);
    const categories = useAppSelector(selectAllCategories);

    // Delete Asset Logic
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmName, setConfirmName] = useState(''); // Para el input de confirmación
    const [deleteAsset, { isLoading: isDeleting }] = useDeleteAssetMutation();
    const [errorMsg, setErrorMsg] = useState('');

    // Imagen 1.-Añadimos un estado para el archivo seleccionado
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(asset?.image_url || null);
    const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

    // Imagen 2. Manejador de cambio de archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Previsualización instantánea
        }
    };

    console.log(asset);

    const [updateAsset, { isLoading: isUpdating }] = useUpdateAssetMutation();

    // Estado local del formulario precargado con el asset
    const [formData, setFormData] = useState({
        name: asset?.name || '',
        serial_number: asset?.serial_number || '', // Cambiado
        status: asset?.status || 'available',
        value: asset?.value || 0,
        purchase_date: asset?.purchase_date?.split('T')[0] || '', // Cambiado
        category_id: asset?.category_id || '', // Cambiado
        user_id: asset?.user_id || '' // Cambiado
    });

    // Sincronizar estado si el asset tarda en cargar
    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name,
                serial_number: asset.serial_number,
                status: asset.status,
                value: asset.value,
                purchase_date: asset.purchase_date?.split('T')[0] || '',
                category_id: asset.category_id,
                user_id: asset.user_id || ''
            });

            // AGREGA ESTA LÍNEA:
            // Si no hay un archivo seleccionado localmente, usa la imagen del asset
            if (!selectedFile) {
                setPreviewUrl(asset.image_url || null);
            }
        }
    }, [asset, selectedFile]);

    if (!asset) {
        return (
            <div className="max-w-[1400px] mx-auto p-8 text-center">
                <p className="text-gray-500 italic">Asset no encontrado...</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 font-bold mt-4">Volver</button>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Changes inputs
    const handleChangeStatus = (e: any) => {
        let status = e.target.value;
        if (status !== 'in-use') {
            setFormData(prev => ({ ...prev, user_id: '' }));
        }
        setFormData(prev => ({ ...prev, status }));
    }

    const handleChangeAssignedUser = (e: any) => {
        let userId = e.target.value;
        if (userId) {
            setFormData(prev => ({ ...prev, status: 'in-use' }));
        }
        setFormData(prev => ({ ...prev, user_id: userId }));
    };

    const onSaveAsset = async () => {
        try {
            setErrorMsg('');
            // Verificacion de status
            // 1. Si hay un usuario, el status DEBE ser 'in-use'
            if (formData.user_id && formData.status !== 'in-use') {
                setErrorMsg('Assets assigned to a user must have "In Use" status.');
                return;
            }

            // 2. Si el status es 'in-use', DEBE haber un usuario
            if (formData.status === 'in-use' && !formData.user_id) {
                setErrorMsg('In-use assets require an assignee.');
                return;
            }

            if ((formData.status === 'maintenance' || formData.status === 'retired' || formData.status === 'available') && formData.user_id) {
                setErrorMsg(`Assets in "${formData.status}" status cannot be assigned to a user.`);
                return;
            }

            // 2. Definimos la lógica de guardado en una promesa para el Toast
            const updateProcess = (async () => {
                let image_url = asset.image_url;
                let image_public_id = asset.image_public_id;

                if (selectedFile) {
                    const imgData = new FormData();
                    imgData.append('image', selectedFile);
                    const uploadResult = await uploadImage(imgData).unwrap();
                    image_url = uploadResult.url;
                    image_public_id = uploadResult.public_id;
                }

                const dataToSend = {
                    id: Number(assetId),
                    ...formData,
                    image_url,
                    image_public_id,
                    category_id: Number(formData.category_id),
                    user_id: formData.user_id ? Number(formData.user_id) : null,
                };

                return await updateAsset(dataToSend).unwrap();
            })();

            // 3. Lanzamos el Toast con la promesa
            await toast.promise(updateProcess, {
                loading: 'Updating asset...',
                success: 'Asset updated successfully!',
                error: (err) => err.data?.message || 'Error updating asset',
            });

            navigate(`/assets/${assetId}`);

        } catch (err: any) {
            console.error("Failed to update asset:", err);
        }
    };

    const onDeleteAsset = async () => {
        if (confirmName !== asset.name) return; // Doble validación de seguridad

        protectAction(async () => {
            try {
                await toast.promise(deleteAsset({ id: asset.id }).unwrap(), {
                    loading: `Deleting ${asset.name}...`,
                    success: <b>{asset.name} permanently removed</b>,
                    error: (err) => {
                        // Si el backend devuelve un error específico, lo mostramos
                        const message = err.data?.message || `Could not delete ${asset.name}`;
                        return <span>{message}</span>;
                    },
                });

                setShowDeleteModal(false);
                navigate('/assets');
            } catch (err) {
                console.error("Failed to delete:", err);
            }
        });
    };

    return (
        <main className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Header de navegación */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium text-sm"
                >
                    <ArrowLeft size={18} />
                    Back to Inventory
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowDeleteModal(true)} // Abrir modal
                        className="flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-sm font-bold transition-all"
                    >
                        <Trash2 size={16} />
                        Delete Asset
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Lateral Izquierdo: Imagen y Estado Visual */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-3xl p-4 shadow-sm">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3 block ml-2">Current Image</label>
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center relative group">
                            <img
                                src={previewUrl || '/placeholder-image.png'} // Usa previewUrl que ya definiste
                                alt={formData.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {/* Al hacer clic en el botón, activamos el input oculto */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg"
                                >
                                    {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                                </button>
                            </div>
                            {/* Input oculto */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
                        <h3 className="font-bold mb-1">Editing Mode</h3>
                        <p className="text-blue-100 text-xs leading-relaxed">You are currently modifying <strong>{asset.name}</strong>. Remember to save your changes before leaving.</p>
                    </div>
                </div>

                {/* Lateral Derecho: Formulario de Edición */}
                <div className="lg:col-span-8">
                    <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
                        <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">General Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Asset Name</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
                                    type="text"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Serial Number</label>
                                <input
                                    name="serial_number"
                                    value={formData.serial_number}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-gray-700 uppercase"
                                    type="text"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChangeStatus}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer font-medium text-gray-700"
                                >
                                    <option value="available">Available</option>
                                    <option value="in-use">In Use</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="retired">Retired</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Value (USD)</label>
                                <input
                                    name="value"
                                    value={formData.value}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
                                    type="number"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Purchase Date</label>
                                <input
                                    name="purchase_date"
                                    value={formData.purchase_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
                                    type="date"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                <select
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
                                >
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Assign User</label>
                                <select
                                    name="user_id"
                                    value={formData.user_id}
                                    onChange={handleChangeAssignedUser}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
                                >
                                    <option value="">No user assigned</option>
                                    {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-xs text-red-600 font-bold">Error: {errorMsg}</p>
                            </div>
                        )}

                        <button
                            onClick={onSaveAsset}
                            disabled={isUpdating}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isUpdating ? 'Saving Changes...' : 'Update Asset Details'}
                        </button>
                    </section>
                </div>
            </div>
            {/* Modal de Confirmación Estilo GitHub */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <Trash2 size={32} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 mb-2">Are you absolutely sure?</h2>
                            <p className="text-gray-500 text-sm mb-6">
                                This action cannot be undone. This will permanently delete the asset
                                <strong className="text-gray-800"> {asset.name}</strong>.
                            </p>

                            <div className="w-full text-left space-y-3 mb-8">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                                    Type the asset name to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder={asset.name}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all font-medium"
                                />
                            </div>

                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={onDeleteAsset}
                                    disabled={confirmName !== asset.name || isDeleting}
                                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
                                    I understand the consequences, delete
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setConfirmName('');
                                    }}
                                    className="w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.1em] text-gray-500 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function uploadImage(selectedFile: File) {
    throw new Error('Function not implemented.');
}
