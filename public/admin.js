const form = document.getElementById('item-form');
const itemIdInput = document.getElementById('item-id');
const itemsList = document.getElementById('items-list');

// Fetch and display existing items
function fetchItems() {
    fetch('/menu/items')
        .then(response => response.json())
        .then(items => {
            itemsList.innerHTML = '';
            items.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('menu-item');
                div.innerHTML = `
                    <h3>${item.name} - ₹${item.price.toFixed(2)}</h3>
                    <img src="/images/${item.imageUrl}" alt="${item.name}" style="width:100px;">
                 <button class="btn-edit" onclick="editItem(${item.id}, '${item.name}', ${item.price}, '${item.imageUrl}')">Edit</button>

                `;
                itemsList.appendChild(div);
            });
        })
        .catch(error => console.error('Error fetching menu items:', error));
}

// Add or update item
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = itemIdInput.value;
    const name = document.getElementById('item-name').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const imageFile = document.getElementById('item-image').files[0]; // Get the file from file input

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);

    if (imageFile) {
        formData.append('image', imageFile); // Append image file if it exists
    }

    const method = id ? 'PUT' : 'POST';  // Set method based on whether we're updating or adding

    fetch(`/menu/items${id ? `/${id}` : ''}`, {
        method: method,
        body: formData,
    })
        .then(response => response.json())
        .then(data => {
            alert(`Item ${id ? 'updated' : 'added'} successfully`);
            fetchItems();
            form.reset();
            itemIdInput.value = ''; // Clear the ID after successful operation
        })
        .catch(error => console.error(`Error ${id ? 'updating' : 'adding'} item:`, error));
});

// Edit item function
function editItem(id, name, price, imageUrl) {
    itemIdInput.value = id;
    document.getElementById('item-name').value = name;
    document.getElementById('item-price').value = price;
   
}

// Initial fetch of items
fetchItems();
