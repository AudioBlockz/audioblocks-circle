import Collective from '@/components/common/collective/Collective';
import Events from '@/components/common/collective/Events';
import Faq from '@/components/common/collective/Faq';
import Hero from '@/components/common/collective/Hero';
import Members from '@/components/common/collective/Members';
import React from 'react';

const Collectives = () => {
  return (
    <>
      <Hero />
      <Collective/>
      <Members />
      <Events />
      <Faq/>
    </>
  );
};

export default Collectives;
