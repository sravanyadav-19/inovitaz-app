import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isOrderHost } from '../utils/host';
import { HiChatAlt2 } from 'react-icons/hi';

/**
 * Floating support bubble — fixed bottom-right of the viewport, styled like
 * a chat/assistant bubble. Support only (cart stays in the main-site header).
 *
 * Visibility:
 *  - Main site (inovitaz.in): logged-in customers (role 'user') only —
 *    guests and admins use the Support link in the header instead.
 *  - Order host (order.inovitaz.in): everyone except admins — the header
 *    there is stripped to Track Build + Main Site, so this bubble is the
 *    only support channel (guests included).
 */
const SupportFab = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const onOrderHost = isOrderHost();

  if (isAdmin) return null;
  if (!onOrderHost && !isAuthenticated) return null;

  return (
    <Link
      to="/support"
      aria-label="Get support"
      title="Support"
      className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:bg-primary-dim transition-colors"
    >
      <HiChatAlt2 aria-hidden="true" className="w-6 h-6" />
    </Link>
  );
};

export default SupportFab;
