# RetailEdge – Shopkeeper Management System

RetailEdge is a **full‑stack shopkeeper management system** designed to help small retailers manage items, categories, orders, and users efficiently. The project follows the **MVC (Model–View–Controller)** architecture and is built using **Node.js, Express, MongoDB**, and modern authentication practices.

---

## 🚀 Features

* **Dashboard**

  * Overview of items, categories, and vendor orders (demo/random data for insights)

* **Item Management**

  * Add, update, delete, and view items
  * Image upload support using Cloudinary

* **Category Management**

  * Create and manage product categories
  * Category–item relationship handling

* **Orders (Shopkeeper → Vendor)**

  * Orders are **displayed as cards** created by the shopkeeper
  * Page is **only for viewing orders**
  * No tracking, no status updates, no order actions
  * Used purely for **display and record purposes**

* **Authentication**

  * Shopkeeper login and registration
  * Implemented using **Passport.js**

* **Authorization**

  * Restricted access (shopkeeper-only system)
  * Protected routes using custom authorization middleware

* **Session Management**

  * Secure session handling for logged-in shopkeepers

* **Error Handling**

  * Centralized error handling middleware
  * Proper HTTP status codes and messages

---

## 🛠 Tech Stack

### Backend

* **Node.js** – Runtime environment
* **Express.js** – Web framework
* **MongoDB Atlas** – Cloud database
* **Mongoose** – ODM for MongoDB

### Authentication & Security

* **Passport.js** – Authentication strategy
* **Express‑Session** – Session management
* **Authorization Middleware** – Route protection

### File & Image Handling

* **Cloudinary** – Cloud‑based image storage
* **Multer** – File upload handling

### Architecture

* **MVC (Model–View–Controller)** pattern

---

## 📂 Project Structure

```
RetailEdge/
│
├── controllers/        # Request handling logic
├── models/             # Mongoose schemas
├── routes/             # Application routes
├── middlewares/        # Auth, error handling, authorization
├── config/             # DB, passport, cloudinary config
├── views/              # EJS / template files (if used)
├── public/             # Static assets
├── utils/              # Helper functions
├── app.js              # App entry point
└── README.md           # Project documentation
```

---

## 🔐 Authentication Flow

1. User registers or logs in
2. Passport authenticates credentials
3. Session is created and stored
4. Protected routes verify authentication and authorization

---

## 🗄 Database

* Hosted on **MongoDB Atlas**
* Collections include:

  * Users
  * Items
  * Categories
  * Orders

---

## ☁ Image Storage

* Item images are uploaded to **Cloudinary**
* Only image URLs are stored in MongoDB

---

## ⚙️ Environment Variables

Create a `.env` file and add:

```
PORT=3000
MONGO_URI=your_mongodb_atlas_url
SESSION_SECRET=your_secret
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▶️ Installation & Setup

```

# Clone the repository
git clone https://github.com/Saurav-S-Mehta-07/RetailEdge.git

# Go to project directory
cd RetailEdge

# Install dependencies
npm install

# Start the application
nodemon app.js
```

---


## 📌 Use Case

RetailEdge is designed **only for shopkeepers** to:

* Manage shop inventory
* Organize product categories
* Place orders to 
* Monitor shop operations from a single dashboard

This system is **not intended for end users or customers**.

---

## 📖 Learning Outcomes

* MVC architecture in Node.js
* Authentication & authorization using Passport
* Session‑based security
* MongoDB Atlas integration
* Cloudinary image uploads
* Middleware‑based error handling

---

## 📄 License

This project is for educational and learning purposes.
