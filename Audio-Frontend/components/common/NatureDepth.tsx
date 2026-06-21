"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface NatureSlide {
  id: number
  title: string
  description: string
   artist: string
  image: string
    gradient: string
  textColor?: string
}

interface NatureDepthSliderProps {
  interval?: number
  showControls?: boolean
  showProgress?: boolean
  autoPlay?: boolean
}

const natureSlides: NatureSlide[] = [
  {
    id: 1,
    title: "Music My Way",
    description: "Dancing lights paint the arctic sky in ethereal colors, making music that make the stars dance",
    artist: "Northern Norway",
    image: "/nft.svg",
    gradient: "1000 Bids",
    // textColor: "text-white",
  },
  {
    id: 2,
    title: "Coral Reef Paradise",
    description: "Underwater wonderland teeming with vibrant marine life, a symphony of colors and sounds",
    artist: "Wiffi Drips",
    image: "/wif.jpg",
    gradient: "5000 Bids",
    // textColor: "text-white",
  },
  {
    id: 3,
    title: "SILWY",
    description: "Raw power of earth's molten core creating new landscapes, a fiery dance of creation",
    artist: "Mchivir",
    image: "/chilli.jpg",
    gradient: "2000 Bids",
    // textColor: "text-white",
  },
]

export default function NatureDepthSlider({
  interval = 5000,
  showControls = true,
  showProgress = true,
  autoPlay = true,
}: NatureDepthSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [progress, setProgress] = useState(0)
  const [imageLoadStates, setImageLoadStates] = useState<Record<number, boolean>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-advance slides (non-stop)
  useEffect(() => {
    if (!isPlaying) return

    intervalRef.current = setInterval(() => {
      slideNext()
    }, interval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentIndex, interval, isPlaying])

  // Progress animation (non-stop)
  useEffect(() => {
    if (!isPlaying) return

    setProgress(0)
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / interval) * 100, 100)
      setProgress(newProgress)

      if (newProgress < 100) {
        progressRef.current = setTimeout(updateProgress, 16) // ~60fps
      }
    }

    updateProgress()

    return () => {
      if (progressRef.current) clearTimeout(progressRef.current)
    }
  }, [currentIndex, interval, isPlaying])

  const slideNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % natureSlides.length)
    setProgress(0)
    setTimeout(() => setIsAnimating(false), 800)
  }

  const slidePrev = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + natureSlides.length) % natureSlides.length)
    setProgress(0)
    setTimeout(() => setIsAnimating(false), 800)
  }

  const goToSlide = (index: number) => {
    if (index !== currentIndex && !isAnimating) {
      setIsAnimating(true)
      setCurrentIndex(index)
      setProgress(0)
      setTimeout(() => setIsAnimating(false), 800)
    }
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    setProgress(0)
  }

  const handleImageLoad = (slideId: number) => {
    setImageLoadStates((prev) => ({ ...prev, [slideId]: true }))
  }

  const currentSlide = natureSlides[currentIndex]

  return (
    // <div className="w-full mx-auto bg-transparent">
    //   {/* Main Container with Full Width Navigation */}
    //   <div className="w-4/5 mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
    //     {/* Left Navigation Button */}
    //     {showControls && (
    //       <div className="flex-shrink-0">
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           className="bg-[#1E181D] hover:bg-white/20 rounded-full text-gray-700 border-gray-300 backdrop-blur-sm shadow-lg w-12 h-12"
    //           onClick={slidePrev}
    //           disabled={isAnimating}
    //         >
    //           <ChevronLeft className="h-6 w-6 rounded-full" />
    //         </Button>
    //       </div>
    //     )}

    //     {/* Writing Section */}
    //    <div className="w-[476px] h-[302px] gap-6 flex-shrink-0 flex flex-col items-start justify-start px-4">
    //     <div>
    //       <h1 className="text-xl sm:text-4xl font-bold text-white">{currentSlide.title}</h1>
    //     </div>

    //     <div className="flex justify-start items-center gap-3">
    //       <h1>By {currentSlide.artist} | </h1>
    //       <div className="flex gap-1 items-center">
    //         <div className="w-2 h-2 bg-[#D2045B] rounded-full animate-pulse"></div>
    //         <h1>Available</h1>
    //       </div>
    //       <h1>{currentSlide.gradient}</h1>
    //     </div>

    //     <p className="text-xs sm:text-sm text-gray-600 w-[476px] leading-relaxed hidden sm:block">
    //       {currentSlide.description}
    //     </p>

    //     <div className="flex justify-start">
    //       <button className=" h-[48px] pt-2 pr-2 pb-2 pl-4 gap-7 rounded-full bg-[#D2045B] hover:bg-[#B8043F] flex items-center text-white font-medium transition-all duration-200 whitespace-nowrap text-sm hover:scale-105 shadow-lg hover:shadow-xl">
    //         Place Bid for 0.00034ETH
    //         <div className="bg-black rounded-full p-1">
    //           <ArrowRight className="h-4 w-4 rotate-[300deg] text-white" />
    //         </div>
    //       </button>
    //     </div>
    //   </div>

    //     {/* Slider Container - Centered */}
    //     <div className="flex-shrink-0 relative perspective-1000" style={{ width: "330px", height: "479px" }}>
    //       <div className="relative w-full h-full preserve-3d">
    //         {natureSlides.map((slide, index) => {
    //           const offset = (index - currentIndex + natureSlides.length) % natureSlides.length

    //           // Calculate transform values for layered depth effect
    //           let translateX = 0
    //           let translateY = 0
    //           let translateZ = 0
    //           let scale = 1
    //           let opacity = 1
    //           let zIndex = 0
    //           let rotateY = 0
    //           let blur = 0

    //           if (offset === 0) {
    //             // Active slide - front and center
    //             zIndex = 50
    //             scale = 1
    //             opacity = 1
    //           } else if (offset === 1) {
    //             // Next slide - right side, slightly behind
    //             translateX = 50
    //             translateY = 15
    //             translateZ = -40
    //             scale = 0.9
    //             opacity = 0.8
    //             zIndex = 40
    //             rotateY = -12
    //           } else if (offset === natureSlides.length - 1) {
    //             // Previous slide - left side, slightly behind
    //             translateX = -50
    //             translateY = 15
    //             translateZ = -40
    //             scale = 0.9
    //             opacity = 0.8
    //             zIndex = 40
    //             rotateY = 12
    //           } else if (offset === 2) {
    //             // Second next - further right and back
    //             translateX = 90
    //             translateY = 25
    //             translateZ = -80
    //             scale = 0.8
    //             opacity = 0.6
    //             zIndex = 30
    //             rotateY = -20
    //             blur = 1
    //           } else if (offset === natureSlides.length - 2) {
    //             // Second previous - further left and back
    //             translateX = -90
    //             translateY = 25
    //             translateZ = -80
    //             scale = 0.8
    //             opacity = 0.6
    //             zIndex = 30
    //             rotateY = 20
    //             blur = 1
    //           } else {
    //             // Far background slides
    //             translateX = 0
    //             translateY = 35
    //             translateZ = -120
    //             scale = 0.7
    //             opacity = 0.4
    //             zIndex = 20
    //             blur = 2
    //           }

    //           const isImageLoaded = imageLoadStates[slide.id]

    //           return (
    //             <div
    //               key={slide.id}
    //               className={`absolute inset-0 transition-all duration-800 ease-out cursor-pointer`}
    //               style={{
    //                 transform: `
    //                   translateX(${translateX}px) 
    //                   translateY(${translateY}px) 
    //                   translateZ(${translateZ}px) 
    //                   scale(${scale}) 
    //                   rotateY(${rotateY}deg)
    //                 `,
    //                 opacity,
    //                 zIndex,
    //                 filter: blur > 0 ? `blur(${blur}px)` : "none",
    //                 transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    //               }}
    //               onClick={() => goToSlide(index)}
    //             >
    //               <div className="w-full h-full overflow-hidden relative group" style={{ borderRadius: "20px" }}>
    //                 {/* Image Background */}
    //                 <div className="absolute inset-0">
    //                   {!isImageLoaded && (
    //                     <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
    //                   )}
    //                   <Image
    //                     src={slide.image || "/placeholder.svg"}
    //                     alt='marketplace-slide'
    //                     fill
    //                     className={`object-cover transition-opacity duration-500 ${
    //                       isImageLoaded ? "opacity-100" : "opacity-0"
    //                     }`}
    //                     style={{ borderRadius: "20px" }}
    //                     onLoad={() => handleImageLoad(slide.id)}
    //                     priority={offset === 0}
    //                   />
    //                 </div>

    //                 {/* Gradient Overlay */}
    //                 {/* <div
    //                   className={`absolute inset-0 bg-gradient-to-t ${slide.gradient}`}
    //                   style={{ borderRadius: "20px" }}
    //                 /> */}

    //                 {/* Content Overlay */}
    //                 <div
    //                   className={`absolute inset-0 p-6 sm:p-8 flex flex-col justify-between ${slide.textColor || "text-white"}`}
    //                 >
                      
    //                 </div>

    //                 {/* Hover Overlay */}
    //                 <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    //                 {/* Subtle Vignette */}
    //                 <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
    //               </div>
    //             </div>
    //           )
    //         })}
    //       </div>
    //       {/* Slide Indicators - Directly under slider */}
    //       <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-3 z-60">
    //         {natureSlides.map((slide, index) => (
    //           <button
    //             key={slide.id}
    //             className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${
    //               index === currentIndex
    //                 ? "bg-[#D2045B]  shadow-lg scale-110"
    //                 : "bg-[#2E3239]"
    //             }`}
    //             onClick={() => goToSlide(index)}
    //           />
    //         ))}
    //       </div>
    //     </div>

    //     {/* Right Navigation Button */}
    //     {showControls && (
    //       <div className="flex-shrink-0">
    //         <Button
    //           variant="outline"
    //           size="icon"
    //           className="bg-white/10 hover:bg-white/20 rounded-full text-gray-700 border-gray-300 backdrop-blur-sm shadow-lg w-12 h-12"
    //           onClick={slideNext}
    //           disabled={isAnimating}
    //         >
    //           <ChevronRight className="h-6 w-6 rounded-full" />
    //         </Button>
    //       </div>
    //     )}
    //   </div>
    // </div>

    <div className="w-full mx-auto bg-transparent">
  <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-8">
    {/* Left Navigation Button */}
    {showControls && (
      <div className="flex-shrink-0 order-3 lg:order-none">
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E181D] hover:bg-white/20 rounded-full text-gray-700 border-gray-300 backdrop-blur-sm shadow-lg"
          onClick={slidePrev}
          disabled={isAnimating}
        >
          <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
    )}

    {/* Writing Section */}
    <div className="w-full lg:w-[476px] flex flex-col items-start justify-start gap-4 sm:gap-6 px-4">
      <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">
        {currentSlide.title}
      </h1>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base text-gray-400">
        <span>By {currentSlide.artist} |</span>
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 bg-[#D2045B] rounded-full animate-pulse"></div>
          <span>Available</span>
        </div>
        <span>{currentSlide.gradient}</span>
      </div>

      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-full sm:max-w-[476px]">
        {currentSlide.description}
      </p>

      <div className="flex">
        <button className="h-[44px] sm:h-[48px] px-4 sm:px-6 rounded-full bg-[#D2045B] hover:bg-[#B8043F] flex items-center text-white font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap hover:scale-105 shadow-lg hover:shadow-xl">
          Place Bid for 0.00034ETH
          <div className="bg-black rounded-full p-1 ml-3">
            <ArrowRight className="h-4 w-4 rotate-[300deg]" />
          </div>
        </button>
      </div>
    </div>

    {/* Slider Container */}
    <div
      className="relative flex-shrink-0 perspective-1000 order-2 lg:order-none mx-auto"
      style={{
        width: "100%",
        maxWidth: "330px",
        height: "400px",
      }}
    >
      <div className="relative w-full h-full preserve-3d">
        {natureSlides.map((slide, index) => {
          const offset = (index - currentIndex + natureSlides.length) % natureSlides.length

          let translateX = 0
          let translateY = 0
          let translateZ = 0
          let scale = 1
          let opacity = 1
          let zIndex = 0
          let rotateY = 0
          let blur = 0

          if (offset === 0) {
            zIndex = 50
            scale = 1
            opacity = 1
          } else if (offset === 1) {
            translateX = 50
            translateY = 15
            translateZ = -40
            scale = 0.9
            opacity = 0.8
            zIndex = 40
            rotateY = -12
          } else if (offset === natureSlides.length - 1) {
            translateX = -50
            translateY = 15
            translateZ = -40
            scale = 0.9
            opacity = 0.8
            zIndex = 40
            rotateY = 12
          } else if (offset === 2) {
            translateX = 90
            translateY = 25
            translateZ = -80
            scale = 0.8
            opacity = 0.6
            zIndex = 30
            rotateY = -20
            blur = 1
          } else if (offset === natureSlides.length - 2) {
            translateX = -90
            translateY = 25
            translateZ = -80
            scale = 0.8
            opacity = 0.6
            zIndex = 30
            rotateY = 20
            blur = 1
          } else {
            translateX = 0
            translateY = 35
            translateZ = -120
            scale = 0.7
            opacity = 0.4
            zIndex = 20
            blur = 2
          }

          const isImageLoaded = imageLoadStates[slide.id]

          return (
            <div
              key={slide.id}
              className="absolute inset-0 transition-all duration-800 ease-out cursor-pointer"
              style={{
                transform: `
                  translateX(${translateX}px)
                  translateY(${translateY}px)
                  translateZ(${translateZ}px)
                  scale(${scale})
                  rotateY(${rotateY}deg)
                `,
                opacity,
                zIndex,
                filter: blur > 0 ? `blur(${blur}px)` : "none",
                transitionTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
              onClick={() => goToSlide(index)}
            >
              <div className="w-full h-full overflow-hidden relative group rounded-xl">
                {!isImageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-xl" />
                )}
                <Image
                  src={slide.image || "/placeholder.svg"}
                  alt="marketplace-slide"
                  fill
                  className={`object-cover transition-opacity duration-500 rounded-xl ${
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => handleImageLoad(slide.id)}
                  priority={offset === 0}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Slide Indicators */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-3 z-60">
        {natureSlides.map((slide, index) => (
          <button
            key={slide.id}
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 border-2 ${
              index === currentIndex
                ? "bg-[#D2045B] shadow-lg scale-110"
                : "bg-[#2E3239]"
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>

    {/* Right Navigation Button */}
    {showControls && (
      <div className="flex-shrink-0 order-4 lg:order-none">
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E181D] hover:bg-white/20 rounded-full text-gray-700 border-gray-300 backdrop-blur-sm shadow-lg"
          onClick={slideNext}
          disabled={isAnimating}
        >
          <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>
    )}
  </div>
</div>

  )
}
