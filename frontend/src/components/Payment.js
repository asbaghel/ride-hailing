import React, { useState } from 'react';
import '../styles/Payment.css';

function Payment({ tripId, fareAmount, pickupAddress, dropoffAddress, onPaymentComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // For now, simulate payment processing
      setTimeout(() => {
        setLoading(false);
        onPaymentComplete && onPaymentComplete({
          success: true,
          message: 'Payment processed successfully!',
          transactionId: 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        });
      }, 2000);
    } catch (err) {
      setError('Payment processing failed');
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-card">
        <div className="payment-header">
          <h2>Complete Your Payment</h2>
          <p>Trip ID: {tripId}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="trip-summary">
          <div className="summary-row">
            <span>📍 From:</span>
            <span className="address">{pickupAddress}</span>
          </div>
          <div className="summary-row">
            <span>📍 To:</span>
            <span className="address">{dropoffAddress}</span>
          </div>
          <div className="divider"></div>
          <div className="summary-row fare">
            <span>Total Fare:</span>
            <span className="amount">₹ {fareAmount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Select Payment Method</h3>
          <div className="method-options">
            <label className={`method-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💳 Credit/Debit Card</span>
            </label>
            <label className={`method-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💰 Digital Wallet</span>
            </label>
            <label className={`method-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="upi"
                checked={paymentMethod === 'upi'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>📱 UPI</span>
            </label>
            <label className={`method-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>💵 Cash</span>
            </label>
          </div>
        </div>

        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? 'Processing Payment...' : `Pay ₹ ${fareAmount?.toFixed(2) || '0.00'}`}
        </button>

        <div className="payment-info">
          <p>💡 Your payment is secure and encrypted</p>
          <p>A receipt will be sent to your email after successful payment</p>
        </div>
      </div>
    </div>
  );
}

export default Payment;
