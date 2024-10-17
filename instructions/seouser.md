# Product Requirements Document: Listing Optimization User Interface

The Listing Optimization provides a user-friendly interface for users to view and search the optimized product listings that the admins did for them.
## Core Functionalities

### 1. Listings Table
- Display a comprehensive table of product listings that were done by the admins for the logged in user. Fetch listings from the database on the listings collection
- Columns to display: Image, Listing ID, Listing Details, Date Optimized. These are the equivalent fields in the database:
    - Listing ID: listingID
    - Listing Details with collapsible sections: 
        Old Title: listingTitle
        Old Description: listingDescription
        Old Tags: listingTags
        New Title: optimizedTitle
        New Description: optimizedDescription
        New Tags: optimizedTags
    - Date Optimized: optimizationDate
- Only show the listings that are optimized (optimizationStatus is true) but only if the listing has either optimizedTitle, optimizedDescription, or optimizedTags (either one of them is not empty). If the listing doesn't have any of these fields, then don't show it even if the optimizationStatus is true.

### 2. Listing Search and Pagination
- Enable search functionality by Listing ID or Title
- Display 10 listings per page
- Implement pagination controls (Previous and Next buttons)
- Show current page number and total number of pages

### 3. Detailed Optimization Details
  - Implement collapsible sections for title, description, and tag changes
  - Show clear before-and-after comparisons for each optimization type

## Sample Code to use but ignore the UI imports for now and just use the logic

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const initialTasks = [
  { 
    id: 1, 
    listingId: 1001, 
    dateAdded: '2024-09-01', 
    oldTitle: 'Ceramic Mug',
    newTitle: 'Handmade Artisanal Ceramic Mug', 
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ceramic-mug-Wd9Yt7Rl5Ue5Uy9Uy1Uy2.jpg', 
    oldTags: ['mug', 'ceramic'],
    tags: ['trending keywords', 'product benefits', 'unique selling points'], 
    type: 'title',
    oldDescription: 'A handmade ceramic mug.',
    newDescription: 'Elevate your daily ritual with our artisanal handmade ceramic mug. Each piece is uniquely crafted, offering a perfect blend of rustic charm and modern elegance. Ideal for your morning coffee or evening tea, this mug doesn\'t just hold your beverage – it enhances the entire experience.'
  },
  { 
    id: 2, 
    listingId: 1002, 
    dateAdded: '2024-09-03', 
    oldTitle: 'Leather Journal',
    newTitle: 'Vintage Handcrafted Leather Journal', 
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/leather-journal-Wd9Yt7Rl5Ue5Uy9Uy1Uy3.jpg', 
    oldTags: ['journal', 'leather', 'vintage'],
    tags: ['lifestyle photos', 'usage context', 'detail shots'], 
    type: 'image',
    oldDescription: 'A leather-bound journal.',
    newDescription: 'Capture your thoughts in timeless style with our vintage leather journal. Crafted from premium, supple leather, this journal ages beautifully, developing a unique patina that tells your story. Perfect for writers, travelers, or anyone who appreciates the tactile pleasure of pen on paper.'
  },
  { 
    id: 3, 
    listingId: 1003, 
    dateAdded: '2024-09-05', 
    oldTitle: 'Wall Hanging',
    newTitle: 'Bohemian Macrame Wall Hanging', 
    image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/macrame-wall-hanging-Wd9Yt7Rl5Ue5Uy9Uy1Uy4.jpg', 
    oldTags: ['wall hanging', 'macrame'],
    tags: ['boho', 'home decor', 'handmade', 'wall art'], 
    type: 'tags',
    oldDescription: 'A macrame wall hanging.',
    newDescription: 'Transform your space with our bohemian-inspired macrame wall hanging. Hand-knotted with care, this intricate piece adds texture, warmth, and a touch of artisanal charm to any room. Its neutral tones complement a variety of decor styles, making it a versatile addition to your home.'
  },
]

export default function UserMonthlyListingOptimization() {
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState('')

  const filteredTasks = tasks.filter(task =>
    task.newTitle.toLowerCase().includes(search.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Listing Optimization Tasks</h1>
      
      <div className="mb-6 relative max-w-md mx-auto">
        <Input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pr-10 rounded-full"
        />
        <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      <ScrollArea className="h-[calc(100vh-200px)] rounded-lg border-none">
        {filteredTasks.map(task => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <OptimizationTask task={task} />
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  )
}

function OptimizationTask({ task }) {
  return (
    <Card className="mb-4 overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="w-full sm:w-1/4 h-32 sm:h-full relative">
            <img src={task.image} alt={task.newTitle} className="w-full h-full object-cover" />
            <Badge className="absolute top-2 left-2 bg-black bg-opacity-50 text-white">
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </Badge>
          </div>
          <div className="w-full sm:w-1/4 p-4 flex flex-col items-start">
            <h4 className="text-sm font-semibold mb-1">Listing ID:</h4>
            <p className="text-base">{task.listingId}</p>
          </div>
          <div className="w-full sm:w-2/4 p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-semibold">{task.newTitle}</h3>
              <div className="text-xs text-muted-foreground">
                <span className="mr-2">ID: {task.listingId}</span>
                <span>{task.dateAdded}</span>
              </div>
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="title">
                <AccordionTrigger className="text-sm">Title Changes</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h4 className="text-xs font-semibold mb-1">Old Title:</h4>
                      <p className="text-xs text-muted-foreground">{task.oldTitle}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-1">New Title:</h4>
                      <p className="text-xs text-muted-foreground">{task.newTitle}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tags">
                <AccordionTrigger className="text-sm">Tags</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="description">
                <AccordionTrigger className="text-sm">Description Changes</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <h4 className="text-xs font-semibold mb-1">Old Description:</h4>
                      <p className="text-xs text-muted-foreground">{task.oldDescription}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-1">New Description:</h4>
                      <p className="text-xs text-muted-foreground">{task.newDescription}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}