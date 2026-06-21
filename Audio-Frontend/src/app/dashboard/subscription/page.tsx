"use client"
import { Zap } from 'lucide-react';
import React, { useState } from 'react';

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState('Monthly');

  return (
    <>
    
    <div className=" text-[#ABABAB] font-roboto rounded-lg mb-36 space-y-7">
      <h2 className="text-2xl  border-b border-[#151515] pb-4 font-bold">Subscription</h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#151515] pb-8">
          <div>
            <h3 className="text-xl font-semibold">Renew Subscription</h3>
            <p className="text-sm text-white">Get all access and an extra 20% off when you subscribe annually</p>
          </div>
          <button className="bg-pink-600 hover:bg-pink-700 flex gap-2 text-white font-medium text-sm py-2 px-5 rounded-full">
            <Zap className='h-4 w-4'/>
            <span>Renew</span> 
          </button>
        </div>

        
        <div>
          <h3 className="text-lg font-medium">Upgrade to Premium</h3>
          <p className="text-sm text-white">Get all access and an extra 15% off when you subscribe annually</p>

          <p className='mt-3  text-sm text-[#606060]'>Choose Subscription Plan</p>
          <div className="grid gap-5 grid-cols-3 mt-4">
            {['Monthly', 'Quarterly', 'Annually'].map((plan, index) => (
              <div
                key={index}
                onClick={() => setSelectedPlan(plan)}
                className={`md:col-span-1 col-span-3 cursor-pointer p-4 rounded-md border bg-[#FDFDFD14] ${
                  selectedPlan === plan ? 'border-pink-600 ' : 'border-none'
                }`}
              >
                <p className="text-sm">{`Pay ${plan}`}</p>
                <p className="text-xs text-gray-400">
                  {plan === 'Monthly' && '$1.5 / Month Per Member'}
                  {plan === 'Quarterly' && '$4.28 (Save 5%)'}
                  {plan === 'Annually' && '$15.30 (Save 15%)'}
                </p>
              </div>
            ))}
          </div>
        </div>

        
        <p className="text-xs text-gray-400 mt-4">
          By Continuing you agree to our{' '}
          <a href="#" className="text-pink-600 underline">
            terms and conditions.
          </a>
        </p>
        <button className="flex gap-2 px-4 bg-pink-600 hover:bg-pink-700 text-white font-medium text-sm py-2 rounded-full">
        <Zap className='h-4 w-4'/>
         <span>Upgrade to Plus</span> 
         
        </button>
      </div>
    </div>
    </>
  );
}