"use client";

import { useState, FC, Fragment, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ArrowRight,
  Lightbulb,
  Plus,
  X,
  Check,
} from "lucide-react";
import AiButton from "@/components/animata/button/ai-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import DOMPurify from "dompurify";
import { IEtsyFetchedListing, IEtsyListingImage } from "@/types/Etsy";
import {
  useEtsyListingImages,
  useSaveOptimizedEtsyListing,
} from "@/hooks/useEtsy";
import { useOptimizeEtsyListing } from "@/hooks/useOptimizeEtsy";

interface EtsyListingOptimizationListProps {
  listings: (IEtsyFetchedListing & {
    optimizedTitle: string;
    optimizedDescription: string;
    optimizedTags: string[];
    optimizationStatus: boolean;
  })[];
  selectedCustomerId: string;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-base text-[#6699FF]">
      <Lightbulb className="w-4 h-4" />
      {children}
    </div>
  );
}

function Tag({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span className="group flex items-center gap-1 px-2.5 py-0.5 bg-white text-black border border-gray-200 rounded-full text-sm font-normal">
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hidden group-hover:flex items-center justify-center w-3 h-3 rounded-full hover:bg-gray-100"
        >
          <X className="w-2 h-2" />
        </button>
      )}
    </span>
  );
}

const EtsyListingOptimizationList: FC<EtsyListingOptimizationListProps> = ({
  listings: etsyListings,
  selectedCustomerId,
}) => {
  const { fetchEtsyListingImages, isFetchingEtsyListingImages } =
    useEtsyListingImages();
  const [listings, setListings] = useState<
    (IEtsyFetchedListing & {
      optimizedTitle: string;
      optimizedDescription: string;
      optimizedTags: string[];
      optimizationStatus: boolean;
    })[]
  >(etsyListings);
  const [expandedListingId, setExpandedListingId] = useState<number | null>(
    null,
  );
  const [showOptimization, setShowOptimization] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [listingImages, setListingImages] = useState<IEtsyListingImage[]>([]);
  const { generateFeedback, isGenerating } = useOptimizeEtsyListing();
  const { saveOptimization, isSavingOptimization } =
    useSaveOptimizedEtsyListing();

  const toggleListingExpansion = (listingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedListingId((prevId) => (prevId === listingId ? null : listingId));
    if (expandedListingId !== listingId) {
      setShowOptimization(null);
    }
  };

  const handleOptimizeClick = async (
    listing: IEtsyFetchedListing,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const feedBacks = await generateFeedback({
      title: listing.title,
      description: listing.description,
      tags: listing.tags.join(","),
    });
    if (feedBacks?.data) {
      setEditedTitle(feedBacks.data.titleFeedback);
      setEditedDescription(feedBacks.data.descriptionFeedback);
      setEditedTags(feedBacks.data.tagsFeedback.split(","));
      setShowOptimization(listing.listing_id);
    }
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag("");
    }
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

  const removeTag = (index: number) => {
    setEditedTags(editedTags.filter((_, i) => i !== index));
  };

  const saveOptimizedListing = async (listingId: number) => {
    const optimizedListing = listings.find((l) => l.listing_id === listingId);

    if (!optimizedListing) return;

    const updatedListing: IEtsyFetchedListing & {
      optimizedTitle: string;
      optimizedDescription: string;
      optimizedTags: string[];
      optimizationStatus: boolean;
    } = {
      ...optimizedListing,
      optimizedTitle: editedTitle,
      optimizedDescription: editedDescription,
      optimizedTags: editedTags,
      optimizationStatus: true,
    };

    const updatedListings = listings.map((listing) => {
      if (listing.listing_id === listingId) {
        return {
          ...listing,
          optimizedTitle: updatedListing.optimizedTitle,
          optimizedDescription: updatedListing.optimizedDescription,
          optimizedTags: updatedListing.optimizedTags,
          optimizationStatus: true,
        };
      }
      return listing;
    });
    await saveOptimization(updatedListing);
    setListings(updatedListings);
    setShowOptimization(null);
  };

  const fetchListingImages = useCallback(
    async (listing: IEtsyFetchedListing) => {
      const images = await fetchEtsyListingImages({
        customerId: selectedCustomerId,
        listingId: listing.listing_id.toString(),
      });
      return images;
    },
    [fetchEtsyListingImages, selectedCustomerId],
  );

  const getImages = useCallback(async () => {
    if (listings.length > 0) {
      for (const listing of listings) {
        const images = await fetchListingImages(listing);
        setListingImages((prevImages) => [...prevImages, ...images]);
      }
    }
  }, [fetchListingImages, listings]);

  useEffect(() => {
    getImages();
  }, [getImages, listings]);

  return (
    <div className="w-full p-6">
      <Card
        className="overflow-hidden rounded-[30px] border border-gray-200 shadow-sm"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {listings.map((listing, index) => (
          <motion.div
            key={listing.listing_id}
            className={`transition-colors hover:bg-gray-50 cursor-pointer ${
              index !== listings.length - 1 ? "border-b border-gray-200" : ""
            }`}
            onClick={(e) => toggleListingExpansion(listing.listing_id, e)}
            initial={false}
            animate={{
              backgroundColor:
                expandedListingId === listing.listing_id
                  ? "#F3F4F6"
                  : "#FFFFFF",
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center px-8 py-4">
              <div className="flex items-center gap-4 flex-grow">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  {isFetchingEtsyListingImages ||
                  !listingImages.find(
                    (l) => l.listing_id === listing.listing_id,
                  ) ? (
                    <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                  ) : (
                    <Image
                      src={
                        listingImages.find(
                          (l) => l.listing_id === listing.listing_id,
                        )?.url_170x135 || ""
                      }
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      width={64}
                      height={64}
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-medium text-gray-900">
                      {listing.title}
                    </h3>
                    {listing.isOptimized && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Optimized
                      </Badge>
                    )}
                  </div>
                  <p className="text-base text-gray-500">
                    {listing.price.amount / listing.price.divisor}{" "}
                    {listing.price.currency_code}
                  </p>
                </div>
              </div>
              <div
                className="cursor-pointer p-3"
                onClick={(e) => toggleListingExpansion(listing.listing_id, e)}
              >
                <ChevronDown
                  className={`w-6 h-6 text-gray-400 transition-transform ${
                    expandedListingId === listing.listing_id
                      ? "transform rotate-180"
                      : ""
                  }`}
                />
              </div>
            </div>
            <AnimatePresence initial={false}>
              {expandedListingId === listing.listing_id && (
                <motion.div
                  key={`details-${listing.listing_id}`}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={{
                    expanded: { opacity: 1, height: "auto" },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-8 py-6 space-y-8 border-t border-gray-100">
                    {showOptimization === listing.listing_id ||
                    listing.isOptimized ? (
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold border-l-4 border-[#EA4335] pl-3">
                            Title Changes
                          </h3>
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                            <div>
                              <div className="text-base text-gray-500 mb-2">
                                Original Title:
                              </div>
                              <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                {listing.title}
                              </div>
                            </div>
                            <ArrowRight className="text-gray-400 mt-8" />
                            <div>
                              <div className="text-base text-gray-500 mb-2">
                                Optimized Title:
                              </div>
                              {listing.isOptimized ? (
                                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                  {listing.optimizedTitle}
                                </div>
                              ) : (
                                <Input
                                  value={editedTitle}
                                  onChange={(e) => setEditedTitle(e.target.value)}
                                  className="p-4 bg-white rounded-lg mb-2 text-base"
                                />
                              )}
                              <Hint>
                                Shorter and starts with the product type
                              </Hint>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold border-l-4 border-[#4285F4] pl-3">
                            Description Changes
                          </h3>
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
                            <div>
                              <div className="text-base text-gray-500 mb-2">
                                Original Description:
                              </div>
                              <div className="p-4 bg-[#F8F9FA] rounded-lg whitespace-pre-wrap">
                                {sanitizeHtml(listing.description)}
                              </div>
                            </div>
                            <ArrowRight className="text-gray-400 mt-8" />
                            <div>
                              <div className="text-base text-gray-500 mb-2">
                                Optimized Description:
                              </div>
                              {listing.isOptimized ? (
                                <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                  {listing.optimizedDescription}
                                </div>
                              ) : (
                                <Textarea
                                  defaultValue={listing.optimizedDescription}
                                  value={editedDescription}
                                onChange={(e) =>
                                  setEditedDescription(e.target.value)
                                }
                                className="p-4 bg-white rounded-lg mb-2 text-base"
                                rows={10}
                                />
                              )}
                              <Hint>more detailed</Hint>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold border-l-4 border-[#34A853] pl-3">
                            Tag Changes
                          </h3>
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
                            <div>
                              <div className="text-base text-gray-500 mb-2">
                                Original Tags:
                              </div>
                              <div className="p-4 bg-[#F8F9FA] rounded-lg">
                                <div className="flex flex-wrap gap-1.5">
                                  {listing.tags.map((tag) => (
                                    <Tag key={tag}>{tag}</Tag>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="text-gray-400 mt-8" />
                            <div>
                              <div className="text-base text-gray-500 mb-2">
                                Optimized Tags:
                              </div>
                              <div className="p-4 bg-white rounded-lg">
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {editedTags.map((tag, index) => (
                                    <Tag
                                      key={index}
                                      onRemove={() => removeTag(index)}
                                    >
                                      {tag}
                                    </Tag>
                                  ))}
                                  {listing.optimizedTags.map((tag, index) => (
                                    <Tag key={index}>{tag}</Tag>
                                  ))}
                                </div>
                                <div
                                  className="flex items-center gap-2"
                                  style={
                                    listing.isOptimized
                                      ? { display: "none" }
                                      : {}
                                  }
                                >
                                  <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={addTag}
                                    placeholder="Add a tag..."
                                    className="h-8 text-sm bg-transparent"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-2"
                                    onClick={() => {
                                      if (newTag.trim()) {
                                        setEditedTags([
                                          ...editedTags,
                                          newTag.trim(),
                                        ]);
                                        setNewTag("");
                                      }
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-center" style={{ display: listing.isOptimized ? "none" : "" }}>
                          <AiButton
                            onClick={() =>
                              saveOptimizedListing(listing.listing_id)
                            }
                            isLoading={isSavingOptimization}
                          >
                            Save optimized listing
                          </AiButton>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Title</h3>
                            <div className="p-4 bg-[#F8F9FA] rounded-lg">
                              {listing.title}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold">
                              Description
                            </h3>
                            <div className="p-4 bg-[#F8F9FA] rounded-lg whitespace-pre-wrap">
                              {sanitizeHtml(listing.description)}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-xl font-semibold">Tags</h3>
                            <div className="p-4 bg-[#F8F9FA] rounded-lg">
                              <div className="flex flex-wrap gap-1.5">
                                {listing.tags?.map((tag) => (
                                  <Tag key={tag}>{tag}</Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="relative">
                            <svg
                              className="absolute top-0 right-0 -mr-3 -mt-3 w-24 h-24 text-yellow-500/20"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                              />
                            </svg>
                            <AiButton
                              onClick={(e) => handleOptimizeClick(listing, e)}
                              isLoading={isGenerating}
                            >
                              Optimize
                            </AiButton>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </Card>
    </div>
  );
};

export default EtsyListingOptimizationList;
