
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Sale } from '../types';

const Sales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error: fetchError } = await supabase
                .from('sales')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setSales(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    return (
        <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Sales History</h1>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            {loading ? (
                <p className="text-center text-gray-500">Loading sales history...</p>
            ) : (
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                     <table className="min-w-full leading-normal">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items Sold</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map(sale => (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        {new Date(sale.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <ul>
                                            {sale.items.map((item, index) => (
                                                <li key={index}>
                                                    {item.quantity}x {item.name} @ ${item.price.toFixed(2)}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-bold">
                                        ${sale.total_amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                             {sales.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500">No sales recorded yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Sales;
