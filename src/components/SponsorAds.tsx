import { ExternalLink } from "lucide-react";

interface Sponsor {
  name: string;
  tagline: string;
  url: string;
  color: string;
  logo: string;
  logoStyle?: string;
}

const sponsors: Sponsor[] = [
  {
    name: "Stacks Mentor AI",
    tagline: "AI-powered learning for Stacks",
    url: "https://stacks-mentor-ai.lovable.app",
    color: "from-purple-600 to-indigo-600",
    logo: "SM",
    logoStyle: "bg-gradient-to-br from-purple-500 to-indigo-600"
  },
  {
    name: "BoostX",
    tagline: "Amplify your crypto journey",
    url: "https://boostx.cc/",
    color: "from-orange-500 to-red-500",
    logo: "BX",
    logoStyle: "bg-gradient-to-br from-orange-500 to-red-500"
  },
  {
    name: "Zest Protocol",
    tagline: "DeFi lending on Bitcoin",
    url: "https://app.zestprotocol.com",
    color: "from-yellow-500 to-amber-600",
    logo: "Z",
    logoStyle: "bg-gradient-to-br from-yellow-400 to-amber-600"
  },
  {
    name: "STX Tools",
    tagline: "Essential Stacks analytics",
    url: "https://stxtools.io/",
    color: "from-blue-500 to-cyan-500",
    logo: "STX",
    logoStyle: "bg-gradient-to-br from-blue-500 to-cyan-400"
  },
  {
    name: "Deorganized",
    tagline: "Web3 media & insights",
    url: "https://deorganized.media",
    color: "from-pink-500 to-rose-500",
    logo: "D",
    logoStyle: "bg-gradient-to-br from-pink-500 to-rose-500"
  }
];

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
                  <div className={`w-10 h-10 rounded-lg ${sponsor.logoStyle} flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-sm tracking-tight">{sponsor.logo}</span>
                  </div>
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
