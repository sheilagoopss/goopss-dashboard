# Product Requirements Document: Listing Optimizer

The Listing Optimizer provides a user-friendly interface for administrators to view, search, and optimize product listings from various Etsy stores. It uses openAI to suggest improved titles and descriptions, enhancing the overall quality of product listings.

## Core Functionalities

### 1. Store Selection
- Provide a dropdown menu to select from available stores
- Display the selected store name in the header

### 2. Listings Table
- Display a comprehensive table of all product listings. Fetch listings from the database on the listings collection
- Columns to display: Listing ID, Title, Image, Tags, Status, Bestseller flag, Total Sales, and Daily Views. These are the equivalent fields in the database.
    - Listing ID: listingID
    - Title: listingTitle
    - Image: primaryImage
    - Tags: listingTags
    - Status: optimizationStatus
    - Bestseller: bestseller
    - Total Sales: totalSales
    - Daily Views: dailyViews
- On each row, include an "Optimize" button
- Display 5 listings per page
- Implement sorting functionality for Total Sales and Daily Views
- Enable search functionality by Listing ID or Title
- Implement pagination controls (Previous and Next buttons)
- Show current page number and total number of pages
- Implement a "Show Non-Bestsellers Only" filter
- Add a "Hide Optimized Listings" filter to focus on non-optimized items
- Create an expandable view for each listing to show detailed information (original and optimized title, description, and tags)

### 3.Listing Optimization
- Generate an optimized title and description when the button is clicked by using OpenAI. The current title and description should be taken from the database. (listingTitle and listingDescription)
- Allow users to edit and refine the optimized title and description
- Support adding, editing, and removing tags for each listing
- Add a "Copy to Clipboard" button to the optimized title and description to allow admins to easily copy the optimized text to the clipboard.
- Display the original and optimized versions side by side below the table.
- Provide a "Save" button to apply the optimized changes to the database. It should create new fields in the database for the optimized title, description, and tags:
    - optimizedTitle
    - optimizedDescription
    - optimizedTags

## Sample Code to use but ignore the UI imports for now and just use the logic

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Package, Search, Loader2, Edit, Check, Copy, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { optimizeText } from '../services/OptimizationService';

// Mock API functions (replace with actual API calls in production)
const fetchStores = async () => [
  { id: "1", name: "Electronics Store" },
  { id: "2", name: "Fashion Boutique" },
  { id: "3", name: "Home Decor Shop" },
]

