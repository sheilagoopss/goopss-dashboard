import React, { useState, useEffect, useMemo } from 'react'
import { collection, getDocs, query, where, updateDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { Listing, ListingImage } from '../types/Listing'
import { Layout, Card, Button, Input, Select, Spin, Pagination, Modal, Tabs, Checkbox, message, Form } from 'antd'
import { CheckOutlined, CloseOutlined, DownloadOutlined, ZoomInOutlined, RightOutlined } from '@ant-design/icons'

const { Header, Content } = Layout
const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

const ITEMS_PER_PAGE = 10

const ImageModal: React.FC<{ visible: boolean; onClose: () => void; imageUrl: string; title: string }> = ({ visible, onClose, imageUrl, title }) => (
  <Modal visible={visible} onCancel={onClose} footer={null} width={800}>
    <img src={imageUrl} alt={title} style={{ width: '100%', height: 'auto' }} />
  </Modal>
)

const DesignCard: React.FC<{
  design: ListingImage;
  onApprove: (id: string) => void;
  onRevise: (id: string, note: string) => void;
  onSelect: (id: string, isSelected: boolean) => void;
  isSelected: boolean;
  showCheckbox: boolean;
}> = ({ design, onApprove, onRevise, onSelect, isSelected, showCheckbox }) => {
  const [isRevising, setIsRevising] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsImageModalOpen(true)
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(design.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${design.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  const handleRevisionSubmit = () => {
    form.validateFields().then(values => {
      onRevise(design.id, values.revisionNote)
      setIsRevising(false)
      form.resetFields()
    })
  }

  return (
    <Card
      hoverable
      style={{ width: 200 }}
      cover={
        <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
          <img
            alt={design.id}
            src={design.url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onClick={handleImageClick}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: design.status === 'approved' ? '#52c41a' : design.status === 'revision' ? '#faad14' : '#1890ff',
            color: 'white',
            padding: '2px 8px',
            borderBottomLeftRadius: 4
          }}>
            {design.status}
          </div>
        </div>
      }
      actions={[
        <Button icon={<CheckOutlined />} onClick={() => onApprove(design.id)} disabled={design.status === 'approved'} />,
        <Button icon={<CloseOutlined />} onClick={() => setIsRevising(true)} disabled={design.status === 'revision'} />,
        <Button icon={<DownloadOutlined />} onClick={handleDownload} />,
      ]}
    >
      <Card.Meta
        title={design.id}
        description={
          <>
            <p>Date: {
              design.statusChangeDate 
                ? new Date(design.statusChangeDate).toLocaleDateString()
                : 'N/A'
            }</p>
            {design.revisionNote && <p>Revision: {design.revisionNote}</p>}
            {showCheckbox && (
              <Checkbox checked={isSelected} onChange={(e) => onSelect(design.id, e.target.checked)}>
                Select
              </Checkbox>
            )}
          </>
        }
      />
      <Modal
        title="Request Revision"
        visible={isRevising}
        onOk={handleRevisionSubmit}
        onCancel={() => setIsRevising(false)}
      >
        <Form form={form}>
          <Form.Item
            name="revisionNote"
            rules={[{ required: true, message: 'Please enter revision notes' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter revision notes" />
          </Form.Item>
        </Form>
      </Modal>
      <ImageModal
        visible={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={design.url}
        title={design.id}
      />
    </Card>
  )
}

const ListingGroup: React.FC<{
  listingName: string;
  designs: ListingImage[];
  onApprove: (id: string) => void;
  onRevise: (id: string, note: string) => void;
  onSelect: (id: string, isSelected: boolean) => void;
  selectedDesigns: Set<string>;
  showCheckboxes: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ listingName, designs, onApprove, onRevise, onSelect, selectedDesigns, showCheckboxes, isExpanded, onToggle }) => {
  return (
    <Card
      title={
        <div onClick={onToggle} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <span>{listingName}</span>
          <RightOutlined style={{ marginLeft: 'auto', transform: isExpanded ? 'rotate(90deg)' : 'none' }} />
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      {isExpanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              onApprove={onApprove}
              onRevise={onRevise}
              onSelect={onSelect}
              isSelected={selectedDesigns.has(design.id)}
              showCheckbox={showCheckboxes}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

interface UserDesignHubProps {
  customerId: string;
}

const UserDesignHub: React.FC<UserDesignHubProps> = ({ customerId }) => {
  const [allDesigns, setAllDesigns] = useState<Record<string, Listing>>({})
  const [listingImages, setListingImages] = useState<Record<string, ListingImage[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selectedDesigns, setSelectedDesigns] = useState(new Set<string>())
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [activeTab, setActiveTab] = useState('to-approve')
  const [loading, setLoading] = useState(false)
  const [expandedListings, setExpandedListings] = useState(new Set<string>())

  useEffect(() => {
    if (customerId) {
      fetchCustomerListings(customerId)
    }
  }, [customerId])

  useEffect(() => {
    if (customerId) {
      fetchImagesForStatus(customerId, statusFilter)
    }
  }, [customerId, statusFilter])

  const fetchCustomerListings = async (customerId: string) => {
    setLoading(true)
    try {
      const listingsRef = collection(db, 'listings')
      const q = query(
        listingsRef, 
        where('customer_id', '==', customerId),
        where('hasImage', '==', true)
      )
      const querySnapshot = await getDocs(q)
      
      const listings: Record<string, Listing> = {}
      querySnapshot.docs.forEach(doc => {
        listings[doc.id] = { id: doc.id, ...doc.data() } as Listing
      })
      setAllDesigns(listings)

      await fetchImagesForStatus(customerId, statusFilter)
    } catch (error) {
      console.error("Error fetching customer listings:", error)
      message.error("Failed to fetch listings")
    } finally {
      setLoading(false)
    }
  }

  const fetchImagesForStatus = async (customerId: string, status: string) => {
    setLoading(true)
    try {
      const imagesRef = collection(db, 'images')
      const imagesQuery = query(
        imagesRef, 
        where('customer_id', '==', customerId),
        status === 'all' ? where('status', 'in', ['pending', 'approved', 'revision']) : where('status', '==', status)
      )
      const imagesSnapshot = await getDocs(imagesQuery)
      
      const newImages: Record<string, ListingImage[]> = {}
      imagesSnapshot.docs.forEach(doc => {
        const image = { id: doc.id, ...doc.data() } as ListingImage
        if (image.listing_id) {
          if (!newImages[image.listing_id]) {
            newImages[image.listing_id] = []
          }
          newImages[image.listing_id].push(image)
        }
      })

      setListingImages(newImages)
    } catch (error) {
      console.error("Error fetching images:", error)
      message.error("Failed to fetch images")
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = useMemo(() => {
    return Object.entries(allDesigns)
      .filter(([id, listing]) => {
        const matchesSearch = 
          listing.listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          listing.listingID.toLowerCase().includes(searchTerm.toLowerCase())
        
        const listingImagesArray = listingImages[id] || []
        
        let matchesStatus = true
        if (statusFilter !== 'all') {
          matchesStatus = listingImagesArray.some(img => img.status === statusFilter)
        }
        
        return matchesSearch && matchesStatus
      })
      .sort(([, a], [, b]) => {
        const aImages = listingImages[a.id] || [];
        const bImages = listingImages[b.id] || [];
        const aDate = aImages[0]?.statusChangeDate;
        const bDate = bImages[0]?.statusChangeDate;

        if (sortOrder === 'newest') {
          return (bDate ? new Date(bDate).getTime() : 0) - (aDate ? new Date(aDate).getTime() : 0);
        } else {
          return (aDate ? new Date(aDate).getTime() : 0) - (bDate ? new Date(bDate).getTime() : 0);
        }
      })
  }, [allDesigns, listingImages, searchTerm, statusFilter, sortOrder])

  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredListings.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredListings, currentPage])

  const handleApprove = async (imageId: string) => {
    try {
      const imageRef = doc(db, 'images', imageId)
      await updateDoc(imageRef, { 
        status: 'approved',
        statusChangeDate: serverTimestamp()
      })

      setListingImages(prev => {
        const newImages = { ...prev }
        for (const listingId in newImages) {
          newImages[listingId] = newImages[listingId].map(img => 
            img.id === imageId ? { ...img, status: 'approved', statusChangeDate: new Date() } : img
          )
        }
        return newImages
      })

      message.success('Image approved successfully')
    } catch (error) {
      console.error('Error approving image:', error)
      message.error('Failed to approve image')
    }
  }

  const handleRevise = async (imageId: string, revisionNote: string) => {
    try {
      const imageRef = doc(db, 'images', imageId)
      await updateDoc(imageRef, { 
        status: 'revision',
        statusChangeDate: serverTimestamp(),
        revisionNote: revisionNote
      })

      setListingImages(prev => {
        const newImages = { ...prev }
        for (const listingId in newImages) {
          newImages[listingId] = newImages[listingId].map(img => 
            img.id === imageId ? { ...img, status: 'revision', revisionNote: revisionNote, statusChangeDate: new Date() } : img
          )
        }
        return newImages
      })

      message.success('Revision request submitted successfully')
    } catch (error) {
      console.error('Error submitting revision request:', error)
      message.error('Failed to submit revision request')
    }
  }

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedDesigns(prev => {
      const newSet = new Set(prev)
      if (isSelected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleBatchApprove = async () => {
    try {
      const batch = writeBatch(db)
      selectedDesigns.forEach(imageId => {
        const imageRef = doc(db, 'images', imageId)
        batch.update(imageRef, { 
          status: 'approved',
          statusChangeDate: serverTimestamp()
        })
      })

      await batch.commit()

      setListingImages(prev => {
        const newImages = { ...prev }
        for (const listingId in newImages) {
          newImages[listingId] = newImages[listingId].map(img => 
            selectedDesigns.has(img.id) ? { ...img, status: 'approved', statusChangeDate: new Date() } : img
          )
        }
        return newImages
      })

      setSelectedDesigns(new Set())
      message.success('Batch approval successful')
    } catch (error) {
      console.error('Error in batch approval:', error)
      message.error('Failed to approve selected images')
    }
  }

  const toggleListingExpansion = (listingId: string) => {
    setExpandedListings(prev => {
      const newSet = new Set(prev)
      if  (newSet.has(listingId)) {
        newSet.delete(listingId)
      } else {
        newSet.add(listingId)
      }
      return newSet
    })
  }

  return (
    <Layout>
      <Header style={{ background: '#fff', padding: '0 16px' }}>
        <h1>Design Hub</h1>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 16 }}>
          <TabPane tab="To Approve" key="to-approve" />
          <TabPane tab="For Revision" key="for-revision" />
          <TabPane tab="Approved" key="approved" />
        </Tabs>
        
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Search
              placeholder="Search listings..."
              onSearch={value => setSearchTerm(value)}
              style={{ width: 200, marginRight: 16 }}
            />
            <Select
              defaultValue="pending"
              style={{ width: 120, marginRight: 16 }}
              onChange={value => setStatusFilter(value)}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="revision">Revision</Option>
            </Select>
            <Select
              defaultValue="newest"
              style={{ width: 120 }}
              onChange={(value: 'newest' | 'oldest') => setSortOrder(value)}
            >
              <Option value="newest">Newest First</Option>
              <Option value="oldest">Oldest First</Option>
            </Select>
          </div>
          {activeTab === 'to-approve' && (
            <Button
              type="primary"
              onClick={handleBatchApprove}
              disabled={selectedDesigns.size === 0}
            >
              Approve Selected ({selectedDesigns.size})
            </Button>
          )}
        </div>
        
        {loading ? (
          <Spin size="large" />
        ) : (
          <>
            {paginatedListings.map(([listingId, listing]) => (
              <ListingGroup
                key={listingId}
                listingName={listing.listingTitle}
                designs={listingImages[listingId] || []}
                onApprove={handleApprove}
                onRevise={handleRevise}
                onSelect={handleSelect}
                selectedDesigns={selectedDesigns}
                showCheckboxes={activeTab === 'to-approve'}
                isExpanded={expandedListings.has(listingId)}
                onToggle={() => toggleListingExpansion(listingId)}
              />
            ))}
            <Pagination
              current={currentPage}
              total={filteredListings.length}
              pageSize={ITEMS_PER_PAGE}
              onChange={setCurrentPage}
              style={{ marginTop: 16, textAlign: 'center' }}
            />
          </>
        )}
      </Content>
    </Layout>
  )
}

export default UserDesignHub;