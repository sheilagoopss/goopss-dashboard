# Product Requirements Document: Customers  Management System

## The customer management page is a web-based application designed to help manage and track Etsy store owners, their packages, and relevant data. This system aims to streamline the process of managing both paying and free customers, providing an efficient interface for administrators to view, edit, and analyze store owner information.

## Core Functionalities

#### 1. Customer List

- Display a table of store owners with key information
- Implement sorting functionality for all columns
- Allow expanding rows to view additional details
- Separate views for paying and free customers

#### 2. Customer Information
These information should also be synced to the Firestore database in the "customers" collection.

- Store Name (Firestore field: store_name)
- Owner Name (Firestore field: store_owner_name)
- Email (Firestore field: email)
- Phone (Firestore field: phone)
- Date Joined (Firestore field: date_joined)
- Package Type (Firestore field: package_type)
    - Social
    - Maintenance
    - Extended Maintenance
    - Accelerator - Basic
    - Accelerator - Standard
    - Free
- Products Count (Firestore field: products_count)
- Notes (Firestore field: notes)
- Weeks (for paying customers) (Firestore field: weeks)
- Lists (for paying customers) (Firestore field: lists)
- Sales When Joined (for paying customers) (Firestore field: sales_when_joined)
- Current Sales (for paying customers) (Firestore field: current_sales)

#### 3. Adding New Customers

- Provide a form to add new customers with all relevant fields
- Allow selection of package type during customer creation

#### 4. Editing Customer Information

- Implement in-line editing for all customer fields
- Provide a global edit mode to modify multiple customers simultaneously

#### 5. Exporting Data

- Allow exporting of store owners list in csv format

### 6. Search and Filter

- Implement a search functionality to find specific store owners
- Allow filtering based on various criteria (e.g., package type, join date)

### 3.5 Analytics and Quick Actions

- Display total count of store owners, paying customers, and free customers
- Provide quick action buttons for common tasks (SEO, Design Hub, Store Analysis, Social)

## Sample Code to use but ignore the UI imports for now and just use the logic

"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Search, Store, Check, Edit2, ArrowUpDown, ChevronDown, ChevronUp, SearchIcon, Palette, BarChart2, Share2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Package = "Social" | "Maintenance" | "Extended Maintenance" | "Accelerator - Basic" | "Accelerator - Standard" | "Free"

type StoreOwner = {
  id: string
  storeName: string
  ownerName: string
  email: string
  phone: string
  dateJoined: string
  package: Package
  products: number
  notes: string
  weeks: number
  lists: number
  salesWhenJoined: number
  currentSales: number
}

type SortConfig = {
  key: keyof StoreOwner
  direction: 'ascending' | 'descending'
}

const packageOptions: Package[] = ["Social", "Maintenance", "Extended Maintenance", "Accelerator - Basic", "Accelerator - Standard", "Free"]

