import { useLocation, useParams } from "react-router-dom";

/** Returns role-agnostic base like:
 *  - admin:     /admin/shop/:shopId
 *  - worker:    /dashboard/:shopId
 */
export default function useEditorBase() {
  const { shopId } = useParams();
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith("/admin");
  const base = isAdminRoute ? `/admin/shop/${shopId}` : `/dashboard/${shopId}`;
  return { base, isAdminRoute, shopId };
}
