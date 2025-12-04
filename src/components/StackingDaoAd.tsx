import { ExternalLink } from "lucide-react";

export const StackingDaoAd = () => {
  return (
    <a
      href="https://app.stackingdao.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full group"
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#1a2e1a] via-[#243524] to-[#1a2e1a] border border-primary/30 p-4 md:p-6 shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.01]">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left section - Logo and main text */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-[#2d4a2d] flex items-center justify-center border border-primary/40 shadow-lg">
              <span className="text-2xl md:text-3xl font-black text-primary">S</span>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-white">
                STACKING<span className="text-primary">DAO</span>
              </h3>
              <p className="text-sm md:text-base text-gray-300">
                Stack STX. Earn yield. Stay liquid.
              </p>
            </div>
          </div>

          {/* Middle section - APY highlight */}
          <div className="flex items-center gap-6">
            <div className="text-center px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
              <div className="text-2xl md:text-3xl font-black text-primary">~8.5%</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">APY</div>
            </div>
            <div className="hidden md:block text-center">
              <div className="text-lg font-bold text-white">$32M+</div>
              <div className="text-xs text-gray-400">Total Value Locked</div>
            </div>
          </div>

          {/* Right section - CTA */}
          <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm md:text-base group-hover:bg-primary/90 transition-colors shadow-lg">
            Start Stacking
            <ExternalLink className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="relative mt-3 text-center text-xs text-gray-500">
          Sponsored • Liquid staking on Bitcoin L2
        </div>
      </div>
    </a>
  );
};