export default function Component() {
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([
    {
      id: "1",
      storeName: "AnneRaphaelParis (Yuval)",
      ownerName: "Yuval",
      email: "yuval@anneraphael.com",
      phone: "+1 (555) 123-4567",
      dateJoined: "30 Sep 2024",
      package: "Accelerator - Standard",
      products: 25,
      notes: "Specializes in vintage-inspired jewelry",
      weeks: 0,
      lists: 0,
      salesWhenJoined: 0,
      currentSales: 0,
    },
    {
      id: "2",
      storeName: "SillyShinyDiamonds (Shanie)",
      ownerName: "Shanie",
      email: "shanie@sillyshiny.com",
      phone: "+1 (555) 234-5678",
      dateJoined: "24 Sep 2024",
      package: "Free",
      products: 25,
      notes: "Focuses on quirky, colorful accessories",
      weeks: 1,
      lists: 0,
      salesWhenJoined: 0,
      currentSales: 0,
    },
    {
      id: "3",
      storeName: "AchambhaStudio (Einat)",
      ownerName: "Einat",
      email: "einat@achambha.com",
      phone: "+1 (555) 345-6789",
      dateJoined: "10 Sep 2024",
      package: "Maintenance",
      products: 25,
      notes: "Handmade pottery and ceramics",
      weeks: 4,
      lists: 0,
      salesWhenJoined: 0,
      currentSales: 0,
    },
    {
      id: "4",
      storeName: "NatanCooperArt (Natan)",
      ownerName: "Natan",
      email: "natan@cooperart.com",
      phone: "+1 (555) 456-7890",
      dateJoined: "28 Aug 2024",
      package: "Free",
      products: 25,
      notes: "Digital art prints and posters",
      weeks: 6,
      lists: 0,
      salesWhenJoined: 130,
      currentSales: 130,
    },
    {
      id: "5",
      storeName: "Anukprintshop (Anna)",
      ownerName: "Anna",
      email: "anna@anukprint.com",
      phone: "+1 (555) 567-8901",
      dateJoined: "28 Aug 2024",
      package: "Extended Maintenance",
      products: 25,
      notes: "Custom printable designs and templates",
      weeks: 6,
      lists: 0,
      salesWhenJoined: 8,
      currentSales: 8,
    },
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'storeName', direction: 'ascending' })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [newCustomer, setNewCustomer] = useState<StoreOwner>({
    id: "",
    storeName: "",
    ownerName: "",
    email: "",
    phone: "",
    dateJoined: new Date().toISOString().split('T')[0],
    package: "Free",
    products: 0,
    notes: "",
    weeks: 0,
    lists: 0,
    salesWhenJoined: 0,
    currentSales: 0,
  })

  const updateField = (id: string, field: keyof StoreOwner, value: string | number) => {
    setStoreOwners(storeOwners.map(owner => {
      if (owner.id === id) {
        return { ...owner, [field]: value }
      }
      return owner
    }))
  }

  const sortedStoreOwners = useMemo(() => {
    let sortableItems = [...storeOwners]
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key]
        let bValue = b[sortConfig.key]
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [storeOwners, sortConfig])

  const requestSort = (key: keyof StoreOwner) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const toggleExpandedRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  const addNewCustomer = () => {
    setStoreOwners([...storeOwners, { ...newCustomer, id: (storeOwners.length + 1).toString() }])
    setNewCustomer({
      id: "",
      storeName: "",
      ownerName: "",
      email: "",
      phone: "",
      dateJoined: new Date().toISOString().split('T')[0],
      package: "Free",
      products: 0,
      notes: "",
      weeks: 0,
      lists: 0,
      salesWhenJoined: 0,
      currentSales: 0,
    })
  }

  const EditableCell = ({ value, onSave, type = "text" }: { value: string | number, onSave: (value: string | number) => void, type?: string }) => {
    const [editValue, setEditValue] = useState(value)

    const handleSave = () => {
      onSave(type === "number" ? Number(editValue) : editValue)
    }

    if (isEditing) {
      return (
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          className="w-full"
        />
      )
    }

    return <span>{value}</span>
  }

  const PackageSelect = ({ value, onSave }: { value: Package, onSave: (value: Package) => void }) => {
    if (isEditing) {
      return (
        <Select defaultValue={value} onValueChange={(value) => onSave(value as Package)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select package" />
          </SelectTrigger>
          <SelectContent>
            {packageOptions.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return <span>{value}</span>
  }

  const PayingCustomerTable = ({ customers }: { customers: StoreOwner[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30px]"></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('storeName')}>
            Store Name {sortConfig.key === 'storeName' && <ArrowUpDown className="inline ml-2 h-4 w-4" />}
          </TableHead>
          <TableHead>Owner Name</TableHead>
          <TableHead>Package</TableHead>
          <TableHead>Current Sales</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((owner) => (
          <>
            <TableRow 
              key={owner.id} 
              className={`cursor-pointer ${expandedRow === owner.id ? 'bg-gray-100' : ''}`} 
              onClick={() => toggleExpandedRow(owner.id)}
            >
              <TableCell>
                {expandedRow === owner.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </TableCell>
              <TableCell><EditableCell value={owner.storeName} onSave={(value) => updateField(owner.id, 'storeName', value)} /></TableCell>
              <TableCell><EditableCell value={owner.ownerName} onSave={(value) => updateField(owner.id, 'ownerName', value)} /></TableCell>
              <TableCell><PackageSelect value={owner.package} onSave={(value) => updateField(owner.id, 'package', value)} /></TableCell>
              <TableCell><EditableCell value={owner.currentSales} onSave={(value) => updateField(owner.id, 'currentSales', value)} type="number" /></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </TableCell>
            </TableRow>
            {expandedRow === owner.id && (
              <TableRow className="bg-gray-100">
                <TableCell colSpan={6}>
                  <div className="py-4 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><strong>Phone:</strong> <EditableCell value={owner.phone} onSave={(value) => updateField(owner.id, 'phone', value)} /></p>
                      <p><strong>Email:</strong> <EditableCell value={owner.email} onSave={(value) => updateField(owner.id, 'email', value)} /></p>
                      <p><strong>Products:</strong> <EditableCell value={owner.products} onSave={(value) => updateField(owner.id, 'products', value)} type="number" /></p>
                      <p><strong>Notes:</strong> <EditableCell value={owner.notes} onSave={(value) => updateField(owner.id, 'notes', value)} /></p>
                      <p><strong>Sales when Joined:</strong> $<EditableCell value={owner.salesWhenJoined} onSave={(value) => updateField(owner.id, 'salesWhenJoined', value)} type="number" /></p>
                      <p><strong>Date Joined:</strong> <EditableCell value={owner.dateJoined} onSave={(value) => updateField(owner.id, 'dateJoined', value)} /></p>
                      <p><strong>Weeks:</strong> <EditableCell value={owner.weeks} onSave={(value) => updateField(owner.id, 'weeks', value)} type="number" /></p>
                      <p><strong>Lists:</strong> <EditableCell value={owner.lists} onSave={(value) => updateField(owner.id, 'lists', value)} type="number" /></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button size="lg" variant="outline" className="flex items-center justify-center">
                        <SearchIcon className="h-6 w-6 mr-2" />
                        SEO
                      </Button>
                      <Button size="lg" variant="outline" className="flex items-center justify-center">
                        <Palette className="h-6 w-6 mr-2" />
                        Design Hub
                      </Button>
                      <Button size="lg" variant="outline" className="flex items-center justify-center">
                        <BarChart2 className="h-6 w-6 mr-2" />
                        Store Analysis
                      </Button>
                      <Button size="lg" variant="outline" className="flex items-center justify-center">
                        <Share2 className="h-6 w-6 mr-2" />
                        Social
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  )

  const FreeCustomerTable = ({ customers }: { customers: StoreOwner[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30px]"></TableHead>
          <TableHead className="cursor-pointer" onClick={() => requestSort('storeName')}>
            Store Name {sortConfig.key === 'storeName' && <ArrowUpDown className="inline ml-2 h-4 w-4" />}
          </TableHead>
          <TableHead>Owner Name</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((owner) => (
          <>
            <TableRow 
              key={owner.id} 
              
              className={`cursor-pointer ${expandedRow === owner.id ? 'bg-gray-100' : ''}`} 
              onClick={() => toggleExpandedRow(owner.id)}
            >
              <TableCell>
                {expandedRow === owner.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </TableCell>
              <TableCell><EditableCell value={owner.storeName} onSave={(value) => updateField(owner.id, 'storeName', value)} /></TableCell>
              <TableCell><EditableCell value={owner.ownerName} onSave={(value) => updateField(owner.id, 'ownerName', value)} /></TableCell>
              <TableCell>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </TableCell>
            </TableRow>
            {expandedRow === owner.id && (
              <TableRow className="bg-gray-100">
                <TableCell colSpan={4}>
                  <div className="py-4 space-y-2">
                    <p><strong>Email:</strong> <EditableCell value={owner.email} onSave={(value) => updateField(owner.id, 'email', value)} /></p>
                    <p><strong>Phone:</strong> <EditableCell value={owner.phone} onSave={(value) => updateField(owner.id, 'phone', value)} /></p>
                    <p><strong>Date Joined:</strong> <EditableCell value={owner.dateJoined} onSave={(value) => updateField(owner.id, 'dateJoined', value)} /></p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  )

  const payingCustomers = sortedStoreOwners.filter(owner => owner.package !== "Free")
  const freeCustomers = sortedStoreOwners.filter(owner => owner.package === "Free")

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Store className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold">Etsy Store Owners</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-pink-500 hover:bg-pink-600">Add New Customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="storeName" className="text-right">
                  Store Name
                </Label>
                <Input
                  id="storeName"
                  value={newCustomer.storeName}
                  onChange={(e) => setNewCustomer({...newCustomer, storeName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ownerName" className="text-right">
                  Owner Name
                </Label>
                <Input
                  id="ownerName"
                  value={newCustomer.ownerName}
                  onChange={(e) => setNewCustomer({...newCustomer, ownerName: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="package" className="text-right">
                  Package
                </Label>
                <Select
                  value={newCustomer.package}
                  onValueChange={(value: Package) => setNewCustomer({...newCustomer, package: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addNewCustomer}>Add Customer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <p className="text-gray-600">Total store owners: {storeOwners.length}</p>
          <p className="text-gray-600">Paying customers: {payingCustomers.length}</p>
          <p className="text-gray-600">Free customers: {freeCustomers.length}</p>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
            className={isEditing ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
          >
            {isEditing ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit All
              </>
            )}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="text-pink-500 border-pink-500 hover:bg-pink-50">
            Export store owners list
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search store owners..." className="pl-8 w-64" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="paying" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paying">Paying Customers</TabsTrigger>
          <TabsTrigger value="free">Free Customers</TabsTrigger>
        </TabsList>
        <TabsContent value="paying">
          <div className="rounded-md border overflow-x-auto">
            <PayingCustomerTable customers={payingCustomers} />
          </div>
        </TabsContent>
        <TabsContent value="free">
          <div className="rounded-md border overflow-x-auto">
            <FreeCustomerTable customers={freeCustomers} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}