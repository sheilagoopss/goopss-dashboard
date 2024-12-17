import { db } from "@/firebase/config";
import { Listing } from "@/types/Listing";
import { OptimizationType } from "@/types/OptimizeEtsyListing";
import { collection, getDocs, query, where } from "@firebase/firestore";
import { Fragment, useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { ListingImage } from "@/types/Listing";

const pastelColors: Record<OptimizationType, { bg: string; text: string }> = {
  Title: { bg: "#fce7f3", text: "#9d174d" }, // pink pastel
  Description: { bg: "#dbeafe", text: "#1e40af" }, // blue pastel
  Tags: { bg: "#dcfce7", text: "#166534" }, // green pastel
  Images: { bg: "#fef3c7", text: "#92400e" }, // yellow pastel
  Attributes: { bg: "#f3e8ff", text: "#6b21a8" }, // purple pastel
  "Alt text": { bg: "#ffedd5", text: "#9a3412" }, // orange pastel
};

const DuplicationCard = ({ listing }: { listing: Listing }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [originalListing, setOriginalListing] = useState<Listing | null>(null);
  const [uploadedImages, setUploadedImages] = useState<ListingImage[]>([]);

  const formatDate = (date: any | null): string => {
    if (!date) return "";
    // Convert Firestore timestamp to Date object if needed
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Fetch original listing data when expanded
  useEffect(() => {
    const fetchOriginalListing = async () => {
      if (!isExpanded || !listing.duplicatedFrom) return;

      try {
        const listingsRef = collection(db, "listings");
        const q = query(
          listingsRef,
          where("listingID", "==", listing.duplicatedFrom),
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setOriginalListing({
            ...data,
            id: querySnapshot.docs[0].id,
          } as Listing);
        }
      } catch (error) {
        console.error("Error fetching original listing:", error);
      }
    };

    fetchOriginalListing();
  }, [isExpanded, listing.duplicatedFrom]);

  // Add this function to fetch images
  const fetchImagesForListing = async () => {
    try {
      const imagesRef = collection(db, "images");
      const q = query(
        imagesRef,
        where("listing_id", "==", listing.id), // Use the duplicated listing's ID
        where("status", "!=", "superseded"),
      );
      const querySnapshot = await getDocs(q);
      const images = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ListingImage[];
      setUploadedImages(images);
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  };

  // Fetch images when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchImagesForListing();
    }
  }, [isExpanded, listing.id]);

  // Get optimization types for badges
  const getOptimizationTypes = (): OptimizationType[] => {
    const types: OptimizationType[] = [];
    types.push("Title");
    types.push("Description");
    types.push("Tags");
    types.push("Images");
    types.push("Attributes");
    types.push("Alt text");
    return types;
  };

  const sanitizeHtml = (html: string) => {
    const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: ["br"] });
    return sanitized.split(/<br\s*\/?>/i).map((line, index) => (
      <Fragment key={index}>
        {line}
        {index !== sanitized.split(/<br\s*\/?>/i).length - 1 && <br />}
      </Fragment>
    ));
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "8px",
        marginBottom: "16px",
        overflow: "hidden",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Image
          src={listing.primaryImage}
          alt={listing.listingTitle}
          style={{
            objectFit: "cover",
            borderRadius: "4px",
          }}
          width={64}
          height={64}
        />
        <div style={{ flex: 1 }}>
          <h3
            style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}
          >
            {listing.listingTitle}
          </h3>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Listing ID: {listing.listingID}
          </div>
          <div style={{ fontSize: "14px", color: "#666" }}>
            Original Listing ID: {listing.duplicatedFrom}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {getOptimizationTypes().map((type) => (
            <span
              key={type}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                backgroundColor: pastelColors[type].bg,
                color: pastelColors[type].text,
              }}
            >
              {type}
            </span>
          ))}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: "20px", borderTop: "1px solid #eee" }}>
          {/* Title */}
          <section style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "24px",
                  backgroundColor: "#f9a8d4",
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              ></span>
              Title
            </h4>
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Original Title:
                </div>
                <div>{originalListing?.listingTitle || "Loading..."}</div>
              </div>
              <ArrowRight style={{ marginTop: "24px", color: "#666" }} />
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Duplicated Title:
                </div>
                <div>{listing.listingTitle}</div>
                {listing.createdAt && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Added on: {formatDate(new Date(listing.createdAt))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Description */}
          <section style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "24px",
                  backgroundColor: "#93c5fd",
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              ></span>
              Description
            </h4>
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Original Description:
                </div>
                <div style={{ maxHeight: "200px", overflow: "auto" }}>
                  {sanitizeHtml(
                    originalListing?.listingDescription || "Loading...",
                  )}
                </div>
              </div>
              <ArrowRight style={{ marginTop: "24px", color: "#666" }} />
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Duplicated Description:
                </div>
                <div style={{ maxHeight: "200px", overflow: "auto" }}>
                  {sanitizeHtml(listing.listingDescription)}
                </div>
                {listing.createdAt && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Added on: {formatDate(new Date(listing.createdAt))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Tags */}
          <section style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "24px",
                  backgroundColor: "#86efac",
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              ></span>
              Tags
            </h4>
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Original Tags:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {originalListing?.listingTags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#f3f4f6",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight style={{ marginTop: "24px", color: "#666" }} />
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #eee",
                  borderRadius: "4px",
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>
                  Duplicated Tags:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {listing.listingTags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: "#f3f4f6",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
                {listing.createdAt && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Added on: {formatDate(new Date(listing.createdAt))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Images */}
          <section style={{ marginBottom: "24px" }}>
            <h4
              style={{
                fontSize: "18px",
                fontWeight: 600,
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "24px",
                  backgroundColor: "#fcd34d",
                  marginRight: "8px",
                  borderRadius: "2px",
                }}
              ></span>
              Images Added
            </h4>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ flex: 1 }}></div>
              <ArrowRight style={{ marginTop: "24px", color: "#666" }} />
              <div style={{ flex: 1, padding: "12px", border: "1px solid #eee", borderRadius: "4px" }}>
                <div style={{ fontWeight: 500, marginBottom: "8px" }}>Additional Images</div>
                {uploadedImages.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {uploadedImages.map((image, index) => (
                      <Image
                        key={image.id}
                        src={image.url}
                        alt={`Additional ${index + 1}`}
                        style={{
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: "1px solid #eee",
                        }}
                        width={120}
                        height={120}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#666" }}>No additional images have been added.</div>
                )}
                {uploadedImages.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Last image added: {formatDate(uploadedImages[uploadedImages.length - 1].date || null)}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default DuplicationCard;
