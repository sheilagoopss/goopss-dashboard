# Product Requirements Document: Listing Optimizer

The Listing Optimizer provides a user-friendly interface for administrators to view, search, and optimize product listings from various Etsy stores. It uses openAI to suggest improved titles and descriptions, enhancing the overall quality of product listings.

## Features and Requirements

### 1. Store Selection
- Provide a dropdown menu to select from available stores
- Display the selected store name in the header

### 2. Listings Table
- Show a table of product listings with columns for Listing ID, Title, and Action
- Display 5 listings per page
- Implement pagination controls (Previous and Next buttons)
- Show current page number and total number of pages

### 3. Search Functionality
- Provide a search input field above the listings table
- Allow searching by Listing ID or Title
- Update the listings table in real-time as the user types

### 4.Listing Optimization
- Include an "Optimize" button for each listing in the table
- Generate an optimized title and description when the button is clicked by using OpenAI
- Display the original and optimized versions side by side below the table

## Sample Code to use but ignore the UI imports for now and just use the logic

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, Search, ChevronLeft, ChevronRight } from "lucide-react"

// Mock data
const stores = [
  { id: "1", name: "Electronics Store" },
  { id: "2", name: "Fashion Boutique" },
  { id: "3", name: "Home Decor Shop" },
]

const listings = [
  { id: "L001", title: "Smartphone X", description: "A powerful smartphone with advanced features." },
  { id: "L002", title: "Laptop Pro", description: "High-performance laptop for professionals." },
  { id: "L003", title: "Wireless Earbuds", description: "True wireless earbuds with noise cancellation." },
  { id: "L004", title: "4K Smart TV", description: "Ultra HD smart TV with built-in streaming apps." },
  { id: "L005", title: "Fitness Tracker", description: "Track your health and fitness goals." },
  { id: "L006", title: "Digital Camera", description: "Capture high-quality photos and videos." },
  { id: "L007", title: "Gaming Console", description: "Next-gen gaming console for immersive gameplay." },
  { id: "L008", title: "Bluetooth Speaker", description: "Portable speaker with rich, clear sound." },
]

// Simple optimization function (for demonstration)
function optimizeListing(title: string, description: string) {
  return {
    title: `Improved ${title} - Best Seller!`,
    description: `${description} Unbeatable quality and value. Limited time offer!`,
  }
}

export default function ListingOptimizer() {
  const [selectedStore, setSelectedStore] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [optimizedListing, setOptimizedListing] = useState<{
    original: { title: string; description: string };
    optimized: { title: string; description: string };
  } | null>(null)

  const filteredListings = listings.filter(
    (listing) =>
      listing.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedListings = filteredListings.slice((currentPage - 1) * 5, currentPage * 5)

  const totalPages = Math.ceil(filteredListings.length / 5)

  const handleOptimize = (listing: { id: string; title: string; description: string }) => {
    const optimized = optimizeListing(listing.title, listing.description)
    setOptimizedListing({
      original: { title: listing.title, description: listing.description },
      optimized,
    })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            <Package className="mr-2" />
            Listing Optimizer
          </h1>
          <div className="w-64">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select a store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedStore && (
            <>
              <div className="mb-4 flex items-center">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by Listing ID or Title"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedListings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>{listing.id}</TableCell>
                        <TableCell>{listing.title}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleOptimize(listing)}>Optimize</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}
          {optimizedListing && (
            <div className="mt-8 bg-white shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Listing Optimization Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Original Listing</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium">Title:</h4>
                    <p className="mb-2">{optimizedListing.original.title}</p>
                    <h4 className="font-medium">Description:</h4>
                    <p>{optimizedListing.original.description}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Optimized Listing</h3>
                  <div className="bg-green-50 p-4 rounded-md">
                    <h4 className="font-medium">Title:</h4>
                    <p className="mb-2">{optimizedListing.optimized.title}</p>
                    <h4 className="font-medium">Description:</h4>
                    <p>{optimizedListing.optimized.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}