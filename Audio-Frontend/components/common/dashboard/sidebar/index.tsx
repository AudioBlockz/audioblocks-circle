
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  House,
  ListMusic,
  BarChart2,
  Users,
  Menu,
  X
} from "lucide-react"

const navItems = [
  { name: "Explore", href: "/dashboard", icon: House },
  { name: "My Playlist", href: "/dashboard/playlist", icon: ListMusic },
  { name: "Metrics", href: "#", icon: BarChart2 },
  { name: "Community", href: "/dashboard/community", icon: Users },
]

const Sidebar = () => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Hamburger for mobile */}
      <div className="md:hidden p-4">
        <button
          onClick={() => setOpen(!open)}
          className="text-white focus:outline-none"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          open ? "block" : "hidden"
        } md:block bg-[#161616] text-white w-45 h-screen px-5 py-6 fixed top-0 left-0 z-40 shadow-md transition-all duration-300`}
      >
        {/* Logo */}
        <Link href="/" className="flex justify-left items-center mb-8">
          <Image src="/logo.png" alt="Logo" width={80} height={80} />
        </Link>

        {/* Nav Links */}
        <nav className="flex flex-col gap-2 mb-10">
          {navItems.map(({ name, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={name}
                href={href}
                className={`flex items-center gap-3 py-2 hover:bg-gradient-to-r hover:from-[#D2045B] hover:to-[#885FA8] hover:bg-clip-text hover:text-transparent font-semibold rounded-lg transition-all text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-[#D2045B] to-[#885FA8] bg-clip-text text-transparent"
                    : "text-[#A3A3A3] "
                }`}
                onClick={() => setOpen(false)} // close on mobile
              >
                <Icon size={18} className="text-white"  />
                {name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute flex flex-col bottom-20 left-4 text-xs font-bold text-gray-400 space-y-4">
          <Link className="hover:bg-gradient-to-r hover:from-[#D2045B] hover:to-[#885FA8] hover:bg-clip-text hover:text-transparent" href="#">Legal</Link>
          <Link className="hover:bg-gradient-to-r hover:from-[#D2045B] hover:to-[#885FA8] hover:bg-clip-text hover:text-transparent"  href="#">Privacy Policy</Link>
          <Link className="hover:bg-gradient-to-r hover:from-[#D2045B] hover:to-[#885FA8] hover:bg-clip-text hover:text-transparent"  href="#">Privacy Policy</Link>
          <Link className="hover:bg-gradient-to-r hover:from-[#D2045B] hover:to-[#885FA8] hover:bg-clip-text hover:text-transparent"  href="#">Cookies</Link>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
