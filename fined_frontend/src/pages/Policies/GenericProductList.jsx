'use client'

import React, { useEffect, useState } from 'react';
import { useMessagesStore } from '../../store/bankStore'; // Adjust path

// Helper types to make TypeScript happy with dynamic keys




const GenericProductList = ({ dataKey, fetchKey }) => {
  // 1. Dynamic Selection: We select the specific slice of the store based on props
  const productList = useMessagesStore((state) => state[dataKey]);
  const fetchData = useMessagesStore((state) => state[fetchKey]);

  // Type assertion because Zustand selector might return unknown for dynamic keys
  // We tell TS: "Trust me, this data is a list of BankProducts"
  const products = (Array.isArray(productList) ? productList : []);
  
  // We tell TS: "Trust me, this function is an async fetcher with NO arguments"
  const fetchAction = fetchData;

  const [activeTab, setActiveTab] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Call the specific fetch function for this route
    const load = async () => {
      setLoading(true);
      await fetchAction();
      setLoading(false);
    };
    load();
  }, [fetchAction]);

  const tabNames = ['Know Before You Invest', 'Key Features', 'Eligibility'];

  // ... (Keep your getTabContent logic exactly as is)
  const getTabContent = (product, tab) => {
    switch (tab) {
      case 'Know Before You Invest':
        return product.description;
      case 'Key Features':
        return Array.isArray(product.features) ? (
          <ul className="list-disc pl-5 space-y-1">
            {product.features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        ) : (
          product.features
        );
      case 'Eligibility':
        return Array.isArray(product.eligibility) ? (
          <ul className="list-disc pl-5 space-y-1">
            {product.eligibility.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ) : (
          product.eligibility
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="w-full min-h-screen bg-gray-100 p-6">
      {products.map((product, index) => {
        const selectedTab = activeTab[index] || tabNames[0];
        return (
          <div
            key={index}
            className="flex flex-col lg:flex-row bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300 my-10 w-full max-w-screen-2xl mx-auto"
          >
            {/* Sidebar */}
            <div className="lg:w-1/4 bg-gray-100 p-6 border-r border-gray-300">
              <h2 className="text-2xl font-semibold text-blue-900 mb-1">{product.product_name}</h2>
              <p className="text-sm text-gray-600 mb-5">{product.bank_name}</p>
              <div className="flex flex-col space-y-2">
                {tabNames.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab({ ...activeTab, [index]: tab })}
                    className={`text-left px-4 py-2 rounded-md font-medium ${selectedTab === tab
                      ? 'bg-yellow-400 text-black shadow-sm'
                      : 'hover:bg-gray-200 text-blue-700'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4 p-8 flex flex-col justify-between">
              {/* Yellow Info Box */}
              <div className="bg-yellow-100 border border-yellow-300 p-5 rounded-md mb-6">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{selectedTab}</h3>
                <div className="text-gray-800 text-sm leading-relaxed">
                  {getTabContent(product, selectedTab)}
                </div>
              </div>

              {/* Action Button & Source */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <a
                  href={product.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md text-sm font-semibold transition"
                >
                  Go To Official Bank Page
                </a>
                <p className="text-xs text-gray-500 mt-3 sm:mt-0">
                  Source: {product.source_url}
                </p>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 border-t pt-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <strong>Disclaimer:</strong> FinEd is NOT affiliated with or endorsed by any bank listed above. The
                  data is based on public information from official sources for educational purposes only. Please verify
                  all financial decisions directly with the bank.
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GenericProductList;
