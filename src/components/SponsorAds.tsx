import { ExternalLink, Grid3X3 } from "lucide-react";
import { Link } from "react-router-dom";
import stacksMentorLogo from "@/assets/sponsors/stacks-mentor-ai.ico";
import boostxLogo from "@/assets/sponsors/boostx.png";
import stxtoolsLogo from "@/assets/sponsors/stxtools.ico";
import fakLogo from "@/assets/sponsors/fak.ico";
import gammaLogo from "@/assets/sponsors/gamma.ico";
import bitflowLogo from "@/assets/sponsors/bitflow.ico";
import zeroAuthorityLogo from "@/assets/sponsors/zeroauthority.ico";
import velarLogo from "@/assets/sponsors/velar.jpg";
import alexLogo from "@/assets/sponsors/alex.jpg";
import arkadikoLogo from "@/assets/sponsors/arkadiko.jpg";
import ryderLogo from "@/assets/sponsors/ryder.png";
import hermeticaLogo from "@/assets/sponsors/hermetica.jpg";
import deorganizedLogo from "@/assets/sponsors/deorganized.jpg";
import zestLogo from "@/assets/sponsors/zest.jpg";

interface Sponsor {
  name: string;
  tagline: string;
  url: string;
  color: string;
  logo?: string;
  fallbackLogo?: string;
  logoStyle?: string;
}

const sponsors: Sponsor[] = [
  {
    name: "Stacks Mentor AI",
    tagline: "AI-powered learning for Stacks",
    url: "https://stacks-mentor-ai.lovable.app",
    color: "from-purple-600 to-indigo-600",
    logo: stacksMentorLogo,
  },
  {
    name: "BoostX",
    tagline: "Amplify your crypto journey",
    url: "https://boostx.cc/",
    color: "from-orange-500 to-red-500",
    logo: boostxLogo,
  },
  {
    name: "Zest Protocol",
    tagline: "DeFi lending on Bitcoin",
    url: "https://app.zestprotocol.com",
    color: "from-yellow-500 to-amber-600",
    logo: zestLogo,
  },
  {
    name: "STX Tools",
    tagline: "Essential Stacks analytics",
    url: "https://stxtools.io/",
    color: "from-blue-500 to-cyan-500",
    logo: stxtoolsLogo,
  },
  {
    name: "Deorganized",
    tagline: "Web3 media & insights",
    url: "https://deorganized.media",
    color: "from-pink-500 to-rose-500",
    logo: deorganizedLogo,
  },
  {
    name: "Hermetica",
    tagline: "Bitcoin-backed stablecoin",
    url: "https://portfolio.hermetica.fi",
    color: "from-emerald-500 to-teal-600",
    logo: hermeticaLogo,
  },
  {
    name: "Ryder",
    tagline: "Self-custody wallet",
    url: "https://ryder.id",
    color: "from-violet-500 to-purple-600",
    logo: ryderLogo,
  },
  {
    name: "FAK",
    tagline: "Fun on Stacks",
    url: "https://fak.fun",
    color: "from-red-500 to-orange-500",
    logo: fakLogo,
  },
  {
    name: "Gamma",
    tagline: "NFT marketplace",
    url: "https://gamma.io",
    color: "from-lime-500 to-green-600",
    logo: gammaLogo,
  },
  {
    name: "Bitflow",
    tagline: "DeFi on Bitcoin",
    url: "https://app.bitflow.finance",
    color: "from-sky-500 to-blue-600",
    logo: bitflowLogo,
  },
  {
    name: "Zero Authority DAO",
    tagline: "Decentralized governance",
    url: "https://zeroauthoritydao.com",
    color: "from-gray-600 to-slate-700",
    logo: zeroAuthorityLogo,
  },
  {
    name: "Velar",
    tagline: "DeFi Hub",
    url: "https://velar.com",
    color: "from-indigo-500 to-violet-600",
    logo: velarLogo,
  },
  {
    name: "ALEX",
    tagline: "Bitcoin DeFi",
    url: "https://alex.io",
    color: "from-amber-500 to-orange-600",
    logo: alexLogo,
  },
  {
    name: "Arkadiko",
    tagline: "Stablecoin Protocol",
    url: "https://arkadiko.finance",
    color: "from-cyan-500 to-blue-600",
    logo: arkadikoLogo,
  }
];

export const ScrollingToolAds = () => {
  // Duplicate sponsors for seamless loop
  const duplicatedSponsors = [...sponsors, ...sponsors];

  return (
    <div className="w-full overflow-hidden bg-card/50 backdrop-blur-sm border-b border-border/50 py-2">
      <div className="flex items-center">
        <Link 
          to="/tools" 
          className="flex items-center gap-1 px-4 text-xs font-semibold text-primary hover:text-primary/80 transition-colors whitespace-nowrap border-r border-border/50 mr-2"
        >
          <Grid3X3 className="w-3 h-3" />
          View All
        </Link>
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-scroll-marquee">
        {duplicatedSponsors.map((sponsor, index) => (
          <a
            key={`${sponsor.name}-${index}`}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 whitespace-nowrap hover:opacity-80 transition-opacity group"
          >
            {sponsor.logo ? (
              <div className="w-5 h-5 rounded overflow-hidden flex items-center justify-center bg-white/10 flex-shrink-0">
                <img 
                  src={sponsor.logo} 
                  alt={`${sponsor.name} logo`}
                  className="w-4 h-4 object-contain"
                />
              </div>
            ) : (
              <div className={`w-5 h-5 rounded ${sponsor.logoStyle} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold text-[10px]">{sponsor.fallbackLogo}</span>
              </div>
            )}
            <span className="text-xs font-semibold text-foreground">{sponsor.name}</span>
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground">{sponsor.tagline}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            
            {/* Separator */}
            <span className="text-muted-foreground/30 ml-4">|</span>
          </a>
        ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToolAds = () => {
  return (
    <div className="w-full space-y-4">
      <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">
        Discover More Tools
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${sponsor.color} p-[1px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
              <div className="rounded-lg bg-background/95 p-3 h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  {sponsor.logo ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/10">
                      <img 
                        src={sponsor.logo} 
                        alt={`${sponsor.name} logo`}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-lg ${sponsor.logoStyle} flex items-center justify-center shadow-md`}>
                      <span className="text-white font-bold text-sm tracking-tight">{sponsor.fallbackLogo}</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-tight">
                      {sponsor.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {sponsor.tagline}
                    </p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
