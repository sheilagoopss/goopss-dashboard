import { db } from "@/firebase/config";
import { addDoc, doc, updateDoc } from "firebase/firestore";
import { EtsyListing, ISocialPost } from "@/types/Social";
import { collection } from "@firebase/firestore";
import { useCallback, useState } from "react";
import { ICustomer } from "@/types/Customer";
import { useTaskCreate } from "./useTask";
import { useFacebookSchedule } from "./useSocial";

export default function useSavePost() {
  const [isSavingPost, setIsSavingPost] = useState(false);
  const { createTask } = useTaskCreate();
  const { schedulePosts } = useFacebookSchedule();

  const savePost = useCallback(
    async ({
      customer,
      listing,
      newPosts,
    }: {
      customer: ICustomer;
      listing?: EtsyListing;
      newPosts: Omit<ISocialPost, "id">[];
    }): Promise<ISocialPost[] | null> => {
      setIsSavingPost(true);
      try {
        if (!customer) {
          console.error("No customer selected");
          return null;
        }

        const socialCollection = collection(db, "socials");
        const savedPosts: ISocialPost[] = [];

        for (const post of newPosts) {
          if (!post.content.trim()) {
            console.error(`Empty content for ${post.platform} post. Skipping.`);
            continue;
          }

          const docRef = await addDoc(socialCollection, {
            ...post,
            scheduledDate: post.scheduledDate,
            dateCreated: new Date(),
            imageUrl: listing?.primaryImage,
            scheduled: post.platform === "pinterest" ? false : null,
          });

          savedPosts.push({
            id: docRef.id,
            ...post,
            imageUrl: listing?.primaryImage,
          });
        }

        if (savedPosts.length === 0) {
          console.error("No posts were saved due to empty content");
          return null;
        }

        // Update the scheduled_post_date in the listing
        if (listing) {
          const listingRef = doc(db, "listings", listing.id);
          await updateDoc(listingRef, {
            scheduled_post_date: savedPosts[0].scheduledDate?.toISOString(),
          });
        }

        for (const savedPost of savedPosts) {
          switch (savedPost.platform) {
            case "facebook":
              {
                const schedulePostPromises = savedPosts.map((post) =>
                  schedulePosts({
                    customerId: customer.id,
                    postId: post.id,
                  }),
                );
                const schedulePostResponses = await Promise.all(
                  schedulePostPromises,
                );

                if (schedulePostResponses.some((response) => !response?.data)) {
                  console.error(
                    "Error scheduling posts:",
                    schedulePostResponses,
                  );
                }
                await createTask({
                  customerId: customer.id,
                  taskName: "Schedule Facebook Post",
                  teamMemberName: "Social Media",
                  category: "FacebookPagePost",
                  listingId: listing?.id,
                });
              }
              break;
            case "instagram":
              {
                await createTask({
                  customerId: customer.id,
                  taskName: "Schedule Instagram Post",
                  teamMemberName: "Social Media",
                  category: "InstagramPost",
                  listingId: listing?.id,
                });
              }
              break;
            case "facebookGroup":
              {
                await createTask({
                  customerId: customer.id,
                  taskName: "Schedule Facebook Group Post",
                  teamMemberName: "Social Media",
                  category: "FacebookGroupPost",
                  listingId: listing?.id,
                });
              }
              break;
            case "pinterest":
              {
                await createTask({
                  customerId: customer.id,
                  taskName: "Schedule Pinterest Post",
                  teamMemberName: "Social Media",
                  category: "PinterestBanner",
                  listingId: listing?.id,
                });
              }
              break;
            default:
              break;
          }
        }

        return savedPosts;
      } catch (error) {
        console.error("Error saving post:", error);
        return null;
      } finally {
        setIsSavingPost(false);
      }
    },
    [createTask, schedulePosts],
  );

  return {
    savePost,
    isSavingPost,
  };
}
