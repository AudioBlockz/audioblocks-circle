import React from "react";
import { Slot } from "@radix-ui/react-slot";
import clsx from "clsx";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean; // To wrap components with Slot
};

const Skeleton = ({ className, asChild, ...props }: SkeletonProps) => {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      className={clsx(
        "animate-pulse bg-gray-300 dark:bg-gray-700 rounded",
        className,
      )}
      {...props}
    />
  );
};

// Usage of Skeleton with ArtistCardSkeleton
export const ArtistCardSkeleton = () => {
  return (
    <div className="bg-gradient-to-r from-[#4B0B3E] to-[#274749] p-8 rounded-lg text-white flex items-center justify-between">
      <div className="flex-1 gap-2">
        {/* Skeleton for Title */}
        <Skeleton className="h-10 w-3/4 mb-4" />

        {/* Skeleton for Bio */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Skeleton for Stats */}
        <div className="grid grid-flow-col gap-2 w-2/5 mt-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      {/* Skeleton for Profile Picture */}
      <div className="flex-shrink-0">
        <Skeleton className="md:w-32 md:h-32 w-20 h-20 rounded-full" />
      </div>
    </div>
  );
};
