const menuItemsContainer = document.getElementById('menu-items');
const totalPriceElement = document.getElementById('total-price');
const cartItemsContainer = document.getElementById('cart-items');  // Container for displaying selected items
const whatsappNumberInput = document.getElementById('whatsapp-number');
const sendBillButton = document.getElementById('send-bill');

let cart = [];

// Fetch and display menu items
function fetchMenuItems() {
    fetch('/menu/items')
        .then(response => response.json())
        .then(items => {
            items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'menu-item';
                itemElement.innerHTML = `
                    <h3>${item.name}</h3>
                    <p class="item-price">₹${item.price.toFixed(2)}</p>
                    <img src="/images/${item.imageUrl}" alt="${item.name}" class="menu-item-image">
                    <div class="cart-controls">
                        <button class="btn-primary" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">Add to Cart</button>
                        <div class="quantity-controls">
                            <button class="btn-secondary" onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span id="quantity-${item.id}" class="quantity">0</span>
                            <button class="btn-secondary" onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                `;
                menuItemsContainer.appendChild(itemElement);
            });
        })
        .catch(error => console.error('Error fetching menu items:', error));
}

// Add to cart
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        updateQuantity(id, 1); // Increase quantity if item already in cart
    } else {
        cart.push({ id, name, price, quantity: 1 });
        document.getElementById(`quantity-${id}`).innerText = 1;
    }
    updateTotal();
}

// Update quantity
function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
        document.getElementById(`quantity-${id}`).innerText = item.quantity;
        updateTotal();
    }
}

// Function to render cart items and total
function updateTotal() {
    let total = 0;
    cartItemsContainer.innerHTML = '';  // Clear the existing cart items list

    // Loop through the cart and render each item with its quantity
    cart.forEach(item => {
        total += item.price * item.quantity;
        
        const cartItemElement = document.createElement('div');
        cartItemElement.className = 'cart-item';
        cartItemElement.innerHTML = `
            <p>${item.name} x ${item.quantity} = ${(item.price * item.quantity).toFixed(2)}</p>
        `;
        cartItemsContainer.appendChild(cartItemElement);  // Add each item to the cart items container
    });

    totalPriceElement.innerText = total.toFixed(2);
}
fetchMenuItems();
function generateInvoice() {
    // Use the cart array to get the selected items
    const selectedItems = cart.filter(item => item.quantity > 0);

    if (selectedItems.length === 0) {
        alert("No items selected!");
        return;
    }

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    const customerPhone = document.getElementById("whatsapp-number").value;

    if (customerPhone === "") {
        alert("Please enter the customer's WhatsApp number!");
        return;
    }

    saveInvoicePDF(selectedItems, totalAmount, customerPhone);
}

function saveInvoicePDF(invoiceText, totalAmount, customerPhone) {
    fetch('/save-invoice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice: invoiceText, totalAmount }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Invoice saved:', data);
        alert('Invoice saved successfully!');
        
        // Check if customerPhone is provided and valid
        if (validatePhoneNumber(customerPhone)) {
            createWhatsAppLink(customerPhone, data.fileName);
        } else {
            alert('Invalid phone number. Please enter a valid phone number.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Failed to save invoice.');
    });
}

// Function to create WhatsApp link and open it
function createWhatsAppLink(phoneNumber, fileName) {
    const message = `Hello, please find your invoice here: https://cafe-s3t3.onrender.com/bills/${fileName}`;
    
    // Ensure phone number is in correct format (country code and no special characters)
    phoneNumber = phoneNumber.replace(/\D/g, ''); // Remove any non-digit characters
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Log the constructed link to debug any potential issues
    console.log('Opening WhatsApp with link:', whatsappLink);
    
    window.open(whatsappLink, '_blank');
}

// Simple validation to check if phone number is numeric and long enough
function validatePhoneNumber(phoneNumber) {
    const cleanedPhone = phoneNumber.replace(/\D/g, ''); // Remove non-digit characters
    return cleanedPhone.length >= 10; // Ensure at least 10 digits
}

// Event listener for generating invoice
document.getElementById("generate-invoice-button").addEventListener('click', generateInvoice);




