import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const Faq = () => {
	return (
		<>
			<div className="w-11/12 md:py-28 py-10 text-lg m-auto text-white font-roboto">

				<h1 className="text-4xl text-center font-bold mb-8">Have Questions?</h1>

				<Accordion type="single" collapsible className="space-y-5">
					<AccordionItem value="item-1">
						<AccordionTrigger className="md:text-lg font-bold">
							What is AudioBlocks?
						</AccordionTrigger>
						<AccordionContent className="text-base">
							AudioBlocks is an innovative music streaming platform designed to
							provide a seamless listening experience while connecting users
							with their favorite artists through unique features like tipping,
							exclusive content access, and more.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2">
						<AccordionTrigger className="md:text-lg font-bold">
							{" "}
							How does AudioBlocks support independent artists?
						</AccordionTrigger>
						<AccordionContent className="text-base">
							AudioBlocks allows users to discover and support independent
							artists directly through tips, music NFTs, and exclusive content,
							giving artists new opportunities to connect with their audience
							and monetize their work.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-3">
						<AccordionTrigger className="md:text-lg font-bold">
							{" "}
							Can I use cryptocurrency for in-app purchases or tipping artists?
						</AccordionTrigger>
						<AccordionContent className="text-base">
							Yes, AudioBlocks provides an option to use cryptocurrency for
							in-app transactions, making it easy to support artists in new and
							flexible ways.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-4">
						<AccordionTrigger className="md:text-lg font-bold">
							{" "}
							What makes AudioBlocks different from other streaming platforms?
						</AccordionTrigger>
						<AccordionContent className="text-base">
							AudioBlocks stands out with its focus on artist interaction,
							unique monetization features like music NFTs, and a user-friendly
							interface that ensures a high-quality, ad-free listening
							experience.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-5">
						<AccordionTrigger className="md:text-lg font-bold">
							How can I discover new music on AudioBlocks?{" "}
						</AccordionTrigger>
						<AccordionContent className="text-base">
							AudioBlocks features a discovery section that highlights
							independent artists and curates playlists to help users explore
							fresh, new sounds.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-5">
						<AccordionTrigger className="md:text-lg font-bold">
							How does tipping work on AudioBlocks?{" "}
						</AccordionTrigger>
						<AccordionContent className="text-base">
							Tipping is easy with AudioBlocks. Simply select the artist you
							want to support, choose the amount, and send your tip directly to
							the artist’s profile.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</>
	);
};
export default Faq;
