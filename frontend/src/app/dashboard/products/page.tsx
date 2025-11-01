'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { updateProduct, deleteProduct } from '@/lib/api';
import { PlusCircle, Pencil, Trash } from '@phosphor-icons/react';
import Modal from '@/components/Modal';

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
}

const ProductRow = ({ product, onEdit, onDelete }: { product: Product, onEdit: (product: Product) => void, onDelete: (product: Product) => void }) => (
    <tr className="border-b border-gray-800 hover:bg-gray-800">
        <td className="p-4">{product.name}</td>
        <td className="p-4 truncate max-w-sm">{product.description}</td>
        <td className="p-4">${product.price.toFixed(2)}</td>
        <td className="p-4">{product.stock}</td>
        <td className="p-4">
            <div className="flex gap-2">
                <button onClick={() => onEdit(product)} className="p-2 text-gray-400 hover:text-white" title="Edit Product">
                    <Pencil size={20} />
                </button>
                <button onClick={() => onDelete(product)} className="p-2 text-red-500 hover:text-red-400" title="Delete Product">
                    <Trash size={20} />
                </button>
            </div>
        </td>
    </tr>
);

export default function ProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');

    const fetchProducts = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await api.get('/products/');
            setProducts(response.data);
        } catch (err) {
            setError('Failed to fetch products.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const openAddModal = () => {
        setModalMode('add');
        setCurrentProduct(null);
        setName('');
        setDescription('');
        setPrice('');
        setStock('');
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setModalMode('edit');
        setCurrentProduct(product);
        setName(product.name);
        setDescription(product.description || '');
        setPrice(String(product.price));
        setStock(String(product.stock));
        setIsModalOpen(true);
    };

    const handleDeleteClick = (product: Product) => {
        if (window.confirm(`Are you sure you want to delete the product "${product.name}"? This action cannot be undone.`)) {
            handleDeleteProduct(product.id);
        }
    };

    const handleDeleteProduct = async (productId: number) => {
        try {
            await deleteProduct(productId);
            fetchProducts(); // Refresh the list
        } catch (err) {
            console.error('Failed to delete product', err);
            alert('Failed to delete product. It might be in use in an order.');
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!token) return;

        const productData = {
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
        };

        try {
            if (modalMode === 'edit' && currentProduct) {
                // Update product
                await updateProduct(currentProduct.id, productData);
            } else {
                // Add new product
                await api.post('/products/', productData);
            }
            fetchProducts(); // Refresh the list
            setIsModalOpen(false);
        } catch (err) {
            console.error(`Failed to ${modalMode} product`, err);
            // Handle error display to user
        }
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Manage Products</h1>
                <button 
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    <PlusCircle size={24} />
                    Add Product
                </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <table className="w-full text-left text-gray-300">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Description</th>
                            <th className="p-4">Price</th>
                            <th className="p-4">Stock</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center p-8">Loading products...</td></tr>
                        ) : error ? (
                            <tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>
                        ) : products.length > 0 ? (
                            products.map(product => <ProductRow key={product.id} product={product} onEdit={openEditModal} onDelete={handleDeleteClick} />)
                        ) : (
                            <tr><td colSpan={5} className="text-center p-8">No products found. Add your first product!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal title={modalMode === 'edit' ? 'Edit Product' : 'Add New Product'} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleFormSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-gray-400 mb-2">Product Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block text-gray-400 mb-2">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500"></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="price" className="block text-gray-400 mb-2">Price</label>
                        <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500" required step="0.01" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="stock" className="block text-gray-400 mb-2">Stock</label>
                        <input type="number" id="stock" value={stock} onChange={e => setStock(e.target.value)} className="w-full p-2 bg-gray-800 rounded-lg border border-gray-700 focus:outline-none focus:border-indigo-500" required />
                    </div>
                    <div className="flex justify-end">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg">
                            {modalMode === 'edit' ? 'Save Changes' : 'Add Product'}
                        </button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}
