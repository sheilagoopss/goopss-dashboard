import React, {
  useState,
  useEffect,
  useMemo,
  CSSProperties,
  DragEvent,
} from "react";
import {
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  doc,
  getDoc,
  writeBatch,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";
import { Listing, ListingImage } from "../types/Listing";
import { FirebaseError } from "firebase/app";
import { useTaskCreate } from "../hooks/useTask";
import { IAdmin, ICustomer } from "../types/Customer";
import { useAuth } from "../contexts/AuthContext";
import {
  Button,
  Card,
  Col,
  Divider,
  Image,
  message,
  Modal,
  Popconfirm,
  Row,
  Tag,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import FirebaseHelper from "../helpers/FirebaseHelper";
import DragDropUpload from "./common/DragDropUpload";
import CustomersDropdown from "./CustomersDropdown";
import { IImage } from "../types/DesignHub";

// Remove the local Customer interface definition

interface DesignHubProps {
  customerId: string;
  isAdmin: boolean;
}
interface ListingWithImages extends Listing {
  uploadedImages: ListingImage[];
  createdAt: string;
}

const ITEMS_PER_LOAD = 4;

const styles: { [key: string]: CSSProperties } = {
  container: {
    padding: "20px",
  },
  uploadForm: {
    marginBottom: "20px",
  },
  input: {
    marginRight: "10px",
  },
  button: {
    padding: "5px 10px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "20px",
  },
  imageContainer: {
    position: "relative" as const,
  },
  image: {
    width: "100%",
    height: "auto",
    borderRadius: "5px",
  },
  actionButton: {
    padding: "5px 10px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    backgroundColor: "#007bff",
    color: "white",
  },
  statusLabel: {
    position: "absolute" as const,
    top: "5px",
    left: "5px",
    padding: "2px 5px",
    borderRadius: "3px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  listingSelector: {
    marginBottom: "20px",
  },
  listingsTable: {
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1rem",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "auto", // Change from fixed height to auto
    minHeight: "400px", // Set a minimum height
  },
  cardImage: {
    width: "100%",
    height: "200px", // Adjust this value as needed
    overflow: "hidden",
  },
  primaryImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  cardContent: {
    padding: "16px",
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  cardId: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "8px",
    color: "#333",
  },
  cardTitle: {
    fontSize: "14px",
    marginBottom: "8px",
    lineHeight: "1.2em",
    minHeight: "2.4em", // Ensure space for at least 2 lines
    overflow: "hidden",
    color: "#666",
  },
  cardBestseller: {
    fontSize: "14px",
    color: "#28a745",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  uploadedImagesPreview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "5px",
    marginTop: "10px",
    marginBottom: "10px",
    maxHeight: "150px", // Limit the height of the image preview area
    overflowY: "auto", // Add scroll if there are many images
  },
  uploadedImageThumbnail: {
    width: "50px",
    height: "50px",
    objectFit: "cover",
    cursor: "pointer",
  },
  previewModal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  previewImage: {
    maxWidth: "90%",
    maxHeight: "90%",
    objectFit: "contain",
  },
  cardDragging: {
    border: "2px dashed #007bff",
    backgroundColor: "rgba(0, 123, 255, 0.1)",
  },
  dropZone: {
    backgroundColor: "#f0f0f0",
    border: "2px dashed #ccc",
    borderRadius: "4px",
    padding: "20px",
    textAlign: "center",
    color: "#666",
    cursor: "pointer",
    minHeight: "80px", // Reduced height
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px", // Added margin at the bottom
    transition: "background-color 0.3s ease",
  },
  cardFooter: {
    padding: "16px",
    borderTop: "1px solid #ddd",
    display: "flex",
    justifyContent: "space-between",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20px",
  },
  paginationButton: {
    padding: "5px 10px",
    margin: "0 5px",
    backgroundColor: "#007bff",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  pageInfo: {
    margin: "0 10px",
  },
  thumbnailContainer: {
    position: "relative",
    display: "inline-block",
    marginRight: "5px",
    marginBottom: "5px",
  },
  removeButton: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    backgroundColor: "red",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
};

const ImageModal = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}) => (
  <div
    style={{
      display: isOpen ? "flex" : "none",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "90%",
        maxHeight: "90%",
        overflow: "auto",
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>{title}</h2>
      <img
        src={imageUrl}
        alt={title}
        style={{ maxWidth: "100%", maxHeight: "80vh" }}
      />
      <button
        onClick={onClose}
        style={{ marginTop: "10px", padding: "5px 10px" }}
      >
        Close
      </button>
    </div>
  </div>
);

// };

const DesignHub: React.FC<DesignHubProps> = ({ customerId, isAdmin }) => {
  const [images, setImages] = useState<Record<string, IImage[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("revision");
  const [selectedDesigns, setSelectedDesigns] = useState(new Set<string>());
  const [sortOrder, setSortOrder] = useState("newest");
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null,
  );
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [currentRevisionImage, setCurrentRevisionImage] =
    useState<IImage | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionComment, setRevisionComment] = useState("");
  const [customerListings, setCustomerListings] = useState<Listing[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isIndexBuilding, setIsIndexBuilding] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const [customerListingsWithImages, setCustomerListingsWithImages] = useState<
    ListingWithImages[]
  >([]);
  const [previewImage, setPreviewImage] =
    useState<Partial<ListingImage> | null>(null);
  const [localImages, setLocalImages] = useState<Record<string, File[]>>({});
  const [isDragging, setIsDragging] = useState(false);
  const { createTask } = useTaskCreate();
  const { user } = useAuth();
  const [uploadingRevision, setUploadingRevision] = useState(false);
  const [revisionImage, setRevisionImage] = useState<string>();
  const [isAddingRevision, setIsAddingRevision] = useState(false);

  // Add this new state variable
  const [listingImages, setListingImages] = useState<
    Record<string, ListingImage[]>
  >({});

  console.log("DesignHub props:", { customerId, isAdmin });

  const STATUS_COLORS: Record<ListingImage["status"], string> = {
    approved: "green",
    pending: "blue",
    revision: "orange",
    superseded: "red",
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, 'customers');
        let q;
        
        if (isAdmin) {
          q = query(customersCollection);
        } else {
          q = query(customersCollection, where("email", "==", user?.email));
        }

        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ICustomer));
        setCustomers(customersList);

        if (!isAdmin && customersList.length > 0) {
          setSelectedCustomer(customersList[0]);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    fetchCustomers();
  }, [isAdmin, user]);

  useEffect(() => {
    if (isAdmin && selectedCustomer) {
      fetchCustomerListings(selectedCustomer.customer_id);
    }
  }, [isAdmin, selectedCustomer]);

  useEffect(() => {
    const fetchImages = async () => {
      const targetCustomerId = isAdmin
        ? selectedCustomer?.customer_id
        : customerId;
      if (!targetCustomerId) return;

      console.log("Fetching images for customer_id:", targetCustomerId);

      const imagesCollection = collection(db, "images");
      let q;

      if (isAdmin) {
        if (selectedCustomer) {
          console.log("Admin view: fetching images for specific customer");
          q = query(
            imagesCollection,
            where("customer_id", "==", selectedCustomer.customer_id),
          );
        } else {
          console.log("Admin view: fetching all images");
          q = query(imagesCollection);
        }
      } else if (customerId) {
        console.log("User view: fetching images for specific customer");
        q = query(imagesCollection, where("customer_id", "==", customerId));
      } else {
        console.error("No customerId provided for non-admin user");
        return;
      }

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedImages: IImage[] = [];
        querySnapshot.forEach((doc) => {
          const imageData = doc.data() as Omit<IImage, "id">;
          if (
            imageData.url &&
            imageData.url !== "" &&
            !imageData.url.includes("logo.png")
          ) {
            fetchedImages.push({ id: doc.id, ...imageData });
          }
        });
        console.log("Fetched images:", fetchedImages);
        setImages((prevImages) => ({
          ...prevImages,
          [isAdmin ? selectedCustomer?.customer_id || "all" : customerId]:
            fetchedImages,
        }));
      });

      return unsubscribe;
    };

    fetchImages();
  }, [customerId, isAdmin, selectedCustomer]);

  useEffect(() => {
    if (customerListings.length > 0) {
      const listingsWithImages = customerListings.map((listing) => ({
        ...listing,
        uploadedImages: listing.uploadedImages || [],
        createdAt: listing.createdAt || new Date().toISOString(),
      }));
      setCustomerListingsWithImages(listingsWithImages);
    }
  }, [customerListings]);

  const fetchCustomerListings = async (customerId: string) => {
    try {
      console.log("Fetching listings for customer:", customerId);
      const listingsCollection = collection(db, "listings");
      const q = query(
        listingsCollection,
        where("customer_id", "==", customerId),
        orderBy("listingTitle"),
      );
      const listingsSnapshot = await getDocs(q);
      const listingsData = await Promise.all(
        listingsSnapshot.docs.map(async (doc) => {
          const listingData = doc.data() as Listing;
          const imagesQuery = query(
            collection(db, "images"),
            where("listing_id", "==", doc.id),
          );
          const imagesSnapshot = await getDocs(imagesQuery);
          const uploadedImages = imagesSnapshot.docs.map((imgDoc) => ({
            ...imgDoc.data(),
            id: imgDoc.id,
            status: imgDoc.data().status as "pending" | "approved" | "revision",
          }));
          return {
            ...listingData,
            id: doc.id,
            uploadedImages,
            createdAt: listingData.createdAt || new Date().toISOString(),
          };
        }),
      );
      console.log("Fetched listings with images:", listingsData);
      setCustomerListings(listingsData as Listing[]);
      setIsIndexBuilding(false);
    } catch (error) {
      console.error("Error fetching customer listings:", error);
      if (
        error instanceof FirebaseError &&
        error.code === "failed-precondition"
      ) {
        console.log("Index is building. Please wait.");
        setIsIndexBuilding(true);
      } else {
        // Handle other errors
        setIsIndexBuilding(false);
      }
    }
  };

  // Update this useEffect
  useEffect(() => {
    const newListingImages: Record<string, ListingImage[]> = {};
    customerListings.forEach((listing) => {
      newListingImages[listing.id] = listing.uploadedImages || [];
    });
    console.log({ newListingImages, customerListings });
    setListingImages(newListingImages);
  }, [customerListings]);

  const handleApprove = async (id: string) => {
    try {
      const imageRef = doc(db, "images", id);
      const imageDoc = await getDoc(imageRef);
      const imageData = imageDoc.data() as IImage;

      if (imageData.originalImageId) {
        const originalImageRef = doc(db, "images", imageData.originalImageId);
        await updateDoc(originalImageRef, {
          status: "superseded",
          currentRevisionId: id,
        });
      }

      await updateDoc(imageRef, {
        status: "approved",
        approvedAt: new Date().toISOString(),
      });

      setImages((prevImages) => {
        const key = isAdmin
          ? selectedCustomer?.customer_id || "all"
          : customerId;
        return {
          ...prevImages,
          [key]: prevImages[key].map((img) => {
            if (img.id === id) {
              return { ...img, status: "approved" };
            }
            if (img.id === imageData.originalImageId) {
              return { ...img, status: "superseded", currentRevisionId: id };
            }
            return img;
          }),
        };
      });

      alert("Image approved successfully");
    } catch (error) {
      console.error("Error approving image:", error);
      alert("Failed to approve image. Please try again.");
    }
  };

  const handleRevise = async (id: string, note: string) => {
    try {
      const imageRef = doc(db, "images", id);
      await updateDoc(imageRef, {
        status: "revision",
        revisionNote: note,
      });

      setImages((prevImages) => {
        const key = isAdmin ? "admin" : customerId;
        return {
          ...prevImages,
          [key]: prevImages[key].map((img) =>
            img.id === id
              ? { ...img, status: "revision", revisionNote: note }
              : img,
          ),
        };
      });
    } catch (error) {
      console.error("Error revising image:", error);
      alert("Failed to revise image. Please try again.");
    }
  };

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedDesigns((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleBatchApprove = async () => {
    try {
      const batch = writeBatch(db);
      selectedDesigns.forEach((id) => {
        const imageRef = doc(db, "images", id);
        batch.update(imageRef, {
          status: "approved",
          approvedAt: new Date().toISOString(),
          revisionNote: null,
        });
      });

      await batch.commit();

      setImages((prevImages) => {
        const key = isAdmin ? "admin" : customerId;
        return {
          ...prevImages,
          [key]: prevImages[key].map((img) =>
            selectedDesigns.has(img.id)
              ? { ...img, status: "approved", revisionNote: undefined }
              : img,
          ),
        };
      });

      setSelectedDesigns(new Set());
      alert("Selected images approved successfully");
    } catch (error) {
      console.error("Error batch approving images:", error);
      alert("Failed to approve selected images. Please try again.");
    }
  };

  const handleUploadRevision = (id: string) => {
    const image = images[
      isAdmin ? selectedCustomer?.customer_id || "all" : customerId
    ].find((img) => img.id === id);
    if (image) {
      setCurrentRevisionImage(image);
      setIsRevisionModalOpen(true);
    }
  };

  const handleRevisionFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files[0]) {
      setRevisionFile(event.target.files[0]);
    }
  };

  const handleRevisionUpload = async () => {
    if (!revisionFile || !currentRevisionImage) return;

    try {
      const fileExtension = revisionFile.name.split(".").pop();
      const uniqueFileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, `designs/${uniqueFileName}`);

      const snapshot = await uploadBytes(storageRef, revisionFile);
      const downloadURL = await getDownloadURL(storageRef);

      const newImage: Omit<IImage, "id"> = {
        url: downloadURL,
        status: "pending" as const, // Explicitly type this as a const
        title: revisionFile.name,
        date: new Date().toISOString(),
        customer_id: currentRevisionImage.customer_id,
        originalImageId: currentRevisionImage.id,
        revisionNote: revisionComment,
      };

      const docRef = await addDoc(collection(db, "images"), newImage);

      await updateDoc(doc(db, "images", currentRevisionImage.id), {
        currentRevisionId: docRef.id,
        status: "superseded" as const, // Explicitly type this as a const
      });

      setImages((prevImages) => {
        const key = isAdmin
          ? selectedCustomer?.customer_id || "all"
          : customerId;
        return {
          ...prevImages,
          [key]: [
            ...prevImages[key].map((img) =>
              img.id === currentRevisionImage.id
                ? {
                    ...img,
                    status: "superseded" as const,
                    currentRevisionId: docRef.id,
                  }
                : img,
            ),
            { id: docRef.id, ...newImage },
          ],
        };
      });

      setIsRevisionModalOpen(false);
      setRevisionFile(null);
      setRevisionComment("");
      setCurrentRevisionImage(null);
      alert("Revision uploaded successfully!");
    } catch (error) {
      console.error("Error uploading revision:", error);
      alert("Failed to upload revision. Please try again.");
    }
  };

  const filteredAndSortedListings = useMemo(() => {
    return customerListingsWithImages
      .filter((listing) => {
        const matchesSearch =
          listing.listingTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          listing.listingID.toLowerCase().includes(searchTerm.toLowerCase());

        const listingImagesArray = listingImages[listing.id] || [];
        const hasImages = listingImagesArray.length > 0 || listing.hasImage;

        let matchesStatus;
        if (statusFilter === "all") {
          matchesStatus = true; // Show all listings when searching
        } else {
          matchesStatus =
            (statusFilter === "pending" &&
              listingImagesArray.some((img) => img.status === "pending")) ||
            (statusFilter === "revision" &&
              listingImagesArray.some((img) => img.status === "revision")) ||
            (statusFilter === "approved" &&
              listingImagesArray.some((img) => img.status === "approved"));
        }

        // If there's a search term, ignore the status filter
        return searchTerm
          ? matchesSearch
          : matchesSearch &&
              (statusFilter === "all" ? hasImages : matchesStatus);
      })
      .sort((a, b) => {
        if (sortOrder === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
      });
  }, [
    customerListingsWithImages,
    searchTerm,
    statusFilter,
    sortOrder,
    listingImages,
  ]);

  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedListings.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );
  }, [filteredAndSortedListings, currentPage]);

  const totalPages = Math.ceil(
    filteredAndSortedListings.length / ITEMS_PER_PAGE,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleImagePreview = (params: {
    status: ListingImage["status"];
    url: string;
    revisionNote?: ListingImage["revisionNote"];
  }) => {
    setPreviewImage(params);
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  const handleLocalUpload = (
    listing: Listing,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files);
      setLocalImages((prev) => ({
        ...prev,
        [listing.id]: [...(prev[listing.id] || []), ...newFiles],
      }));
    }
  };

  const handleSave = async (listing: Listing) => {
    if (!localImages[listing.id] || localImages[listing.id].length === 0)
      return;

    try {
      const batch = writeBatch(db);
      const newImages: ListingImage[] = [];

      for (const file of localImages[listing.id]) {
        const fileExtension = file.name.split(".").pop();
        const uniqueFileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.${fileExtension}`;
        const storageRef = ref(storage, `designs/${uniqueFileName}`);

        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        const newImageDoc: ListingImage = {
          id: doc(collection(db, "images")).id, // Generate a new ID
          url: downloadURL,
          status: "pending",
          listing_id: listing.id,
          customer_id: selectedCustomer?.customer_id || "", // Make sure to include customer_id
        };

        newImages.push(newImageDoc);

        const fullImageDoc = {
          ...newImageDoc,
          title: file.name,
          date: new Date().toISOString(),
        };

        batch.set(doc(db, "images", newImageDoc.id), fullImageDoc);
      }

      // Update the listing document with hasImage field
      const listingRef = doc(db, "listings", listing.id);
      batch.update(listingRef, { hasImage: true });

      await createTask({
        customerId: selectedCustomer?.customer_id || "",
        taskName: `Added ${localImages[listing.id].length} images`,
        teamMemberName: (user as IAdmin)?.name || user?.email || "",
        dateCompleted: serverTimestamp(),
        listingId: listing.listingID,
        isDone: true,
        category: "Design",
      });

      await batch.commit();

      // Update local state
      setListingImages((prev) => ({
        ...prev,
        [listing.id]: [...(prev[listing.id] || []), ...newImages],
      }));

      setLocalImages((prev) => ({
        ...prev,
        [listing.id]: [],
      }));

      setCustomerListingsWithImages((prevListings) =>
        prevListings.map((l) =>
          l.id === listing.id
            ? {
                ...l,
                hasImage: true,
                uploadedImages: [...(l.uploadedImages || []), ...newImages],
              }
            : l,
        ),
      );

      console.log(
        "Images uploaded successfully. Listing updated with hasImage: true",
      );
      alert("Images uploaded successfully and listing updated!");
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  const handleSaveRevision = async (
    listing: Partial<ListingImage>,
    base64Image?: string,
  ) => {
    setIsAddingRevision(true);
    console.log({ listing, base64Image });
    if (!listing.listing_id || !base64Image) {
      return;
    }
    try {
      const batch = writeBatch(db);
      const newImages: ListingImage[] = [];

      const matches = base64Image.match(/^data:(image\/\w+);base64,/);
      const fileExtension = matches ? matches[1].split("/")[1] : "png";

      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${fileExtension}` });

      const uniqueFileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}.${fileExtension}`;
      const storageRef = ref(storage, `designs/${uniqueFileName}`);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const newImageDoc: ListingImage = {
        id: doc(collection(db, "images")).id,
        url: downloadURL,
        status: "pending",
        listing_id: listing.listing_id,
        customer_id: selectedCustomer?.customer_id || "",
      };

      newImages.push(newImageDoc);

      const fullImageDoc = {
        ...newImageDoc,
        title: `${listing.revisionNote?.substring(
          0,
          10,
        )}${new Date().toISOString()}`,
        date: new Date().toISOString(),
      };

      batch.set(doc(db, "images", newImageDoc.id), fullImageDoc);

      // Update the listing document with hasImage field
      const listingRef = doc(db, "listings", listing.listing_id);
      batch.update(listingRef, { hasImage: true });

      // Assuming createTask exists and localImages is in scope
      await createTask({
        customerId: selectedCustomer?.customer_id || "",
        taskName: `Added 1 image`,
        teamMemberName: (user as IAdmin)?.name || user?.email || "",
        dateCompleted: serverTimestamp(),
        listingId: listing.listing_id,
        isDone: true,
        category: "Design",
      });

      await batch.commit();

      await fetchCustomerListings(selectedCustomer?.customer_id || "");
      setRevisionImage("");
      setUploadingRevision(false);
      setPreviewImage(null);
      setIsAddingRevision(false);
    } catch (error) {
      setIsAddingRevision(false);
      console.error("Error uploading images:", error);
      message.error("Failed to upload images. Please try again.");
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, listing: Listing) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setLocalImages((prev) => ({
        ...prev,
        [listing.id]: [...(prev[listing.id] || []), ...newFiles],
      }));
    }
  };

  const handleRemoveLocalImage = (listingId: string, index: number) => {
    setLocalImages((prev) => {
      const newImages = [...(prev[listingId] || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        [listingId]: newImages,
      };
    });
  };

  const handleDropZoneClick = (listingId: string) => {
    const fileInput = document.getElementById(
      `file-input-${listingId}`,
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleSupersession = async (id: string) => {
    await FirebaseHelper.update("images", id, {
      status: "superseded",
    });
    await fetchCustomerListings(selectedCustomer?.customer_id || "");
  };

  // Add this function after other handler functions, before the return statement
  const handleDownloadImages = async (listing: Listing) => {
    const images = listingImages[listing.id] || [];
    if (images.length === 0) {
      message.info('No images available to download');
      return;
    }

    try {
      message.info('Opening images in new tabs...');
      
      for (const image of images) {
        window.open(image.url, '_blank');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      message.success('Please right-click and save each image manually');
    } catch (error) {
      console.error('Error opening images:', error);
      message.error('Failed to open images. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2>Design Hub - {isAdmin ? "Admin View" : "User View"}</h2>
        {isAdmin && (
          <CustomersDropdown
            customers={customers}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            isAdmin={isAdmin}
          />
        )}
      </div>
      {(isAdmin && selectedCustomer) || (!isAdmin && customerId) ? (
        <>
          <div style={{ marginBottom: "20px" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.input}
            >
              <option value="all">All Images</option>
              <option value="pending">To Approve</option>
              <option value="revision">For Revision</option>
              <option value="approved">Approved</option>
            </select>
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.input}
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={styles.input}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          {isAdmin && selectedCustomer && (
            <div>
              <h3>Customer Listings</h3>
              {isIndexBuilding ? (
                <p>
                  The database index is currently being built. This process
                  usually takes a few minutes. Please wait...
                </p>
              ) : paginatedListings.length === 0 ? (
                <p>No listings found for this customer.</p>
              ) : (
                <>
                  <div style={styles.cardGrid}>
                    {paginatedListings.map((listing) => (
                      <div
                        key={listing.id}
                        style={{
                          ...styles.card,
                          ...(isDragging ? styles.cardDragging : {}),
                        }}
                        onDragEnter={(e) => handleDragEnter(e, listing)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, listing)}
                      >
                        <div style={styles.cardContent}>
                          <div
                            style={styles.dropZone}
                            onClick={() => handleDropZoneClick(listing.id)}
                          >
                            Drag and drop images here or click to upload
                          </div>
                          <p style={styles.cardId}>ID: {listing.listingID}</p>
                          <h4
                            style={styles.cardTitle}
                            title={listing.listingTitle}
                          >
                            {listing.listingTitle}
                          </h4>
                          <p style={styles.cardBestseller}>
                            {listing.bestseller ? "Bestseller" : ""}
                          </p>
                          <div style={styles.uploadedImagesPreview}>
                            {listingImages[listing.id]
                              .filter(
                                (img) =>
                                  img.status === statusFilter ||
                                  statusFilter === "all",
                              )
                              ?.map((image, index) => (
                                <div
                                  key={`uploaded-${index}`}
                                  style={styles.thumbnailContainer}
                                >
                                  <img
                                    src={image.url}
                                    alt={`Uploaded ${index + 1}`}
                                    style={styles.uploadedImageThumbnail}
                                    onClick={() => handleImagePreview(image)}
                                  />
                                  <span
                                    style={{
                                      position: "absolute",
                                      bottom: "0",
                                      right: "0",
                                      background:
                                        image.status === "approved"
                                          ? "green"
                                          : image.status === "revision"
                                          ? "orange"
                                          : "blue",
                                      color: "white",
                                      padding: "2px 5px",
                                      fontSize: "10px",
                                      borderRadius: "3px",
                                    }}
                                  >
                                    {image.status}
                                  </span>
                                </div>
                              ))}
                            {localImages[listing.id]?.map((file, index) => (
                              <div
                                key={`local-${index}`}
                                style={styles.thumbnailContainer}
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Local ${index + 1}`}
                                  style={styles.uploadedImageThumbnail}
                                  onClick={() =>
                                    handleImagePreview({
                                      status: "pending",
                                      url: URL.createObjectURL(file),
                                    })
                                  }
                                />
                                <button
                                  onClick={() =>
                                    handleRemoveLocalImage(listing.id, index)
                                  }
                                  style={styles.removeButton}
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={styles.cardFooter}>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleLocalUpload(listing, e)}
                            style={{ display: "none" }}
                            id={`file-input-${listing.id}`}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleSave(listing)}
                              style={styles.button}
                              disabled={
                                !localImages[listing.id] ||
                                localImages[listing.id].length === 0
                              }
                            >
                              Save
                            </button>
                            {listingImages[listing.id]?.length > 0 && (
                              <button
                                onClick={() => handleDownloadImages(listing)}
                                style={{
                                  ...styles.button,
                                  backgroundColor: '#28a745'  // Different color for download button
                                }}
                              >
                                Download Images
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={styles.pagination}>
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      style={styles.paginationButton}
                    >
                      Previous
                    </button>
                    <span style={styles.pageInfo}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      style={styles.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <p>
          {isAdmin
            ? "Please select a customer to view designs."
            : "No customer ID provided."}
        </p>
      )}
      {/* Image preview modal */}
      {/* {previewImage && (
        <div style={styles.previewModal} onClick={closeImagePreview}>
          <img
            src={previewImage.url}
            alt="Preview"
            style={styles.previewImage}
          />
        </div>
      )} */}

      <Modal
        title="Detail"
        open={Boolean(previewImage?.url)}
        onCancel={closeImagePreview}
        width={"70%"}
        footer={false}
      >
        <Card>
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <div>
                {uploadingRevision && <p>Previous Image</p>}
                <Image
                  src={previewImage?.url}
                  alt="Preview"
                  style={{ borderRadius: 8 }}
                  height={"20vh"}
                />
                {uploadingRevision && (
                  <>
                    <Divider />
                    <p>New Image</p>
                    {revisionImage ? (
                      <Image
                        src={revisionImage}
                        alt="Revision"
                        style={{ borderRadius: 8 }}
                        height={"20vh"}
                      />
                    ) : (
                      <></>
                    )}
                  </>
                )}
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Tag
                  color={
                    previewImage?.status
                      ? STATUS_COLORS[previewImage?.status]
                      : "default"
                  }
                  style={{ marginBottom: 8 }}
                >
                  {previewImage?.status?.toUpperCase()}
                </Tag>
                <Divider style={{ margin: "8px 0" }} />
                {(!isAdmin || previewImage?.revisionNote) && (
                  <TextArea
                    placeholder="Write a note here..."
                    rows={4}
                    style={{ width: "100%" }}
                    value={previewImage?.revisionNote}
                    disabled={isAdmin}
                  />
                )}
                {isAdmin && previewImage?.revisionNote && previewImage.id && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2ch",
                      marginTop: "2ch",
                    }}
                  >
                    <Popconfirm
                      title="Delete the task"
                      description="Are you sure do you want to suspend the image?"
                      onConfirm={() =>
                        handleSupersession(previewImage.id || "")
                      }
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        danger
                        disabled={previewImage.status === "superseded"}
                      >
                        {previewImage.status === "superseded"
                          ? "Superseded"
                          : "Supersede"}
                      </Button>
                    </Popconfirm>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "2ch",
                      }}
                    >
                      <Button
                        danger={uploadingRevision}
                        type={uploadingRevision ? "default" : "primary"}
                        onClick={() => {
                          if (uploadingRevision) {
                            setRevisionImage(undefined);
                          }
                          setUploadingRevision(!uploadingRevision);
                        }}
                      >
                        {uploadingRevision
                          ? "Cancel Upload"
                          : "Upload Revision"}
                      </Button>
                      {uploadingRevision && (
                        <Button
                          disabled={!Boolean(revisionImage)}
                          type={"primary"}
                          onClick={() =>
                            handleSaveRevision(previewImage, revisionImage)
                          }
                          loading={isAddingRevision}
                        >
                          Save
                        </Button>
                      )}
                    </div>

                    {uploadingRevision && (
                      <DragDropUpload
                        handleUpload={(data) => {
                          setRevisionImage(data?.at(0));
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Card>
      </Modal>
    </div>
  );
};

// Only one export statement at the end
export { DesignHub };
