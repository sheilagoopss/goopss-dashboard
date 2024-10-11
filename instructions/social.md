# Project Overview

The Social Calendar App is designed for marketing teams to create and manage social media posts for their customers' Etsy listings. It provides a user-friendly interface to schedule posts across multiple platforms and visualize the content calendar.

## Core Functionalities

### 1. Customer Management
- Admins can select from a list of customers from the dropdown. These customers are in the customers collection in Firestore database.
- Each customer has a unique ID, name, and logo. The unique ID is in the customer_ID field, the name is store_owner_name.
- Customer information is displayed prominently when selected

### 2. Etsy Listing Management
- Display a table of Etsy listings for the selected customer
- Include listing ID, title, and scheduled post date (if any)
- Implement search functionality to filter listings by ID or title
- Limit initial display to 5 listings with the ability to scroll for more
- Limit initial display to 5 listings with the ability to scroll for more

### 3. Post Creation and Scheduling
- Allow users to select a date for posting via a calendar interface
- Provide options to post on Facebook, Instagram, or both platforms
- Generate platform-specific content for each post by using OpenAI
- Display a confirmation dialog before creating a post
- The post should be saved in a subcollection under customer collection called social in Firestore


### 4. Calendar View
- Show a monthly calendar view of scheduled posts
- Allow navigation between months
- Display post indicators on relevant dates
- Implement drag-and-drop functionality to reschedule posts

### 5. Upcoming Posts List
- When an indicator on the social calendar is clicked, it should open a dialog to display the post date, platform, and content preview on the right side of the screen.

## Sample Code to use but ignore the UI imports for now and just use the logic

"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Facebook, Instagram, ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"

type Customer = {
  id: string
  name: string
  logo: string
  listings: EtsyListing[]
}

type EtsyListing = {
  id: string
  title: string
  price: string
}

type Post = {
  id: string
  content: string
  date: Date
  platform: "facebook" | "instagram" | "both"
  listingId: string
}

const customers: Customer[] = [
  {
    id: "1",
    name: "Handmade Haven",
    logo: "/placeholder.svg?height=50&width=50",
    listings: [
      { id: "1", title: "Handmade Ceramic Mug", price: "$25.00" },
      { id: "2", title: "Vintage Leather Journal", price: "$35.00" },
      { id: "3", title: "Custom Wood Sign", price: "$45.00" },
      { id: "4", title: "Knitted Wool Scarf", price: "$30.00" },
      { id: "5", title: "Handcrafted Soap Set", price: "$20.00" },
      { id: "6", title: "Embroidered Pillow Cover", price: "$40.00" },
      { id: "7", title: "Wooden Cutting Board", price: "$55.00" },
      { id: "8", title: "Hand-Painted Ceramic Vase", price: "$60.00" },
      { id: "9", title: "Macramé Wall Hanging", price: "$50.00" },
      { id: "10", title: "Handmade Leather Wallet", price: "$70.00" },
    ],
  },
  {
    id: "2",
    name: "Eco Essentials",
    logo: "/placeholder.svg?height=50&width=50",
    listings: [
      { id: "1", title: "Reusable Bamboo Utensils", price: "$15.00" },
      { id: "2", title: "Organic Cotton Tote Bag", price: "$22.00" },
      { id: "3", title: "Beeswax Food Wraps", price: "$18.00" },
      { id: "4", title: "Stainless Steel Water Bottle", price: "$28.00" },
      { id: "5", title: "Biodegradable Phone Case", price: "$32.00" },
      { id: "6", title: "Bamboo Toothbrush Set", price: "$12.00" },
      { id: "7", title: "Reusable Produce Bags", price: "$16.00" },
      { id: "8", title: "Natural Loofah Sponge", price: "$8.00" },
      { id: "9", title: "Organic Cotton Napkins", price: "$24.00" },
      { id: "10", title: "Solar-Powered Lantern", price: "$35.00" },
    ],
  },
  {
    id: "3",
    name: "Vintage Vibes",
    logo: "/placeholder.svg?height=50&width=50",
    listings: [
      { id: "1", title: "Retro Record Player", price: "$150.00" },
      { id: "2", title: "Vintage Polaroid Camera", price: "$85.00" },
      { id: "3", title: "Antique Brass Compass", price: "$40.00" },
      { id: "4", title: "Mid-Century Modern Clock", price: "$65.00" },
      { id: "5", title: "Classic Vinyl Records Set", price: "$55.00" },
      { id: "6", title: "Vintage Typewriter", price: "$120.00" },
      { id: "7", title: "Retro Rotary Telephone", price: "$75.00" },
      { id: "8", title: "Antique World Map", price: "$90.00" },
      { id: "9", title: "Vintage Leather Suitcase", price: "$110.00" },
      { id: "10", title: "Classic Film Camera", price: "$95.00" },
    ],
  },
]

