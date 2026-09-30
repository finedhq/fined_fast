import React from 'react';
import { useParams } from 'react-router-dom';
import { PRODUCT_ROUTES } from '../../lib/routeConfig';
import GenericProductList from './GenericProductList';

export default function ProductPage() {
  const { productType } = useParams();
  const config = PRODUCT_ROUTES[productType];

  // Unknown slugs never get here: ProductRoute renders the 404 page for them
  if (!config) return null;

  return (
    <GenericProductList
      dataKey={config.dataKey}
      fetchKey={config.fetchKey}
    />
  );
}