const fetchListings = async (storeId: string) => [
  { id: "L001", title: "Smartphone X", description: "A powerful smartphone with advanced features.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "mobile"], status: "", bestseller: true, totalSales: 1500, dailyViews: 250 },
  { id: "L002", title: "Laptop Pro", description: "High-performance laptop for professionals.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "computer"], status: "", bestseller: false, totalSales: 800, dailyViews: 150 },
  { id: "L003", title: "Wireless Earbuds", description: "True wireless earbuds with noise cancellation.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "audio"], status: "", bestseller: true, totalSales: 2000, dailyViews: 300 },
  { id: "L004", title: "4K Smart TV", description: "Ultra HD smart TV with built-in streaming apps.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "tv"], status: "", bestseller: false, totalSales: 500, dailyViews: 100 },
  { id: "L005", title: "Fitness Tracker", description: "Track your health and fitness goals.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "wearable"], status: "", bestseller: true, totalSales: 1200, dailyViews: 200 },
  { id: "L006", title: "Digital Camera", description: "Capture high-quality photos and videos.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "camera"], status: "", bestseller: false, totalSales: 300, dailyViews: 80 },
  { id: "L007", title: "Gaming Console", description: "Next-gen gaming console for immersive gameplay.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "gaming"], status: "", bestseller: true, totalSales: 1800, dailyViews: 280 },
  { id: "L008", title: "Bluetooth Speaker", description: "Portable speaker with rich, clear sound.", image: "/placeholder.svg?height=50&width=50", tags: ["electronics", "audio"], status: "", bestseller: false, totalSales: 600, dailyViews: 120 },
]

const optimizeListing = async (listing: { id: string; title: string; description: string }) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    title: `Improved ${listing.title} - Best Seller!`,
    description: `${listing.description} Unbeatable quality and value. Limited time offer!`,
  }
}

const publishListing = async (listing: { id: string; title: string; description: string; tags: string[] }) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { success: true, message: "Listing published successfully!" }
}

export default function ListingOptimizer() {
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [selectedStore, setSelectedStore] = useState("")
  const [listings, setListings] = useState<{ id: string; title: string; description: string; image: string; tags: string[]; status: string; bestseller: boolean; totalSales: number; dailyViews: number; optimizedTitle?: string; optimizedDescription?: string; optimizedTags?: string[] }[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [optimizedListing, setOptimizedListing] = useState<{
    id: string;
    original: { title: string; description: string; tags: string[] };
    optimized: { title: string; description: string; tags: string[] };
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [sortColumn, setSortColumn] = useState<"totalSales" | "dailyViews" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [showNonBestsellers, setShowNonBestsellers] = useState(false)
  const [hideOptimized, setHideOptimized] = useState(false)
  const [expandedRows, setExpandedRows] = useState<string[]>([])

  useEffect(() => {
    const loadStores = async () => {
      const storeData = await fetchStores()
      setStores(storeData)
    }
    loadStores()
  }, [])

  useEffect(() => {
    const loadListings = async () => {
      if (selectedStore) {
        setIsLoading(true)
        const listingData = await fetchListings(selectedStore)
        setListings(listingData)
        setIsLoading(false)
      }
    }
    loadListings()
  }, [selectedStore])

  const filteredListings = listings
    .filter((listing) =>
      (listing.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.title.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!showNonBestsellers || !listing.bestseller) &&
      (!hideOptimized || listing.status !== "Optimized" && listing.status !== "Published")
    )
    .sort((a, b) => {
      if (sortColumn) {
        if (sortDirection === "asc") {
          return a[sortColumn] - b[sortColumn]
        } else {
          return b[sortColumn] - a[sortColumn]
        }
      }
      return 0
    })

  const handleSort = (column: "totalSales" | "dailyViews") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const handleOptimize = async (listing: { id: string; title: string; description: string; tags: string[] }) => {
    setIsOptimizing(true)
    const optimized = await optimizeListing(listing)
    setOptimizedListing({
      id: listing.id,
      original: { title: listing.title, description: listing.description, tags: listing.tags },
      optimized: { ...optimized, tags: listing.tags },
    })
    setListings(listings.map(l => l.id === listing.id ? { ...l, status: "Optimized" } : l))
    setIsOptimizing(false)
  }

  const handlePublish = async () => {
    if (optimizedListing) {
      setIsPublishing(true)
      const result = await publishListing(optimizedListing.optimized)
      if (result.success) {
        setListings(listings.map(l => l.id === optimizedListing.id ? { 
          ...l, 
          status: "Published",
          optimizedTitle: optimizedListing.optimized.title,
          optimizedDescription: optimizedListing.optimized.description,
          optimizedTags: optimizedListing.optimized.tags
        } : l))
        setOptimizedListing(null)
      }
      // Handle the result (e.g., show a success message)
      console.log(result.message)
      setIsPublishing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a toast notification here if you want
      console.log('Copied to clipboard')
    })
  }

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
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

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {selectedStore && (
            <>
              <div className="mb-4 flex items-center justify-between">
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
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="non-bestsellers"
                      checked={showNonBestsellers}
                      onCheckedChange={(checked) => setShowNonBestsellers(checked as boolean)}
                    />
                    <label
                      htmlFor="non-bestsellers"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show Non-Bestsellers Only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide-optimized"
                      checked={hideOptimized}
                      onCheckedChange={(checked) => setHideOptimized(checked as boolean)}
                    />
                    <label
                      htmlFor="hide-optimized"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Hide Optimized Listings
                    </label>
                  </div>
                </div>
              </div>
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Image</TableHead>
                        <TableHead>Listing ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bestseller</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("totalSales")}>
                          Total Sales {sortColumn === "totalSales" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort("dailyViews")}>
                          Daily Views {sortColumn === "dailyViews" && <ArrowUpDown className="ml-2 h-4 w-4 inline" />}
                        </TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
                            Loading listings...
                          </TableCell>
                        </TableRow>
                      ) : filteredListings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-4">
                            No listings found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredListings.map((listing) => (
                          <>
                            <TableRow key={listing.id}>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleRowExpansion(listing.id)}
                                >
                                  {expandedRows.includes(listing.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Image src={listing.image} alt={listing.title} width={50} height={50} className="rounded-md" />
                              </TableCell>
                              <TableCell>{listing.id}</TableCell>
                              
                              <TableCell>{listing.title}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {listing.tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {listing.status && (
                                  <Badge variant="secondary">{listing.status}</Badge>
                                )}
                              </TableCell>
                              <TableCell>{listing.bestseller ? "Yes" : "No"}</TableCell>
                              <TableCell>{listing.totalSales}</TableCell>
                              <TableCell>{listing.dailyViews}</TableCell>
                              <TableCell>
                                <Button onClick={() => handleOptimize(listing)} disabled={isOptimizing || listing.status === "Optimized" || listing.status === "Published"}>
                                  {isOptimizing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      Optimizing...
                                    </>
                                  ) : (
                                    "Optimize"
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedRows.includes(listing.id) && (
                              <TableRow>
                                <TableCell colSpan={10}>
                                  <div className="p-4 bg-gray-50 grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Original Listing:</h4>
                                      <p><strong>Title:</strong> {listing.title}</p>
                                      <p><strong>Description:</strong> {listing.description}</p>
                                      <div className="mt-2">
                                        <strong>Tags:</strong>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {listing.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Optimized Listing:</h4>
                                      <p><strong>Title:</strong> {listing.optimizedTitle}</p>
                                      <p><strong>Description:</strong> {listing.optimizedDescription}</p>
                                      <div className="mt-2">
                                        <strong>Tags:</strong>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {listing.optimizedTags?.map((tag, index) => (
                                            <Badge key={index} variant="secondary">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
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
                    <h4 className="font-medium mt-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {optimizedListing.original.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2">Optimized Listing</h3>
                  <div className="bg-green-50 p-4 rounded-md">
                    <h4 className="font-medium">Title:</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={optimizedListing.optimized.title}
                        onChange={(e) => setOptimizedListing({
                          ...optimizedListing,
                          optimized: {...optimizedListing.optimized, title: e.target.value}
                        })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(optimizedListing.optimized.title)}>
                        <Copy className="h-4 w-4" />
                        <span className="sr-only">Copy title</span>
                      </Button>
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit title</span>
                      </Button>
                    </div>
                    <h4 className="font-medium">Description:</h4>
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={optimizedListing.optimized.description}
                        onChange={(e) => setOptimizedListing({
                          ...optimizedListing,
                          optimized: {...optimizedListing.optimized, description: e.target.value}
                        })}
                        rows={4}
                      />
                      <div className="flex flex-col gap-2">
                        <Button size="icon" variant="ghost" onClick={() => copyToClipboard(optimizedListing.optimized.description)}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy description</span>
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit description</span>
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-medium mt-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {optimizedListing.optimized.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button 
                            onClick={() => setOptimizedListing({
                              ...optimizedListing,
                              optimized: {
                                ...optimizedListing.optimized,
                                tags: optimizedListing.optimized.tags.filter((_, i) => i !== index)
                              }
                            })}
                            className="text-xs ml-1"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add new tags (comma-separated)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const newTags = e.currentTarget.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                            if (newTags.length > 0) {
                              setOptimizedListing({
                                ...optimizedListing,
                                optimized: {
                                  ...optimizedListing.optimized,
                                  tags: [...new Set([...optimizedListing.optimized.tags, ...newTags])]
                                }
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add new tags (comma-separated)"]') as HTMLInputElement;
                          const newTags = input.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
                          if (newTags.length > 0) {
                            setOptimizedListing({
                              ...optimizedListing,
                              optimized: {
                                ...optimizedListing.optimized,
                                tags: [...new Set([...optimizedListing.optimized.tags, ...newTags])]
                              }
                            });
                            input.value = '';
                          }
                        }}
                      >
                        Add Tags
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handlePublish} disabled={isPublishing} className="mt-4">
                    {isPublishing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
