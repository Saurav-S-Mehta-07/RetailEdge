const shopkeeperData = [
  {
    name: "Saurav Mehta",
    email: "saurav.mehta@gmail.com",
    phone: "9876543210",
    shopName: "Mehta Electronics",
    location: "Rajpur Road",
    city: "Dehradun",
    gstNumber: "09ABCDE1234F1Z5",
    establishedYear: 2018,
    listings: [], // will be populated with Listing ObjectIds later
    orders: [],   // initially empty
    isVerified: true,
  },
  {
    name: "Aditi Sharma",
    email: "aditi.sharma@gmail.com",
    phone: "9812345678",
    shopName: "Aditi Fashion Hub",
    location: "Connaught Place",
    city: "New Delhi",
    gstNumber: "07PQRSF7890L2K3",
    establishedYear: 2020,
    listings: [],
    orders: [],
    isVerified: false,
  },
  {
    name: "Rohit Verma",
    email: "rohit.verma@gmail.com",
    phone: "9901234567",
    shopName: "Verma Supermart",
    location: "Civil Lines",
    city: "Agra",
    gstNumber: "09LMNOP2345J7Z9",
    establishedYear: 2015,
    listings: [],
    orders: [],
    isVerified: true,
  },
];

module.exports = { data: shopkeeperData };
