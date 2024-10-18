# Images
## Sample code to use for the UI

'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { ChevronDown, X, ArrowUpDown, Upload, Image as ImageIcon, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock data for customers and listings
const etsyStoreOwners = [
  { 
    id: 1, 
    fullName: "Jane Doe", 
    storeName: "Crafty Creations", 
    logoUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?&w=80&h=80&fit=crop&crop=entropy&q=80",
    customerId: "CID001"
  },
  { 
    id: 2, 
    fullName: "John Smith", 
    storeName: "Vintage Vibes", 
    logoUrl: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?&w=80&h=80&fit=crop&crop=entropy&q=80",
    customerId: "CID002"
  },
  { 
    id: 3, 
    fullName: "Emily Brown", 
    storeName: "Eco Essentials", 
    logoUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?&w=80&h=80&fit=crop&crop=entropy&q=80",
    customerId: "CID003"
  },
]

const mockListings = [
  { id: '1', title: 'Handmade Pottery', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '2', title: 'Vintage Clock', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '3', title: 'Eco-friendly Tote Bag', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '4', title: 'Artisanal Soap Set', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '5', title: 'Handwoven Scarf', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '6', title: 'Wooden Cutting Board', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '7', title: 'Ceramic Mug Set', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '8', title: 'Macrame Wall Hanging', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '9', title: 'Leather Journal', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '10', title: 'Knitted Throw Pillow', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '11', title: 'Handcrafted Jewelry Box', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '12', title: 'Rustic Wall Clock', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '13', title: 'Organic Cotton Blanket', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '14', title: 'Vintage-inspired Dress', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
  { id: '15', title: 'Handmade Candle Set', mainImage: '/placeholder.svg?height=100&width=100', uploadedImages: [] },
]

export default function AdminListings() {
  const [selectedOwner, setSelectedOwner] = useState(etsyStoreOwners[0])
  const [listings, setListings] = useState(mockListings)
  const [sortOrder, setSortOrder] = useState('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const listingsPerPage = 10

  const filteredAndSortedListings = useMemo(() => {
    return listings
      .filter(listing => 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.id.includes(searchTerm)
      )
      .sort((a, b) => 
        sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
      )
  }, [listings, sortOrder, searchTerm])

  const currentListings = useMemo(() => {
    const indexOfLastListing = currentPage * listingsPerPage
    const indexOfFirstListing = indexOfLastListing - listingsPerPage
    return filteredAndSortedListings.slice(indexOfFirstListing, indexOfLastListing)
  }, [filteredAndSortedListings, currentPage])

  const totalPages = Math.ceil(filteredAndSortedListings.length / listingsPerPage)

  const handleImageUpload = useCallback((listingId: string, files: File[]) => {
    setListings(prevListings => 
      prevListings.map(listing => 
        listing.id === listingId
          ? { ...listing, uploadedImages: [...(listing.uploadedImages || []), ...files].slice(0, 10) }
          : listing
      )
    )
  }, [])

  const handleImageDelete = useCallback((listingId: string, imageIndex: number) => {
    setListings(prevListings => 
      prevListings.map(listing => 
        listing.id === listingId
          ? { ...listing, uploadedImages: listing.uploadedImages.filter((_, index) => index !== imageIndex) }
          : listing
      )
    )
  }, [])

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc')
  }

  const totalImagesUploaded = useMemo(() => 
    listings.reduce((total, listing) => total + (listing.uploadedImages?.length || 0), 0),
    [listings]
  )

  const listingsWithImages = useMemo(() => 
    listings.filter(listing => listing.uploadedImages?.length > 0).length,
    [listings]
  )

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
      <header className="bg-background border-b mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-end py-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-6 py-8 px-8 w-full max-w-4xl">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={selectedOwner.logoUrl} alt={selectedOwner.storeName} />
                    <AvatarFallback>{selectedOwner.storeName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-grow">
                    <p className="font-bold text-3xl text-primary mb-2">{selectedOwner.storeName}</p>
                    <p className="text-xl text-muted-foreground">
                      {selectedOwner.fullName} - ID: {selectedOwner.customerId}
                    </p>
                  </div>
                  <ChevronDown className="h-8 w-8 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-4xl">
                <DropdownMenuLabel className="text-2xl p-4">Etsy Store Owners</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {etsyStoreOwners.map((owner) => (
                  <DropdownMenuItem 
                    key={owner.id} 
                    onSelect={() => setSelectedOwner(owner)}
                    className="py-6 px-4"
                  >
                    <div className="flex items-center space-x-6 w-full">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={owner.logoUrl} alt={owner.storeName} />
                        <AvatarFallback>{owner.storeName.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <p className="font-bold text-2xl text-primary mb-1">{owner.storeName}</p>
                        <p className="text-xl text-muted-foreground">
                          {owner.fullName} - ID: {owner.customerId}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Etsy Listings</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by ID or title"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={toggleSortOrder} className="font-bold">
            Sort by Title <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {currentListings.map(listing => (
          <Card key={listing.id} className="flex flex-col overflow-hidden aspect-square">
            <div className="relative flex-grow">
              <img src={listing.mainImage} alt={listing.title} className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <CardContent className="p-4 flex-shrink-0">
              <CardTitle className="text-lg mb-1">{listing.title}</CardTitle>
              <p className="text-sm text-muted-foreground mb-2">ID: {listing.id}</p>
              <div className="mb-2">
                <h4 className="font-semibold text-sm mb-1">Uploaded Images</h4>
                <div className="flex flex-wrap gap-1">
                  {listing.uploadedImages && listing.uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={URL.createObjectURL(image)} 
                        alt={`Uploaded ${index + 1}`} 
                        className="w-6 h-6 object-cover rounded"
                      />
                      <button
                        onClick={() => handleImageDelete(listing.id, index)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ({listing.uploadedImages?.length || 0}/10 images)
                </p>
              </div>
              <ImageUploader 
                listingId={listing.id} 
                onImageUpload={handleImageUpload} 
                maxFiles={10 - (listing.uploadedImages?.length || 0)} 
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-center items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Images Uploaded
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImagesUploaded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Listings with Images
            </CardTitle>
            <ImageIcon className="h-4 w-4  text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listingsWithImages}</div>
            <p className="text-xs text-muted-foreground">
              Out of {listings.length} total listings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Images per Listing
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalImagesUploaded / listings.length).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ImageUploader({ listingId, onImageUpload, maxFiles }) {
  const onDrop = useCallback((acceptedFiles) => {
    onImageUpload(listingId, acceptedFiles)
  }, [listingId, onImageUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {'image/*': []},
    maxFiles: maxFiles
  })

  return (
    <div 
      {...getRootProps()} 
      className={`
        border-2 border-dashed rounded-md p-2 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-gray-300 hover:border-primary'
        }
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
        <p className="text-xs font-semibold">
          Drop images here
        </p>
        <p className="text-xs text-muted-foreground">
          or click to upload
        </p>
        {maxFiles > 0 ? (
          <p className="text-xs text-muted-foreground mt-1">
            {maxFiles} {maxFiles === 1 ? 'slot' : 'slots'} left
          </p>
        ) : (
          <p className="text-xs text-red-500 mt-1">Full</p>
        )}
      </div>
    </div>
  )
}