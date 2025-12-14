// src/components/PaymentModal.jsx
import { useState } from 'react';
import { 
  HiX, 
  HiShieldCheck, 
  HiCreditCard,
  HiTag,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { paymentsAPI } from '../api/payments';
import { useAuth } from '../hooks/useAuth';

const PaymentModal = ({ project, isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // ADDED: Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ADDED: Calculate final price with discount
  const calculateFinalPrice = () => {
    let finalPrice = project.price;
    
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        finalPrice = finalPrice - (finalPrice * appliedCoupon.discount_value / 100);
      } else {
        finalPrice = finalPrice - appliedCoupon.discount_value;
      }
      
      // Ensure price doesn't go below 0
      finalPrice = Math.max(0, finalPrice);
    }
    
    return Math.round(finalPrice);
  };

  // ADDED: Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/coupons/validate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     code: couponCode,
      //     project_id: project.id,
      //     amount: project.price 
      //   })
      // });
      // const data = await response.json();

      // TEMPORARY: Mock coupon validation
      const mockCoupons = {
        'FIRST20': { code: 'FIRST20', discount_type: 'percentage', discount_value: 20, description: '20% off for first-time buyers' },
        'SAVE50': { code: 'SAVE50', discount_type: 'fixed', discount_value: 50, description: '₹50 off on any project' },
        'STUDENT25': { code: 'STUDENT25', discount_type: 'percentage', discount_value: 25, description: '25% student discount' },
      };

      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay

      const coupon = mockCoupons[couponCode.toUpperCase()];

      if (coupon) {
        setAppliedCoupon(coupon);
        toast.success(`Coupon "${coupon.code}" applied!`);
      } else {
        setCouponError('Invalid or expired coupon code');
      }
    } catch (error) {
      setCouponError('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // ADDED: Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast.success('Coupon removed');
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      // MODIFIED: Include coupon in order creation
      const orderResponse = await paymentsAPI.createOrder(
        project.id,
        appliedCoupon?.code // Pass coupon code if applied
      );
      
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

  const finalPrice = calculateFinalPrice();
  const discount = project.price - finalPrice;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full fade-in">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-600 transition-colors z-10"
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

            {/* ADDED: Coupon Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Have a coupon code?
              </label>
              
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <HiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Enter coupon code"
                      className={`input pl-10 ${couponError ? 'border-red-300 focus:ring-red-500' : ''}`}
                      disabled={couponLoading}
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn btn-secondary px-6"
                  >
                    {couponLoading ? (
                      <div className="w-4 h-4 border-2 border-secondary-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Apply'
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <HiCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 text-sm">
                          {appliedCoupon.code} applied
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          {appliedCoupon.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-green-600 hover:text-green-700 p-1"
                    >
                      <HiXCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {couponError && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <HiXCircle className="w-4 h-4" />
                  {couponError}
                </p>
              )}

              {/* ADDED: Available Coupons Hint */}
              {!appliedCoupon && !couponError && (
                <div className="mt-2 text-xs text-secondary-500">
                  💡 Try: <code className="bg-secondary-100 px-1.5 py-0.5 rounded">FIRST20</code>,{' '}
                  <code className="bg-secondary-100 px-1.5 py-0.5 rounded">SAVE50</code>, or{' '}
                  <code className="bg-secondary-100 px-1.5 py-0.5 rounded">STUDENT25</code>
                </div>
              )}
            </div>

            {/* MODIFIED: Price Breakdown */}
            <div className="space-y-3 py-4 border-t border-b border-secondary-200 mb-6">
              <div className="flex justify-between items-center text-secondary-600">
                <span>Original Price</span>
                <span>{formatPrice(project.price)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-1">
                    <HiTag className="w-4 h-4" />
                    Discount ({appliedCoupon.code})
                  </span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-secondary-200">
                <span className="font-semibold text-secondary-900">Total Amount</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatPrice(finalPrice)}
                  </div>
                  {appliedCoupon && discount > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      You save {formatPrice(discount)}!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 bg-green-50 rounded-lg p-3 mb-6">
              <HiShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Secure Transaction</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Your payment information is encrypted and secure. We never store your card details.
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
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatPrice(finalPrice)}`
                )}
              </button>
            </div>

            {/* ADDED: Terms */}
            <p className="text-xs text-center text-secondary-500 mt-4">
              By proceeding, you agree to our{' '}
              <a href="/terms" target="_blank" className="text-primary-600 hover:underline">
                Terms & Conditions
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;