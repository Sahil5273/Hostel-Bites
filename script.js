// Mobile menu toggle functionality
const menuToggle = document.getElementById('menuToggle');
const sideNav = document.getElementById('sideNav');

menuToggle.addEventListener('click', () => {
    sideNav.classList.toggle('active');
});

// Close menu when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 992) {
        if (!sideNav.contains(e.target) && e.target !== menuToggle) {
            sideNav.classList.remove('active');
        }
    }
});

// Main functionality for cart and categories
document.addEventListener('DOMContentLoaded', function() {
    // Get all add to cart buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    console.log("Found", addToCartButtons.length, "add-to-cart buttons"); // Debug logging
    
    // Add click event listeners to all buttons
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log("Add to cart button clicked"); // Debug logging
            
            // Get the parent item div (works for both featured-item and menu-item)
            const itemElement = this.closest('.featured-item') || this.closest('.menu-item');
            
            // Extract item details
            const name = itemElement.querySelector('h3').innerText;
            const description = itemElement.querySelector('p').innerText;
            
            // Handle different price formats
            const priceElement = itemElement.querySelector('.price span') || itemElement.querySelector('.price');
            const priceText = priceElement.innerText;
            const price = parseFloat(priceText.replace('Rs', '').trim());
            
            const image = itemElement.querySelector('img').src;
            
            // Get category if it exists
            const categoryElement = itemElement.querySelector('.category');
            const category = categoryElement ? categoryElement.innerText : null;
            
            // Get existing cart items from localStorage
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            
            // Check if item already exists in cart
            const existingItemIndex = cartItems.findIndex(item => item.name === name);
            
            if (existingItemIndex !== -1) {
                // If item exists, increase quantity
                cartItems[existingItemIndex].quantity += 1;
            } else {
                // If item doesn't exist, add new item
                const newItem = {
                    name: name,
                    description: description,
                    price: price,
                    image: image,
                    quantity: 1
                };
                
                // Add category if it exists
                if (category) {
                    newItem.category = category;
                }
                
                cartItems.push(newItem);
            }
            
            // Save updated cart to localStorage
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            
            // Show toast notification
            showToast('Item added to cart!');
            
            // Update cart count in navbar and cart display if on cart page
            updateNavCartCount();
            if (document.getElementById('cart-items')) {
                updateCartDisplay();
            }
        });
    });
    
    // Initialize cart count on page load
    updateNavCartCount();
    
    // Initialize cart display if on cart page
    if (document.getElementById('cart-items')) {
        updateCartDisplay();
    }

    // Category filter functionality
    const categoryFilters = document.querySelectorAll('.category-filter');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Remove active class from all filters
            categoryFilters.forEach(f => f.classList.remove('active'));
            // Add active class to clicked filter
            this.classList.add('active');
            
            const category = this.textContent;
            filterMenuItems(category);
        });
    });
});

// Function to filter menu items by category
function filterMenuItems(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const itemCategory = item.querySelector('.category').innerText;
        
        if (category === 'All' || itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Function to show toast notification
function showToast(message) {
    console.log("Showing toast:", message); // Debug logging
    
    // Create toast if it doesn't exist
    let toast = document.getElementById('toast');
    
    if (!toast) {
        console.log("Creating new toast element"); // Debug logging
        
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-check-circle';
        toast.appendChild(icon);
        
        const span = document.createElement('span');
        span.id = 'toast-message';
        toast.appendChild(span);
        
        document.body.appendChild(toast);
        
        // Add toast styles if not already in stylesheet
        if (!document.querySelector('style#toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 30px;
                    right: 30px;
                    background-color: var(--success);
                    color: white;
                    padding: 15px 25px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    z-index: 1000;
                    transform: translateY(100px);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .toast.show {
                    transform: translateY(0);
                    opacity: 1;
                }
                .toast i {
                    margin-right: 10px;
                    font-size: 18px;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Update toast message
    const messageElement = document.getElementById('toast-message');
    if (messageElement) {
        messageElement.textContent = message;
    } else {
        console.error("Toast message element not found"); // Debug logging
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Function to update cart count in navbar
function updateNavCartCount() {
    const navCartCount = document.getElementById('nav-cart-count');
    if (navCartCount) {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
        navCartCount.textContent = totalItems > 0 ? `(${totalItems})` : '(0)';
    }
}

// Function to update cart display based on localStorage
function updateCartDisplay() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const emptyCartElement = document.getElementById('cart-empty');
    const cartItemsElement = document.getElementById('cart-items');
    const cartSummaryElement = document.getElementById('cart-summary');
    
    if (!cartItemsElement) return; // Exit if not on cart page
    
    if (cartItems.length === 0) {
        // Show empty cart message
        emptyCartElement.style.display = 'block';
        cartItemsElement.innerHTML = '';
        cartSummaryElement.style.display = 'none';
    } else {
        // Hide empty cart message and show items
        emptyCartElement.style.display = 'none';
        cartSummaryElement.style.display = 'block';
        
        // Clear and rebuild cart items
        cartItemsElement.innerHTML = '';
        
        // Calculate totals
        let subtotal = 0;
        
        cartItems.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                </div>
                <div class="cart-item-price">Rs${itemTotal.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)"><i class="fas fa-minus"></i></button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)"><i class="fas fa-plus"></i></button>
                    <button class="cart-item-remove" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            cartItemsElement.appendChild(cartItemElement);
        });
        
        // Update summary totals
        const tax = subtotal * 0.05; // 5% tax
        const total = subtotal + tax + 30; // 30 is delivery fee
        
        document.getElementById('subtotal').textContent = `Rs${subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `Rs${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `Rs${total.toFixed(2)}`;
    }
}

// Function to update item quantity
function updateQuantity(index, change) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    if (cartItems[index]) {
        cartItems[index].quantity += change;
        
        // Remove item if quantity is 0 or less
        if (cartItems[index].quantity <= 0) {
            cartItems.splice(index, 1);
            showToast('Item removed from cart');
        } else {
            showToast('Cart updated');
        }
        
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartDisplay();
        updateNavCartCount();
    }
}

// Function to remove item from cart
function removeFromCart(index) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    if (cartItems[index]) {
        cartItems.splice(index, 1);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        showToast('Item removed from cart');
        updateCartDisplay();
        updateNavCartCount();
    }
}