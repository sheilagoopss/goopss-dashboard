import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OptimizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: {
    title: string;
    description: string;
    tags: string[];
  };
}

export function OptimizeDialog({
  open,
  onOpenChange,
  listing,
}: OptimizeDialogProps) {
  const optimizedData = {
    title: listing.title.replace(", MSBY Team Gift Idea", ", MSBY Gift Idea"),
    description: `Get your hands on this adorable ${
      listing.title.split(",")[0]
    } made of high-quality polystyrene material. Perfect for any MSBY fan or as a thoughtful gift for a friend.

MATERIALS
• High-quality polystyrene material

SIZING
• Compact size ideal for keys or bags

PACKAGING AND SHIPPING
• Carefully packaged to ensure safe delivery
• Ships worldwide from our studio`,
    tags: [
      "anime",
      "haikyuu",
      "keychain",
      "sakusa",
      "volleyball",
      "msby",
      "gift",
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Listing Optimization
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[600px] pr-4">
          <div className="space-y-8 py-4">
            {/* Title Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-l-4 border-pink-500 pl-3">
                Title Changes
              </h3>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Original Title:</div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {listing.title}
                  </div>
                </div>
                <ArrowRight className="text-gray-400" />
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Optimized Title:</div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    {optimizedData.title}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-l-4 border-blue-500 pl-3">
                Description Changes
              </h3>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    Original Description:
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                    {listing.description}
                  </div>
                </div>
                <ArrowRight className="text-gray-400 mt-8" />
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">
                    Optimized Description:
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg whitespace-pre-wrap">
                    {optimizedData.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-l-4 border-green-500 pl-3">
                Tag Changes
              </h3>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Original Tags:</div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <ArrowRight className="text-gray-400 mt-8" />
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Optimized Tags:</div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {optimizedData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
