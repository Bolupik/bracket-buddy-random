import { ExternalLink } from "lucide-react";

interface Sponsor {
  name: string;
  tagline: string;
  url: string;
  color: string;
  icon: string;
}

const sponsors: Sponsor[] = [
  {
    name: "Stacks Mentor AI",
    tagline: "AI-powered learning for Stacks",
    url: "https://stacks-mentor-ai.lovable.app",
    color: "from-purple-600 to-indigo-600",
    icon: "🤖"
  },
  {
    name: "BoostX",
    tagline: "Amplify your crypto journey",
    url: "https://boostx.cc/",
    color: "from-orange-500 to-red-500",
    icon: "🚀"
  },
  {
    name: "Zest Protocol",
    tagline: "DeFi lending on Bitcoin",
    url: "https://app.zestprotocol.com",
    color: "from-yellow-500 to-amber-600",
    icon: "⚡"
  },
  {
    name: "STX Tools",
    tagline: "Essential Stacks analytics",
    url: "https://stxtools.io/",
    color: "from-blue-500 to-cyan-500",
    icon: "📊"
  },
  {
    name: "Deorganized",
    tagline: "Web3 media & insights",
    url: "https://deorganized.media",
    color: "from-pink-500 to-rose-500",
    icon: "📰"
  }
];

export const SponsorAds = () => {
  return (
    <div className="w-full space-y-4">
      <p className="text-center text-xs text-muted-foreground uppercase tracking-wider">
        Our Sponsors
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
                  <span className="text-2xl">{sponsor.icon}</span>
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
