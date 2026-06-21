'use client';
import { ArrowUpRight, Star } from 'lucide-react';
import Image from 'next/image';
import Slider from 'react-slick';
import { NextArrow, PrevArrow } from '../collective/Members/navigation';
import Link from 'next/link';

const EventSection = () => {
  // Data for Upcoming Events
  const upcomingEvents = [
    {
      name: 'Fresher’s Day',
      image: '/audio.jpg',
      date: '1:30 PM - 27/7/2025',
      going: 16,
      price: '0.005ETH',
    },
    {
      name: 'Music Concert',
      date: '1:30 PM - 27/7/2025',
      going: 16,
      price: '0.005ETH',
      image: '/home/frame1.jpg',
    },
    {
      name: 'Music Concert',
      date: '1:30 PM - 27/7/2025',
      going: 16,
      price: '0.005ETH',
      image: '/AFRO.jpg',
    },
  ];

  const eventsSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 2.8,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      <div>
        <section className="">
          <div className="flex justify-between items-center pb-6 border-b">
            <h1 className="text-2xl font-semibold text-[#A3A3A3] font-poppins leading-tight tracking-tight">
              Event
            </h1>
            <Link
              href="#"
              className="bg-[#1E181D] hover:bg-[#885FA8] text-[#A3A3A3] hover:text-[#1E181D] rounded-full p-3"
            >
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="relative py-12">
            <Slider {...eventsSettings}>
              {upcomingEvents.map((event, index) => (
                <div key={index} className="px-4 shadow-2xl">
                  <div className="rounded-2xl relative overflow-hidden">
                    <div className="w-full relative h-44 rounded-lg overflow-hidden mx-auto">
                      <Image
                        src={event.image}
                        alt={event.name}
                        width={256}
                        height={256}
                        className="w-full h-full object-cover"
                      />
                    </div>


                    <div className="p-2 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1A1A1A] to-transparent space-y-1">
                      <p className="text-base font-bold">{event.name}</p>
                      <p className="text-xs text-white/70">{event.date}</p>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-xs gap-2 text-white/70">
                          <Star className="w-4 h-4 text-white" />
                          {event.going} Going • {event.price}
                        </div>
                        <button className="font-semibold cursor-pointer text-xs border rounded-xl px-4 py-2">
                          Buy Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        </section>
      </div>
    </>
  );
};

export default EventSection;
