import { MoveLeft, MoveRight } from "lucide-react"

interface ArrowProps {
  onClick?: () => void;
}

export const NextArrow = ({ onClick }: ArrowProps) => {
  return (
    <div
      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-[#0C090A99] p-6 rounded-full cursor-pointer"
      onClick={onClick}
    >
      <MoveRight className="text-white" size={20} />
    </div>
  )
}


export const PrevArrow = ({ onClick }: ArrowProps) => {
  return (
    <div
      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-[#0C090A99] p-6 rounded-full cursor-pointer"
      onClick={onClick}
    >
      <MoveLeft className="text-white" size={20} />
    </div>
  )
}