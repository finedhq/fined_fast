import { useParams } from "react-router-dom";
import { PRODUCT_ROUTES } from "../../lib/routeConfig";
import { AuthenticationGuard } from "../../components/AuthenticationGuard";
import ProductPage from "./ProductPage";
import NotFoundPage from "../NotFound/NotFoundPage";

// `/:productType` matches every single-segment URL, so check the slug before the
// auth guard: unknown paths get a 404 instead of a login bounce or a redirect.
export default function ProductRoute() {
  const { productType } = useParams();

  if (!PRODUCT_ROUTES[productType]) {
    return <NotFoundPage />;
  }

  return <AuthenticationGuard component={ProductPage} />;
}
