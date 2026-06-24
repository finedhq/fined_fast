import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { PRODUCT_ROUTES } from '../../lib/routeConfig';
import GenericProductList from './GenericProductList';

export default function ProductPage() {
  const { productType } = useParams();
  const config = PRODUCT_ROUTES[productType];

  // If the URL doesn't exist in our config, redirect to policies or 404
  if (!config) {
    return <Navigate to="/policies" replace />;
  }

  return (
    <GenericProductList
      dataKey={config.dataKey}
      fetchKey={config.fetchKey}
    />
  );
}
