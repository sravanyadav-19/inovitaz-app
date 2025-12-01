import { useState } from 'react';
import { HiX, HiShieldCheck, HiCreditCard } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../api/payments';
import { useAuth } from '../hooks/useAuth';

const PaymentModal = ({ project, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Create order
      const orderResponse = await paymentsAPI.createOrder(project.id);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message);
      }

      const { razorpayOrderId, amount, keyId, isMockPayment } = orderResponse.data;

      if (isMockPayment) {
        // Handle mock payment
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSignature = 'mock_signature';

        const verifyResponse = await paymentsAPI.verifyPayment({
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        });

        if (verifyResponse.success) {
          toast.success('Payment successful! (Mock Mode)');
          onSuccess();
        }
      } else {
        // Real Razorpay payment
        const options = {
          key: keyId,
          amount: amount,
          currency: 'INR',
          name: 'Inovitaz',
          description: `Purchase: ${project.title}`,
          order_id: razorpayOrderId,
          handler: async (response) => {
            try {
              const verifyResponse = await paymentsAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyResponse.success) {
                toast.success('Payment successful!');
                onSuccess();
              }
            } catch (error) {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full fade-in">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiCreditCard className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-secondary-900">Complete Purchase</h2>
              <p className="text-secondary-600 text-sm mt-1">Secure payment powered by Razorpay</p>
            </div>

            {/* Project Info */}
            <div className="bg-secondary-50 rounded-xl p-4 mb-6">
              <div className="flex gap-4">
                <img
                  src={project.thumbnail || 'https://via.placeholder.com/80'}
                  alt={project.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <p className="text-sm text-secondary-500 mt-1">{project.category}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex justify-between items-center py-4 border-t border-b border-secondary-200 mb-6">
              <span className="text-secondary-600">Total Amount</span>
              <span className="text-2xl font-bold text-secondary-900">
                {formatPrice(project.price)}
              </span>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-3 mb-6">
              <HiShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Secure Transaction</p>
                <p className="text-xs text-green-600">
                  Your payment information is encrypted and secure.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatPrice(project.price)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;