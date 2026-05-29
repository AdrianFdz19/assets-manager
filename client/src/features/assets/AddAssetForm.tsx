import React, { useEffect, useState } from 'react';
import { useAddAssetMutation, useUploadImageMutation } from './assetsSlice';
import { useAppSelector } from '../../app/hooks';
import { selectAllCategories, useGetCategoriesQuery } from '../categories/categoriesSlice';
import { selectAllUsers, useGetUsersQuery } from '../users/usersSlice';
import { useDemoMode } from '../../hooks/useDemoMode';
import DemoRestrictionModal from '../../components/DemoRestrictionModal';
import toast from 'react-hot-toast';

interface AddAssetFormProps {
    onSuccess?: () => void;
}

export default function AddAssetForm({ onSuccess }: AddAssetFormProps) {
    const { isRestrictionOpen, setIsRestrictionOpen, protectAction } = useDemoMode();
    // 1. Estados iniciales (Mantenemos los tipos de tu objeto Asset)
    const [name, setName] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [status, setStatus] = useState('available'); // Valor por defecto
    const [value, setValue] = useState('');
    const [purchaseDate, setPurchaseDate] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [userId, setUserId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const { isSuccess: isUsersSuccess, isError: isUsersError, isLoading: isUsersLoading } = useGetUsersQuery();
    const usersList = useAppSelector(selectAllUsers);

    const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation();
    const [addAsset, { isLoading }] = useAddAssetMutation();

    // Función para manejar el cambio del input file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setFile(e.target.files[0]);
    };

    // Traer la información de las categorias
    const {
        isSuccess
    } = useGetCategoriesQuery();

    const categories = useAppSelector(selectAllCategories);

    // Validación simple para el botón
    const canSave = [name, serialNumber, value, categoryId].every(Boolean);

    const isPending = isLoading;
    const canSubmit = canSave && !isPending;

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isLoading || isPending || isUploading) {
                e.preventDefault();
                alert('You cant do that.') // El navegador mostrará un cuadro de diálogo estándar
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isLoading, isPending, isUploading]);

    // Changes inputs
    const handleChangeStatus = (e: any) => {
        let status = e.target.value;
        if (status !== 'in-use') {
            setUserId('');
        }
        setStatus(status);
    }

    const handleChangeAssignedUser = (e: any) => {
        let userId = e.target.value;
        if (userId) {
            setStatus('in-use');
        }
        setUserId(userId);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setErrorMsg('');
        let image_url = null;
        let image_public_id = null;

        if (canSubmit) {
            setErrorMsg('');

            try {
                // Verificacion de status
                // 1. Si hay un usuario, el status DEBE ser 'in-use'
                if (userId && status !== 'in-use') {
                    setErrorMsg('Assets assigned to a user must have "In Use" status.');
                    return;
                }

                // 2. Si el status es 'in-use', DEBE haber un usuario
                if (status === 'in-use' && !userId) {
                    setErrorMsg('In-use assets require an assignee.');
                    return;
                }

                if ((status === 'maintenance' || status === 'retired' || status === 'available') && userId) {
                    setErrorMsg(`Assets in "${status}" status cannot be assigned to a user.`);
                    return;
                }

                const submitProcess = (async () => {
                    // PASO 1: Si hay un archivo, subirlo primero
                    if (file) {
                        const formData = new FormData();
                        formData.append('image', file); // 'image' debe coincidir con upload.single('image')

                        const uploadResult = await uploadImage(formData).unwrap();
                        image_url = uploadResult.url;
                        image_public_id = uploadResult.public_id;
                    }

                    // PASO 2: Crear el asset con la URL recibida
                    const newAsset = {
                        name,
                        serial_number: serialNumber,
                        status,
                        value,
                        purchase_date: purchaseDate,
                        category_id: Number(categoryId),
                        user_id: userId ? Number(userId) : null,
                        image_url,        // Enviamos la URL a Postgres
                        image_public_id   // Enviamos el ID a Postgres
                    };

                    const result = await addAsset(newAsset).unwrap();

                    // SI TODO SALE BIEN:
                    resetForm();
                    if (onSuccess) onSuccess(); // Cerramos el modal
                    return result;
                })();

                toast.promise(submitProcess, {
                    loading: 'Registering new asset...',
                    success: (data) => (
                        <span>
                            <b>{data.name}</b> successfully added to inventory
                        </span>
                    ),
                    error: (err) => {
                        // Manejo de error inteligente: si es un error de validación o de red
                        const errorMessage = err.data?.message || 'Could not save asset. Please try again.';
                        return <b>{errorMessage}</b>;
                    },
                });

            } catch (err: any) {
                setErrorMsg(err.data?.message || 'Error processing request');
            }
        }
    };

    const resetForm = () => {
        setName('');
        setSerialNumber('');
        setStatus('available');
        setValue('');
        setPurchaseDate('');
        setCategoryId('');
        setUserId('');
        setFile(null);
    };

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // protectAction decidirá si ejecuta el submit o muestra el modal
        protectAction(() => {
            handleSubmit();
        });
    };

    // Estilos constantes
    const styles: { [key: string]: React.CSSProperties } = {
        container: {
            maxWidth: '600px',
            margin: '20px auto',
            padding: '25px',
            backgroundColor: '#2d333b', // Estilo dark mode profesional
            borderRadius: '12px',
            color: '#adbac7',
            fontFamily: 'sans-serif'
        },
        formGroup: {
            marginBottom: '15px',
            display: 'flex',
            flexDirection: 'column'
        },
        label: {
            marginBottom: '5px',
            fontSize: '14px',
            fontWeight: '600'
        },
        input: {
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #444c56',
            backgroundColor: '#22272e',
            color: '#adbac7',
            outline: 'none'
        },
        select: {
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #444c56',
            backgroundColor: '#22272e',
            color: '#adbac7',
            cursor: 'pointer'
        },
        button: {
            marginTop: '20px',
            padding: '12px',
            backgroundColor: canSave ? '#347d39' : '#2d333b',
            color: 'white',
            border: canSave ? 'none' : '1px solid #444c56',
            borderRadius: '6px',
            cursor: canSave ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '16px'
        }
    };

    return (
        <form onSubmit={onFormSubmit} className="space-y-6">
            {/* Fila 1: Nombre y Serial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Asset Name</label>
                    <input
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dell UltraSharp 27"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Serial Number</label>
                    <input
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono text-sm text-slate-700"
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="SN-XXXX-XXXX"
                    />
                </div>
            </div>

            {/* Fila 2: Status, Value y Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-slate-700 cursor-pointer"
                        value={status}
                        onChange={handleChangeStatus}
                    >
                        <option value="available">Available</option>
                        <option value="in-use">In Use</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Value (USD)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input
                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700"
                            type="number"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Purchase Date</label>
                    <input
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700"
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Fila 3: Category y User */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Category</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 cursor-pointer"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">Select Category</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Assign User</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 cursor-pointer"
                        value={userId}
                        onChange={handleChangeAssignedUser}
                    >
                        <option value="">None / Storage</option>
                        {usersList.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Foto y Errores */}
            <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Asset Photo</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-600 cursor-pointer"
                />
            </div>

            {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold animate-shake">
                    ⚠️ {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg 
                    ${canSubmit
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
                {isLoading ? 'Creating...' : 'Create Asset'}
            </button>

            {isRestrictionOpen && (
                <DemoRestrictionModal onClose={() => setIsRestrictionOpen(false)} />
            )}
        </form>
    );
}