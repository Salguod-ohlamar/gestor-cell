import React, { useState } from 'react';
import { PlusCircle, Edit, Trash2, Image as ImageIcon, Link as LinkIcon, Type, FileText, ChevronsUpDown, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import imageCompression from 'browser-image-compression';

const BannerManager = ({ banners, onAdd, onUpdate, onDelete, currentUser }) => {
    const [editingBanner, setEditingBanner] = useState(null); // Can be a new banner object or an existing one
    const [isFormVisible, setIsFormVisible] = useState(false);

    const handleOpenForm = (banner = null) => {
        setEditingBanner(banner || { title: '', text: '', image_url: '', link_url: '', is_active: true, sort_order: 0 });
        setIsFormVisible(true);
    };

    const handleCloseForm = () => {
        setIsFormVisible(false);
        setEditingBanner(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditingBanner(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingBanner(prev => ({ ...prev, image_url: reader.result }));
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Erro ao comprimir imagem:', error);
            toast.error('Falha ao processar a imagem.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editingBanner.image_url) {
            toast.error('A imagem do banner é obrigatória.');
            return;
        }

        let success;
        if (editingBanner.id) {
            success = await onUpdate(editingBanner.id, editingBanner, currentUser.name);
        } else {
            success = await onAdd(editingBanner, currentUser.name);
        }

        if (success) {
            handleCloseForm();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-center text-green-400">Gerenciar Banners da Home</h2>
                {!isFormVisible && (
                    <button onClick={() => handleOpenForm()} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                        <PlusCircle size={18} /> Adicionar Banner
                    </button>
                )}
            </div>

            {isFormVisible && editingBanner && (
                <div className="bg-gray-800 p-6 rounded-lg mb-8 animate-fade-in">
                    <h3 className="text-xl font-semibold text-white mb-4">{editingBanner.id ? 'Editar Banner' : 'Novo Banner'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><Type size={16} /> Título (opcional)</label>
                                <input type="text" name="title" value={editingBanner.title} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><LinkIcon size={16} /> Link (opcional)</label>
                                <input type="text" name="link_url" value={editingBanner.link_url} onChange={handleInputChange} placeholder="Ex: /#produtos" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><FileText size={16} /> Texto da promoção (opcional)</label>
                            <textarea name="text" value={editingBanner.text} onChange={handleInputChange} rows="2" className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><ImageIcon size={16} /> Imagem do Banner</label>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700" />
                            {editingBanner.image_url && <img src={editingBanner.image_url} alt="Preview" className="mt-4 h-24 w-auto object-contain rounded-lg bg-gray-900" />}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2"><ChevronsUpDown size={16} /> Ordem de Exibição</label>
                                <input type="number" name="sort_order" value={editingBanner.sort_order} onChange={handleInputChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg" />
                            </div>
                            <label className="flex items-center gap-2 mt-5">
                                <input type="checkbox" name="is_active" checked={editingBanner.is_active} onChange={handleInputChange} className="form-checkbox h-5 w-5 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500" />
                                Ativo (visível no site)
                            </label>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button type="button" onClick={handleCloseForm} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg">Salvar Banner</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {banners.map(banner => (
                    <div key={banner.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                            <img src={banner.image_url} alt={banner.title} className="w-24 h-12 object-cover rounded-md bg-gray-700" />
                            <div>
                                <p className="font-semibold text-white">{banner.title || 'Banner sem título'}</p>
                                <p className="text-sm text-gray-400">{banner.link_url || 'Sem link'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${banner.is_active ? 'bg-green-500 text-black' : 'bg-gray-600 text-white'}`}>
                                {banner.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-sm text-gray-400" title="Ordem">#{banner.sort_order}</span>
                            <button onClick={() => handleOpenForm(banner)} className="text-blue-400 hover:text-blue-300" title="Editar"><Edit size={18} /></button>
                            <button onClick={() => onDelete(banner.id, currentUser.name)} className="text-red-400 hover:text-red-300" title="Excluir"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BannerManager;