# Product Requirements Document: Ads Analysis   

The Ads Analysis tool allows the admins and customers to see which listings we recommend to create ads for.

## Core Functionalities

### 1. Listing Recommendations
- Display the listings that we recommend to create ads for by fetching them from Firestore
- On Firestore, check the stats collection and match the logged-in customer's store name. The field to look for is shop in the stats document.
- Recommend the listings found in the stats collection
- Do not include listings which views field is 0
- For the admin page, add a dropdown menu to select the store name first before fetching the listings

### 2. Listings Displahy
- Show the listings in card format with the following information:
  - Listing ID (listingId field in the stats collection)
  - Title (title field in the stats collection)
  - Image (image field in the stats collection)
- When a card is clicked, it should open a new tab with the Etsy listing page (link fields in the stats collection)
