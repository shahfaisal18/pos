
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Product, CartItem, SaleItem } from '../types';

const POS: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingSale, setProcessingSale] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { data, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if(existingItem.quantity < product.stock) {
                   return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                  );
                }
                return prevCart;
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, newQuantity: number) => {
        const product = products.find(p => p.id === productId);
        if (product && newQuantity > product.stock) {
            newQuantity = product.stock;
        }

        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== productId));
        } else {
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === productId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    };

    const totalAmount = useMemo(() => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cart]);

    const handleCompleteSale = async () => {
        if (cart.length === 0) return;
        setProcessingSale(true);
        setError(null);
        setSuccess(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to complete a sale.");

            const saleItems: SaleItem[] = cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
            }));

            // Step 1: Insert the sale record
            const { error: saleError } = await supabase.from('sales').insert([{
                user_id: user.id,
                items: saleItems,
                total_amount: totalAmount,
            }]);

            if (saleError) throw saleError;
            
            // Step 2: Update product stock
            const stockUpdates = cart.map(item => 
                supabase.from('products')
                .update({ stock: item.stock - item.quantity })
                .eq('id', item.id)
            );
            
            const results = await Promise.all(stockUpdates);
            const updateError = results.find(res => res.error);
            if(updateError) throw updateError.error;

            setSuccess('Sale completed successfully!');
            setCart([]);
            fetchProducts();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setProcessingSale(false);
            setTimeout(() => {
                setSuccess(null);
                setError(null);
            }, 5000);
        }
    };
    
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.stock > 0
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-8">
            {/* Products List */}
            <div className="w-2/3 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Products</h2>
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {loading ? <p>Loading...</p> : 
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto h-[calc(100%-8rem)] pr-2">
                    {filteredProducts.map(product => (
                        <div key={product.id} onClick={() => addToCart(product)} className="border rounded-lg p-4 cursor-pointer hover:shadow-xl hover:border-blue-500 transition-shadow duration-200 flex flex-col justify-between">
                           <div>
                            <h3 className="font-bold">{product.name}</h3>
                            <p className="text-gray-600">${product.price.toFixed(2)}</p>
                            </div>
                            <p className={`text-sm mt-2 ${product.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>
                                {product.stock} in stock
                            </p>
                        </div>
                    ))}
                </div>
                }
            </div>

            {/* Cart */}
            <div className="w-1/3 bg-white rounded-lg shadow-lg p-6 flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Sale</h2>
                <div className="flex-grow overflow-y-auto pr-2">
                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center mt-8">Cart is empty</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {cart.map(item => (
                                <li key={item.id} className="py-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">{item.name}</span>
                                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center mt-2">
                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 border rounded">-</button>
                                        <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)} className="w-16 text-center border-t border-b"/>
                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 border rounded">+</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-bold text-xl mb-4">
                        <span>Total:</span>
                        <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
                    {success && <div className="text-green-500 text-sm mb-2">{success}</div>}
                    <button 
                        onClick={handleCompleteSale}
                        disabled={cart.length === 0 || processingSale}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 transition-colors duration-200"
                    >
                        {processingSale ? 'Processing...' : 'Complete Sale'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
