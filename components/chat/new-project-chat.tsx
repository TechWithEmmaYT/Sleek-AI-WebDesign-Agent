import { ChatStatus } from 'ai';
import { motion } from "motion/react"
import { PromptInputMessage } from '../ai-elements/prompt-input';
import { Suggestion, Suggestions } from '../ai-elements/suggestion';
import ChatInput from './chat-input';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

type PropsType = {
  input: string;
  isLoading: boolean;
  status: ChatStatus;
  setInput: (input: string) => void;
  onStop: () => void;
  onSubmit: (message: PromptInputMessage, options?: any) => void;
}

const NewProjectChat = ({
  input,
  isLoading,
  status,
  setInput,
  onStop,
  onSubmit
}: PropsType) => {


  const suggestions = [
    {
      label: "Modern HR SaaS Landing Page",
      value: "A clean, high-conversion B2B SaaS landing page for an HR and Payroll platform. The color palette features a vibrant royal blue primary color, bright yellow accent for CTA buttons, and alternating solid blue and ultra-light gray background sections. The hero section must have a solid blue background with a faint grid mesh, centered bold typography, and a massive overlapping 'bento-style' composition of floating white UI dashboard cards showing mock payroll data and SVG charts. Include a 3-column bento grid for features with mini UI elements, a 2-column section with a stylized SVG globe, a horizontal timeline-based pricing section on a blue background, a 3-column testimonials grid, and a massive bright yellow rounded CTA banner nested just above a clean footer."
    },
    {
      label: "AI SaaS Landing Page",
      value: "A cutting-edge landing page for an autonomous AI workflow platform. Deep space dark mode with vibrant indigo radial light-leaks, floating glassmorphic navbar, hero with glowing gradient text, bento grid showcasing features, and sleek pricing section."
    },
    {
      label: "B2B SaaS Landing",
      value: "A serious B2B SaaS marketing site with structured hero, client logos strip (Vercel, Linear, Notion, Stripe), feature sections with diagrams, data visualization preview, pricing tiers, FAQ accordion, and enterprise call-to-action. Clear hierarchy and strong spacing rhythm."
    },
    {
      label: "Sales Landing",
      value: "A high-contrast, modern B2B SaaS Sales landing page. The theme uses a crisp white background, deep navy/purple-black for inverted containers, and a vibrant Lime Green primary accent. The Hero features a bold H1 with an inline circular icon, next to a floating composition of white and lime-green UI dashboard cards with SVG bar charts. Below the hero is a massive, dark navy rounded-3xl container housing a 2x2 features grid with pill-shaped badges. Follow this with a complex 3-row white bento grid showcasing UI mockups (SVG maps, bar charts, and an overlapping dark stat card). Include a 'How it Works' section with a vertical numbered timeline alongside overlapping login UI mockups. Finish with a dark navy 3-column pricing container and a bright lime-green rounded CTA banner just above a clean, light footer."
    },
    {
      label: "FinTech Landing",
      value: "A Dribbble-quality landing page for a modern global payments app. The theme alternates between a deep, dark forest/emerald green and pristine white. The primary accent color is a vibrant neon Emerald Green. The Hero section is dark mode with an emerald radial light-leak, featuring a centered massive H1, a floating UI card representing a mobile banking interface, and smaller glassmorphic pill badges floating around it (e.g., 'Total Balance'). Follow this with a pristine white section containing a muted partner logo cloud, a 6-card bento grid for features with green icons, and two 2-column split sections matching text/checklists against large floating white UI cards. Include a dark-mode pricing section with 3 glassmorphic cards and emerald accents, a white testimonials grid, and a massive dark-green rounded CTA card with an inner radial glow placed just above a sleek, dark-mode footer."
    },
    {
      label: "Crypto Exchange",
      value: "A futuristic trading interface for a crypto exchange called 'Apex'. Deep midnight background with electric blue glows. Central trading chart with candlesticks, left order book panel, right trade history, top navbar with BTC $67,432 ETH $3,241 live prices, and glowing buy/sell buttons."
    },
    {
      label: "Payment Platform",
      value: "A high-conversion landing page for a payment link product. Strong hero with 'Accept Payments Instantly' headline, live payment preview mockup on the right, trust badges, feature grid explaining no-code checkout, use-case sections (Creators, SaaS, Freelancers), pricing comparison, and a bold CTA. Clean fintech-grade design."
    },
    {
      label: "Neobank Website",
      value: "A modern neobank marketing website. Confident hero with app preview, trust metrics row showing '2M+ users', '$4.2B processed', debit card showcase section, feature breakdown grid, comparison table vs traditional banks, testimonials, and strong sign-up CTA."
    },
    //  {
    //     label: "Finance Dashboard",
    //     value: "A high-fidelity, neo-brutalist financial dashboard. The style features sharp corners, thick solid black borders (border-2 border-black), and stark color blocking. The layout consists of a dark charcoal left sidebar, a wide middle section, and a right sidebar. The middle section is split horizontally: the top half has a beige/cream background containing a massive balance, solid black buttons, and two brutalist stat cards (one pastel blue, one pastel yellow) with hard black drop shadows. The bottom half is pure white, featuring a sharp, straight-line SVG chart with a solid black line and a secondary muted blue line over dashed gridlines. The right sidebar is pure white, featuring an overlapping, rotated 'credit card stack' illustration (black and pale pink), a 'Current Account' balance, and a transaction list where avatars have solid black borders."
    // },

    // {
    //     label: "Hyper-Modern Fintech",
    //     value: "The 'Titan Wealth' dashboard. A 'Glassmorphism' masterclass with blurred backdrop filters and glowing neon-blue data lines. Features a 3D rotating globe for 'Global Assets', modular frosted-glass cards for crypto-wallets, and a sleek, dark-mode 'Command Bar' for instant transactions."
    // },
    // {
    //     label: "Healthcare Landing",
    //     value: "A premium landing page for 'Helix AI', a healthcare diagnostics platform. Clinical white background with soft violet accents. Hero with 3D DNA visual, bento grid research nodes, trust badges showing '99.8% Accuracy', '2.4M+ Diagnoses', feature sections, and a sticky frosted header."
    // },
  ];


  const handleSuggestionClick = (value: string) => {
    setInput(value);
  };

  return (
    <div className="w-full relative min-h-screen">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center
         px-4 pt-20
        ">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='font-serif text-4xl sm:text-5xl
            md:text-6xl xl:text-7xl text-center mb-4
            tracking-tight
            '
          >
            Design your website with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className='text-muted-foreground text-lg mb-4 text-center
            max-w-lg
            '
          >
            Describe your vision, and watch Sleek transform
            your ideas into a stunning web design.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='w-full max-w-2xl mb-4'
          >
            <ChatInput
              input={input}
              isLoading={isLoading}
              status={status}
              setInput={setInput}
              onStop={onStop}
              onSubmit={onSubmit}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className='w-full max-w-3xl'
          >
            <Suggestions className="justify-center flex-wrap">
              {suggestions.map((item) => (
                <Suggestion
                  key={item.label}
                  className="font-normal"
                  suggestion={item.value}
                  onClick={() => handleSuggestionClick(item.value)}
                >
                  {item.label}
                </Suggestion>
              ))}
            </Suggestions>

          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className='flex justify-center w-full max-w-3xl mx-auto'
          >
            <ProjectGrid />
          </motion.div>

        </div>
      </div>
    </div>
  )
}