export default function Component() {
  const [selectedCustomer, setSelectedCustomer] = useState<string>(customers[0].id)
  const [listings, setListings] = useState<EtsyListing[]>(customers[0].listings)
  const [filteredListings, setFilteredListings] = useState<EtsyListing[]>(customers[0].listings)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [currentListing, setCurrentListing] = useState<EtsyListing | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<"facebook" | "instagram" | "both">("facebook")
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const customer = customers.find(c => c.id === selectedCustomer)
    if (customer) {
      setListings(customer.listings)
      setFilteredListings(customer.listings)
    }
  }, [selectedCustomer])

  useEffect(() => {
    const filtered = listings.filter(listing => 
      listing.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredListings(filtered)
  }, [searchQuery, listings])

  const generatePost = (listing: EtsyListing, platform: "facebook" | "instagram" | "both", date: Date) => {
    const createPost = (plt: "facebook" | "instagram") => ({
      id: `post-${listing.id}-${plt}-${Date.now()}`,
      content: plt === "facebook"
        ? `Check out our ${listing.title}! 🛍️ Perfect for your home or as a gift. Shop now on our Etsy store! #Handmade #EtsyFind`
        : `✨ New arrival! ${listing.title} 🛒 Tap the link in bio to shop. #Etsy #Handmade #ShopSmall`,
      date: date,
      platform: plt,
      listingId: listing.id,
    })

    if (platform === "both") {
      setPosts([...posts, createPost("facebook"), createPost("instagram")])
    } else {
      setPosts([...posts, createPost(platform)])
    }
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const newPosts = Array.from(posts)
    const [reorderedPost] = newPosts.splice(result.source.index, 1)
    const newDate = new Date(result.destination.droppableId)
    reorderedPost.date = newDate
    newPosts.splice(result.destination.index, 0, reorderedPost)

    setPosts(newPosts)
  }

  const sortedPosts = [...posts].sort((a, b) => a.date.getTime() - b.date.getTime())
  const currentCustomer = customers.find(c => c.id === selectedCustomer)

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const mockDataForMonths: { [key: string]: Post[] } = {
    "2024-08": [
      { id: "mock1", content: "August Post 1", date: new Date(2024, 7, 5), platform: "facebook", listingId: "1" },
      { id: "mock2", content: "August Post 2", date: new Date(2024, 7, 15), platform: "instagram", listingId: "2" },
    ],
    "2024-09": [
      { id: "mock3", content: "September Post 1", date: new Date(2024, 8, 10), platform: "facebook", listingId: "3" },
      { id: "mock4", content: "September Post 2", date: new Date(2024, 8, 20), platform: "instagram", listingId: "4" },
    ],
    "2024-11": [
      { id: "mock5", content: "November Post 1", date: new Date(2024, 10, 7), platform: "facebook", listingId: "5" },
      { id: "mock6", content: "November Post 2", date: new Date(2024, 10, 25), platform: "instagram", listingId: "1" },
    ],
  }

  const currentMonthKey = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`
  const currentMonthPosts = [...posts, ...(mockDataForMonths[currentMonthKey] || [])]

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Social Calendar</h1>
          {currentCustomer && (
            <div className="flex items-center space-x-2">
              <Image
                src={currentCustomer.logo}
                alt={`${currentCustomer.name} logo`}
                width={50}
                height={50}
                className="rounded-full"
              />
              <span className="font-semibold">{currentCustomer.name}</span>
            </div>
          )}
        </div>
        <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search by Listing ID or Title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-sm"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Listing ID</TableHead>
                <TableHead className="w-[300px]">Title</TableHead>
                <TableHead className="w-[200px]">Scheduled Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredListings.map((listing) => {
                const scheduledPost = posts.find(post => post.listingId === listing.id)
                return (
                  <TableRow key={listing.id}>
                    <TableCell>{listing.id}</TableCell>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>
                      {scheduledPost ? (
                        <div className="flex items-center space-x-2">
                          {scheduledPost.platform === "facebook" ? (
                            <Facebook className="w-4 h-4 text-blue-600" />
                          ) : scheduledPost.platform === "instagram" ? (
                            <Instagram className="w-4 h-4 text-pink-600" />
                          ) : (
                            <>
                              <Facebook className="w-4 h-4 text-blue-600" />
                              <Instagram className="w-4 h-4 text-pink-600" />
                            </>
                          )}
                          <span>{scheduledPost.date.toLocaleDateString()}</span>
                        </div>
                      ) : (
                        'Not scheduled'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setCurrentListing(listing)}>
                            Choose Date
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Choose Publishing Date and Platform</DialogTitle>
                          </DialogHeader>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                          />
                          <RadioGroup
                            defaultValue="facebook"
                            onValueChange={(value) => setSelectedPlatform(value as "facebook" | "instagram" | "both")}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="facebook" id="facebook" />
                              <Label htmlFor="facebook">Facebook</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="instagram" id="instagram" />
                              <Label htmlFor="instagram">Instagram</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="both" id="both" />
                              <Label htmlFor="both">Both</Label>
                            </div>
                          </RadioGroup>
                          <DialogFooter>
                            <Button onClick={() => {
                              if (currentListing && selectedDate) {
                                generatePost(currentListing, selectedPlatform, selectedDate)
                                
                                setIsDateDialogOpen(false)
                              }
                            }}>
                              Create
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white shadow-md rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Calendar View</h2>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <Button variant="outline" size="sm" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - currentMonth.getDay() + 1)
                return (
                  <Droppable key={date.toISOString()} droppableId={date.toISOString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`aspect-square border rounded-lg p-2 flex flex-col ${
                          snapshot.isDraggingOver ? "bg-gray-100" : ""
                        } ${date.getMonth() !== currentMonth.getMonth() ? "bg-gray-50" : ""}`}
                      >
                        <span className="text-sm font-medium">{date.getDate()}</span>
                        {currentMonthPosts
                          .filter(
                            (post) =>
                              post.date.getDate() === date.getDate() &&
                              post.date.getMonth() === date.getMonth() &&
                              post.date.getFullYear() === date.getFullYear()
                          )
                          .map((post, index) => (
                            <Draggable key={post.id} draggableId={post.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mt-1 text-xs p-1 rounded flex items-center ${
                                    post.platform === "facebook" ? "bg-blue-100" : "bg-pink-100"
                                  } ${snapshot.isDragging ? "opacity-50" : ""}`}
                                >
                                  {post.platform === "facebook" ? (
                                    <Facebook className="w-3 h-3 mr-1" />
                                  ) : (
                                    <Instagram className="w-3 h-3 mr-1" />
                                  )}
                                  {post.content.substring(0, 15)}...
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Upcoming Posts</h2>
            <ScrollArea className="h-[600px] pr-4">
              {sortedPosts.map((post) => (
                <div key={post.id} className="mb-4 p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      {post.date.toLocaleDateString()}
                    </span>
                    {post.platform === "facebook" ? (
                      <Facebook className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Instagram className="w-4 h-4 text-pink-600" />
                    )}
                  </div>
                  <p className="text-sm">{post.content}</p>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}

