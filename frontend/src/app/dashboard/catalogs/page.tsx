'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { updateCatalog, deleteCatalog } from '@/lib/api';
import { PlusCircle, Package, ShoppingCartSimple, Pencil, Trash } from '@phosphor-icons/react';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';

interface Product {
    id: number;
    name: string;
    price: number;
}

interface Catalog {
    id: number;
    name: string;
    products: Product[];
    supplier_id?: number;
    supplier_name?: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Link {
    id: number;
    supplier_id: number;
    consumer_id: number;
    status: 'pending' | 'accepted' | 'rejected' | 'blocked';
}

const CatalogCard = ({ catalog, onOrderClick, onEditClick, onDeleteClick }: { catalog: Catalog, onOrderClick?: (catalog: Catalog) => void, onEditClick?: (catalog: Catalog) => void, onDeleteClick?: (catalog: Catalog) => void }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between h-full">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold mb-2 text-white">{catalog.name}</h3>
                <div className="flex gap-2">
                    {onEditClick && (
                        <button onClick={() => onEditClick(catalog)} className="p-2 text-gray-400 hover:text-white" title="Edit Catalog">
                            <Pencil size={20} />
                        </button>
                    )}
                    {onDeleteClick && (
                        <button onClick={() => onDeleteClick(catalog)} className="p-2 text-red-500 hover:text-red-400" title="Delete Catalog">
                            <Trash size={20} />
                        </button>
                    )}
                </div>
            </div>
            {catalog.supplier_name && <p className="text-gray-400 mb-2">From: {catalog.supplier_name}</p>}
            <p className="text-gray-400 mb-4">Products: {catalog.products.length}</p>
            <div className="flex flex-wrap gap-2">
                {catalog.products.map(product => (
                    <span key={product.id} className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <Package size={16} /> {product.name} (${product.price.toFixed(2)})
                    </span>
                ))}
            </div>
        </div>
        <div className="mt-4 flex justify-end">
            {onOrderClick && (
                <button 
                    onClick={() => onOrderClick(catalog)}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg text-sm"
                >
                    <ShoppingCartSimple size={16} /> Order from Catalog
                </button>
            )}
        </div>
    </div>
);

export default function CatalogsPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [catalogs, setCatalogs] = useState<Catalog[]>([]);
    const [products, setProducts] = useState<Product[]>([]); // All available products for selection
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentCatalog, setCurrentCatalog] = useState<Catalog | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

    const isSupplier = user?.role.startsWith('supplier');
    const isConsumer = user?.role === 'consumer';

    const fetchCatalogsAndProducts = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            if (isSupplier && user?.supplier_id) {
                const [catalogsResponse, productsResponse] = await Promise.all([
                    api.get('/catalogs/'),
                    api.get('/products/')
                ]);
                setCatalogs(catalogsResponse.data);
                setProducts(productsResponse.data);
            } else if (isConsumer && user?.consumer_id) {
                const linksResponse = await api.get(`/entities/consumers/${user.consumer_id}/links`);
                const acceptedLinks = linksResponse.data.filter((link: Link) => link.status === 'accepted');

                const fetchedCatalogs: Catalog[] = [];
                for (const link of acceptedLinks) {
                    const supplierResponse = await api.get(`/entities/suppliers/${link.supplier_id}`);
                    const supplierName = supplierResponse.data.name;
                    const supplierCatalogsResponse = await api.get(`/catalogs/?supplier_id=${link.supplier_id}`);
                    supplierCatalogsResponse.data.forEach((cat: Catalog) => {
                        fetchedCatalogs.push({ ...cat, supplier_name: supplierName });
                    });
                }
                setCatalogs(fetchedCatalogs);
                setProducts([]);
            } else {
                setError("Not authorized to view this page.");
            }
        } catch (err) {
            setError('Failed to fetch catalogs or products.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogsAndProducts();
    }, [token, user?.role, user?.supplier_id, user?.consumer_id]);

    const handleProductSelection = (productId: number) => {
        setSelectedProducts(prev => 
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const handleOrderFromCatalog = (catalog: Catalog) => {
        router.push(`/dashboard/orders/create?catalogId=${catalog.id}&supplierId=${catalog.supplier_id}`);
    };
    
    const openAddModal = () => {
        setModalMode('add');
        setCurrentCatalog(null);
        setName('');
        setSelectedProducts([]);
        setIsModalOpen(true);
    };

    const openEditModal = (catalog: Catalog) => {
        setModalMode('edit');
        setCurrentCatalog(catalog);
        setName(catalog.name);
        setSelectedProducts(catalog.products.map(p => p.id));
        setIsModalOpen(true);
    };

    const handleDeleteClick = (catalog: Catalog) => {
        if(window.confirm(`Are you sure you want to delete the catalog "${catalog.name}"? This will not delete the products within it.`)) {
            handleDeleteCatalog(catalog.id);
        }
    };

    const handleDeleteCatalog = async (catalogId: number) => {
        try {
            await deleteCatalog(catalogId);
            fetchCatalogsAndProducts();
        } catch (err) {
            console.error('Failed to delete catalog', err);
            alert('Failed to delete catalog.');
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;

        const catalogData = {
            name,
            product_ids: selectedProducts,
        };

        try {
            if (modalMode === 'edit' && currentCatalog) {
                await updateCatalog(currentCatalog.id, catalogData);
            } else {
                await api.post('/catalogs/', catalogData);
            }
            fetchCatalogsAndProducts(); // Refresh the list
            setIsModalOpen(false);
        } catch (err) {
            console.error(`Failed to ${modalMode} catalog`, err);
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">{isSupplier ? 'Manage Catalogs' : 'Browse Catalogs'}</h1>
                {isSupplier && (
                    <button 
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
                    >
                        <PlusCircle size={24} />
                        Create Catalog
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center p-8 text-white">Loading catalogs...</div>
                ) : error ? (
                    <div className="col-span-full text-center p-8 text-red-500">Error: {error}</div>
                ) : catalogs.length > 0 ? (
                    catalogs.map(catalog => 
                        <CatalogCard 
                            key={catalog.id} 
                            catalog={catalog} 
                            onOrderClick={isConsumer ? handleOrderFromCatalog : undefined}
                            onEditClick={isSupplier ? openEditModal : undefined}
                            onDeleteClick={isSupplier ? handleDeleteClick : undefined}
                        />
                    )
                ) : (
                    <div className="col-span-full text-center p-8 text-white">
                        {isSupplier ? 'No catalogs found. Create your first catalog!' : 'No catalogs from linked suppliers.'}
                    </div>
                )}
            </div>

            {isSupplier && (
                <Modal title={modalMode === 'edit' ? 'Edit Catalog' : 'Create New Catalog'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleFormSubmit}>
                        <div className="mb-4">
                            <label htmlFor="catalogName" className="block text-gray-400 mb-2">Catalog Name</label>
                            <input type="text" id="catalogName" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-400 mb-2">Select Products</label>
                            <div className="max-h-40 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700 p-2">
                                {products.length === 0 ? (
                                    <p className="text-gray-500">No products available. Add some products first!</p>
                                ) : (
                                    products.map(product => (
                                        <div key={product.id} className="flex items-center py-1">
                                            <input
                                                type="checkbox"
                                                id={`product-${product.id}`}
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => handleProductSelection(product.id)}
                                                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                                            />
                                            <label htmlFor={`product-${product.id}`} className="ml-2 text-white">{product.name}</label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                                {modalMode === 'edit' ? 'Save Changes' : 'Create Catalog'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </DashboardLayout>
    );
}
