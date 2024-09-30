const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer'); // Multer for handling file uploads
const fs = require('fs');
const pdf = require('html-pdf-node');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure the 'invoices' directory exists
const invoicesDir = path.join(__dirname, 'invoices');
if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
}

// Configure Multer for storing uploaded images in 'public/images'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Configure second Multer storage
const storage1 = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');  // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`);  // Unique file name
    }
}); 
const upload1 = multer({ storage: storage1 });

// Upload file route
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Return the file URL or path for further use
    res.json({ success: true, fileUrl: `http://localhost:${PORT}/uploads/${req.file.filename}` });
});

// Save invoice route
app.post('/save-invoice', async (req, res) => {
    const { invoice, totalAmount } = req.body;

    // Validate input
    if (!invoice || !totalAmount) {
        return res.status(400).json({ error: 'Invoice and total amount are required' });
    }

    // Path to the HTML template
    const templatePath = path.join(__dirname, 'invoice-template.html');

    // Read the HTML template
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders in the HTML with dynamic content
    let itemsHtml = '';
    invoice.forEach(item => {
        itemsHtml += `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price.toFixed(2)}</td>
            </tr>`;
    });

    htmlTemplate = htmlTemplate
        .replace('{{date}}', new Date().toLocaleString())
        .replace('{{items}}', itemsHtml)
        .replace('{{totalAmount}}', `₹${totalAmount}`);

    const fileName = `invoice-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, 'invoices', fileName);

    try {
        // Create a PDF from the HTML content using html-pdf-node
        let options = { format: 'A4' };
        let file = { content: htmlTemplate };

        // Generate PDF and save it to the file system
        pdf.generatePdf(file, options).then(pdfBuffer => {
            fs.writeFileSync(filePath, pdfBuffer); // Save the generated PDF to file

            // Respond with the filename
            res.json({ message: 'Invoice saved successfully!', fileName });
        }).catch(err => {
            console.error('Error generating PDF:', err);
            res.status(500).json({ error: 'Error generating PDF' });
        });
    } catch (err) {
        console.error('Error processing invoice:', err);
        res.status(500).json({ error: 'Error processing invoice' });
    }
});
// Serve the PDF files
app.use('/bills', express.static(invoicesDir));

// Serve the uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sample menu items (this would typically be in a database)
let items = [];

// Endpoint to get menu items
app.get('/menu/items', (req, res) => {
    res.json(items);
});

// Endpoint to add a new item with an image
app.post('/menu/items', upload.single('image'), (req, res) => {
    const { name, price } = req.body;
    const imageUrl = req.file ? req.file.filename : ''; // Store the file name
    
    const newItem = {
        id: items.length + 1, // Simple ID generation
        name,
        price: parseFloat(price),
        imageUrl
    };

    items.push(newItem);
    res.status(201).json(newItem);
});

// Endpoint to update an existing item with or without an image
app.put('/menu/items/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, price } = req.body;
    const item = items.find(i => i.id == id);

    if (item) {
        // Update item fields
        item.name = name;
        item.price = parseFloat(price);
        
        // If an image is uploaded, update the image URL
        if (req.file) {
            // Delete the old image file if it exists
            if (item.imageUrl && fs.existsSync(`public/images/${item.imageUrl}`)) {
                fs.unlinkSync(`public/images/${item.imageUrl}`);
            }

            item.imageUrl = req.file.filename; // Update with the new image
        }

        res.json(item);
    } else {
        res.status(404).json({ error: 'Item not found' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
