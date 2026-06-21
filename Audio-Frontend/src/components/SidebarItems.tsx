import Link from 'next/link'
import React from 'react'

const SidebarItems = ({ icon: Icon, label, to, isActive }:any) => {
  return (
   
    <div 
    className={`text-base font-normal items-center space-x-3 rounded-lg cursor-pointer ${
          isActive ? "text-white" : "text-[#666C6C] hover:text-white"
        }`}>
     <Link href={`${to}`} className='flex space-x-3 tems-center'>
      <Icon className="w-4 h-4" />
      <span className='font-roboto text-sm font-normal leading-[18.75px] text-left'>{label}</span>
    </Link>
    </div>
  )
}

export default SidebarItems