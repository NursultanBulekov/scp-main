'use client';

import { useState, useEffect, FormEvent } from 'react';
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingCartSimple, MinusCircle, PlusCircle } from '@phosphor-icons/react';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
}

interface Catalog {
    id: number;
    name: string;
    products: Product[];
    supplier_id: number;
}

interface OrderItem {
    product_id: number;
    quantity: number;
}

export default function CreateOrderPage() {
    const { token, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const catalogId = searchParams.get('catalogId');
    const supplierId = searchParams.get('supplierId');

    const [catalog, setCatalog] = useState<Catalog | null>(null);
    const [selectedItems, setSelectedItems] = useState<Record<number, number>>({}); // productId -> quantity
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            if (!token || !catalogId) {
                setError("Catalog ID not provided or not authenticated.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await api.get(`/catalogs/${catalogId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCatalog(response.data);
            } catch (err) {
                setError('Failed to fetch catalog.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCatalog();
    }, [token, catalogId]);

    const handleQuantityChange = (productId: number, change: number) => {
        setSelectedItems(prev => {
            const currentQuantity = prev[productId] || 0;
            const newQuantity = Math.max(0, currentQuantity + change);
            if (newQuantity === 0) {
                const newItems = { ...prev };
                delete newItems[productId];
                return newItems;
            }
            return { ...prev, [productId]: newQuantity };
        });
    };

    const handleCreateOrder = async (e: FormEvent) => {
        e.preventDefault();
        if (!token || !user?.consumer_id || !supplierId || !catalog) return;

        const items: OrderItem[] = Object.entries(selectedItems)
            .filter(([, quantity]) => quantity > 0)
            .map(([productId, quantity]) => ({
                product_id: parseInt(productId, 10),
                quantity: quantity,
            }));

        if (items.length === 0) {
            alert("Please add at least one item to your order.");
            return;
        }

        try {
            await api.post('/orders/', { supplier_id: parseInt(supplierId, 10), items }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Order created successfully!");
            router.push('/dashboard/orders'); // Redirect to orders list
        } catch (err: any) {
            console.error("Failed to create order", err);
            alert(err.response?.data?.detail || "Failed to create order");
        }
    };

    const totalCost = Object.entries(selectedItems).reduce((sum, [productId, quantity]) => {
        const product = catalog?.products.find(p => p.id === parseInt(productId, 10));
        return sum + (product ? product.price * quantity : 0);
    }, 0);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="text-center p-8 text-white">Loading catalog...</div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="text-center p-8 text-red-500">Error: {error}</div>
            </DashboardLayout>
        );
    }

    if (!catalog) {
        return (
            <DashboardLayout>
                <div className="text-center p-8 text-white">Catalog not found.</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold text-white mb-6">Order from {catalog.name}</h1>
            <form onSubmit={handleCreateOrder} className="bg-gray-900 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Products Available</h2>
                <div className="space-y-4 mb-6">
                    {catalog.products.length === 0 ? (
                        <p className="text-gray-400">No products in this catalog.</p>
                    ) : (
                        catalog.products.map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-lg">
                                <div>
                                    <p className="font-semibold text-white">{product.name} - ${product.price.toFixed(2)}</p>
                                    <p className="text-gray-400 text-sm">Stock: {product.stock}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => handleQuantityChange(product.id, -1)}
                                        disabled={!selectedItems[product.id] || selectedItems[product.id] === 0}
                                        className="p-1 text-red-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <MinusCircle size={24} weight="bold" />
                                    </button>
                                    <span className="text-white font-semibold w-8 text-center">
                                        {selectedItems[product.id] || 0}
                                    </span>
                                    <button 
                                        type="button"
                                        onClick={() => handleQuantityChange(product.id, 1)}
                                        disabled={(selectedItems[product.id] || 0) >= product.stock}
                                        className="p-1 text-green-400 hover:text-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <PlusCircle size={24} weight="bold" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="text-right text-white text-xl font-bold mb-6">
                    Total: ${totalCost.toFixed(2)}
                </div>

                <button 
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg text-lg"
                    disabled={Object.keys(selectedItems).length === 0}
                >
                    <ShoppingCartSimple size={24} /> Place Order
                </button>
            </form>
        </DashboardLayout>
    );
}