const ProjectGrid = () => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`/api/project`);
      if (!res.ok) return [];
      return res.json() as Promise<{
        id: string;
        title: string;
        slugId: string;
        createdAt: string
      }[]>
    }
  })

  console.log(projects)

  if (isLoading) return <ProjectGridSkeleton />
  if (!projects || projects.length === 0) {
    return null
  }
  return (
    <div className="w-full mx-auto pt-8 px-8">
      <h5 className="text-sm font-medium text-muted-foreground mb-4 px-2">
        Recent Projects
      </h5>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4
       xl:grid-cols-5 gap-4
      '>
        {projects?.map((project) => (
          <Link key={project.id} href={`/project/${project.slugId}`}
            className="group flex flex-col gap-2 transition-all">
            <div className='aspect-4/3 rounded-xl bg-muted overflow-hidden relative border border-border group-hover:border-primary'>

              <div className="absolute inset-0 bg-linear-to-br from-primary/5
        to-primary/20" />

              <div className="absolute inset-0 flex items-center justify-center">
                <span className='text-xs'>{project.title.charAt(0)}</span>
              </div>
            </div>
            <h4 className="textsm font-medium truncate px-1">{project.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  )
}


const ProjectGridSkeleton = () => (
  <div
    className="w-full  mx-auto mt-4 px-12 animate-pulse">
    <div className="h-4 w-32 bg-muted rounded mb-4 ml-2" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-4/3 rounded-xl bg-muted border border-border" />
          <div className="h-4 w-20 bg-muted rounded mx-1" />
        </div>
      ))}
    </div>
  </div>
);

export default NewProjectChat
