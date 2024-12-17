"use client";

import { Listing } from "@/types/Listing";
import { OptimizationType } from "@/types/OptimizeEtsyListing";
import { Fragment, useState } from "react";
import DOMPurify from "dompurify";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const pastelColors: Record<OptimizationType, { bg: string; text: string }> = {
  Title: { bg: "#fce7f3", text: "#9d174d" }, // pink pastel
  Description: { bg: "#dbeafe", text: "#1e40af" }, // blue pastel
  Tags: { bg: "#dcfce7", text: "#166534" }, // green pastel
  Images: { bg: "#fef3c7", text: "#92400e" }, // yellow pastel
  Attributes: { bg: "#f3e8ff", text: "#6b21a8" }, // purple pastel
  "Alt text": { bg: "#ffedd5", text: "#9a3412" }, // orange pastel
};

const OptimizationCard = ({ listing }: { listing: Listing }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getOptimizationTypes = (listing: Listing): OptimizationType[] => {
    const types: OptimizationType[] = [];
    if (listing.optimizedTitle) types.push("Title");
    if (listing.optimizedDescription) types.push("Description");
    if (listing.optimizedTags) types.push("Tags");
    if (listing.optimizationStatus) types.push("Images");
    types.push("Attributes");
    types.push("Alt text");
    return types;
  };

  const getLastImageDate = (listing: Listing): string => {
    if (!listing.uploadedImages || listing.uploadedImages.length === 0) {
      return "No additional images";
    }
    const lastImage = listing.uploadedImages[listing.uploadedImages.length - 1];
    return formatDate(lastImage?.statusChangeDate || null);
  };

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

  const sanitizeHtml = (html: string) => {
    // First sanitize the HTML
    const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: ["br"] });
    // Then split by <br> or <br /> and join with newlines
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
          alt={listing.optimizedTitle || listing.listingTitle}
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
            {listing.optimizedTitle || listing.listingTitle}
          </h3>
          <div style={{ fontSize: "14px", color: "#666" }}>
            ID: {listing.id}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {getOptimizationTypes(listing).map((type) => (
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
          {/* Title Changes */}
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
              Title Changes
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
                <div>{listing.listingTitle}</div>
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
                  Optimized Title:
                </div>
                <div>{listing.optimizedTitle}</div>
                {listing.optimizedAt && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Optimized on: {formatDate(listing.optimizedAt)}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Description Changes */}
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
              Description Changes
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
                  {sanitizeHtml(listing.listingDescription)}
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
                  Optimized Description:
                </div>
                <div style={{ maxHeight: "200px", overflow: "auto" }}>
                  {sanitizeHtml(listing.optimizedDescription || "")}
                </div>
                {listing.optimizedAt && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Optimized on: {formatDate(listing.optimizedAt)}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Tags Changes */}
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
              Tag Changes
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
                  Optimized Tags:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {listing.optimizedTags?.split(",").map((tag, index) => (
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
                {listing.optimizedAt && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Optimized on: {formatDate(listing.optimizedAt)}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Images Changes */}
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
                {listing.uploadedImages && listing.uploadedImages.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {listing.uploadedImages.map((image, index) => (
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
                {listing.uploadedImages && listing.uploadedImages.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                    Last image added: {formatDate(listing.uploadedImages[listing.uploadedImages.length - 1].date)}
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

export default OptimizationCard;
