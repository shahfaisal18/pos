
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Product } from '../types';

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
    const [formState, setFormState] = useState({ name: '', price: '', stock: '' });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;
            setProducts(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const openModal = (product: Partial<Product> | null = null) => {
        setCurrentProduct(product);
        setFormState({
            name: product?.name || '',
            price: product?.price?.toString() || '',
            stock: product?.stock?.toString() || '',
        });
        setIsModalOpen(true);
        setError(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("You must be logged in to manage products.");
            return;
        }

        const productData = {
            name: formState.name,
            price: parseFloat(formState.price),
            stock: parseInt(formState.stock, 10),
            user_id: user.id
        };

        if (isNaN(productData.price) || isNaN(productData.stock)) {
            setError("Price and stock must be valid numbers.");
            return;
        }
        
        setLoading(true);
        let query;
        if (currentProduct?.id) {
            query = supabase.from('products').update(productData).eq('id', currentProduct.id);
        } else {
            query = supabase.from('products').insert([productData]);
        }

        const { error: upsertError } = await query;
        setLoading(false);
        
        if (upsertError) {
            setError(upsertError.message);
        } else {
            closeModal();
            fetchProducts();
        }
    };

    const handleDelete = async (productId: string) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        
        setLoading(true);
        const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
        setLoading(false);
        
        if (deleteError) {
            setError(deleteError.message);
        } else {
            fetchProducts();
        }
    };

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Products Inventory</h1>
                <button onClick={() => openModal()} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
                    Add Product
                </button>
            </div>
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
            
            {loading && products.length === 0 ? (
                 <p className="text-center text-gray-500">Loading products...</p>
            ) : (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{product.name}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">${product.price.toFixed(2)}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{product.stock}</td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <button onClick={() => openModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{currentProduct?.id ? 'Edit Product' : 'Add New Product'}</h3>
                            <form onSubmit={handleSubmit} className="mt-2 px-7 py-3 space-y-4">
                                <input type="text" name="name" placeholder="Product Name" value={formState.name} onChange={handleInputChange} required className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"/>
                                <input type="number" name="price" placeholder="Price" value={formState.price} onChange={handleInputChange} required min="0" step="0.01" className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"/>
                                <input type="number" name="stock" placeholder="Stock" value={formState.stock} onChange={handleInputChange} required min="0" step="1" className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"/>
                                <div className="items-center px-4 py-3">
                                    <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-blue-300">
                                        {loading ? 'Saving...' : 'Save Product'}
                                    </button>
                                </div>
                            </form>
                            <button onClick={closeModal} className="absolute top-0 right-0 mt-4 mr-4 text-gray-400 hover:text-gray-600">
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
