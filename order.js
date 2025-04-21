// Get DOM elements
const orderForm = document.getElementById('order-form');
const placeOrderBtn = document.getElementById('place-order-btn');
const orderTracking = document.getElementById('order-tracking');

// Load cart items from localStorage
function loadCartItems() {
  let cartItems = [];
  try {
    cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
  } catch (error) {
    console.error('Error loading cart items:', error);
    cartItems = [];
  }
  return cartItems;
}

// Calculate order totals
function calculateOrderTotals(items) {
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryFee = 30.00;
  const tax = subtotal * 0.05; // 5% tax rate
  const total = subtotal + deliveryFee + tax;
  
  return {
    subtotal: subtotal.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2)
  };
}

// Display order items and totals in the summary
function displayOrderSummary() {
  const cartItems = loadCartItems();
  const orderItemsContainer = document.querySelector('.order-items');
  const subtotalElement = document.getElementById('subtotal');
  
  // Clear existing items
  orderItemsContainer.innerHTML = '';
  
  // Add items to the summary
  cartItems.forEach((item, index) => {
    const orderItem = document.createElement('div');
    orderItem.className = 'order-item';
    orderItem.innerHTML = `
      <div class="item-name">
        <span>${index + 1}</span>
        ${item.name}
      </div>
      <div class="item-price">Rs${(item.price * item.quantity).toFixed(2)}</div>
    `;
    orderItemsContainer.appendChild(orderItem);
  });
  
  // Calculate and display totals
  const totals = calculateOrderTotals(cartItems);
  
  subtotalElement.textContent = `Rs${totals.subtotal}`;
  document.querySelector('.summary-total span:last-child').textContent = `Rs${totals.total}`;
}

// Handle order submission to Firebase
async function submitOrder(orderData) {
  try {
    // Add order to Firestore
    const orderRef = await db.collection('orders').add(orderData);
    
    // Get the order ID
    const orderId = orderRef.id;
    
    // Show success message
    showToast('Order placed successfully!');
    
    // Show order tracking with the new order ID
    showOrderTracking(orderId);
    
    // Clear cart
    localStorage.removeItem('cartItems');
    
    return orderId;
  } catch (error) {
    console.error('Error submitting order:', error);
    showToast('Error placing order. Please try again.', 'error');
    return null;
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  // Check if toast container exists, if not create it
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  // Set toast content and style based on type
  const iconClass = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
  toast.style.backgroundColor = type === 'success' ? 'var(--success)' : 'var(--danger)';
  toast.innerHTML = `<i class="${iconClass}"></i> ${message}`;
  
  // Show toast
  toast.classList.add('show');
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Show order tracking section
function showOrderTracking(orderId) {
  // Update order ID in tracking section
  document.querySelector('.order-id span').textContent = `#${orderId.substring(0, 7).toUpperCase()}`;
  
  // Hide form and show tracking
  orderForm.closest('.form-container').style.display = 'none';
  orderTracking.style.display = 'block';
  
  // Set up real-time updates for order status
  setupOrderStatusListener(orderId);
}

// Listen for real-time updates to order status
function setupOrderStatusListener(orderId) {
  db.collection('orders').doc(orderId)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        updateOrderStatus(data.status);
      }
    });
}

// Update the order status UI
function updateOrderStatus(status) {
  // Get all steps
  const steps = document.querySelectorAll('.track-step');
  
  // Define status index mapping
  const statusIndex = {
    'placed': 0,
    'confirmed': 1,
    'preparing': 2,
    'delivery': 3,
    'delivered': 4
  };
  
  // Update progress bar
  const progressPercentage = (statusIndex[status] / (steps.length - 1)) * 100;
  document.querySelector('.progress-bar-fill').style.width = `${progressPercentage}%`;
  
  // Update step status
  steps.forEach((step, index) => {
    if (index <= statusIndex[status]) {
      step.classList.add(index === statusIndex[status] ? 'active' : 'completed');
      step.classList.remove(index === statusIndex[status] ? 'completed' : 'active');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

// Handle delivery time selection
document.getElementById('delivery-time').addEventListener('change', function() {
  const scheduledTimeContainer = document.getElementById('scheduled-time-container');
  scheduledTimeContainer.style.display = this.value === 'schedule' ? 'block' : 'none';
});

// Handle order submission
placeOrderBtn.addEventListener('click', async function(e) {
  e.preventDefault();
  
  // Validate form
  if (!orderForm.checkValidity()) {
    orderForm.reportValidity();
    return;
  }
  
  // Get form data
  const formData = {
    delivery: {
      hostel: document.getElementById('hostel').value,
      room: document.getElementById('room').value,
      floor: document.getElementById('floor').value,
      landmark: document.getElementById('landmark').value
    },
    contact: {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value
    },
    deliveryOptions: {
      deliveryTime: document.getElementById('delivery-time').value,
      scheduledTime: document.getElementById('scheduled-time').value || null,
      notes: document.getElementById('notes').value
    },
    payment: {
      method: document.querySelector('input[name="payment"]:checked').value
    },
    items: loadCartItems(),
    totals: calculateOrderTotals(loadCartItems()),
    status: 'placed',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  // Submit order to Firebase
  const orderId = await submitOrder(formData);
  
  if (orderId) {
    // If using a payment gateway, redirect to payment page
    if (formData.payment.method !== 'cash') {
      // For demonstration purposes, we're not redirecting
      // In a real app, you would redirect to a payment gateway here
      console.log('Redirecting to payment gateway...');
    }
  }
});

// Initialize order summary when page loads
document.addEventListener('DOMContentLoaded', function() {
  displayOrderSummary();
});