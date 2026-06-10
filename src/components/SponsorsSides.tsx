'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/LanguageContext';

interface Sponsor {
  id: number;
  name: string;
  logo: string;        // local path in /sponsors/
  color: string;       // brand primary color (fallback)
  textInitials: string; // fallback initials
}

// 20 sponsors with local SVG logos
const allSponsors: Sponsor[] = [
  { id: 1,  name: 'Vodafone',    logo: '/sponsors/vodafone.svg',    color: '#E60000', textInitials: 'Vf' },
  { id: 2,  name: 'Nike',        logo: '/sponsors/nike.svg',        color: '#111111', textInitials: 'NK' },
  { id: 3,  name: 'Adidas',      logo: '/sponsors/adidas.svg',      color: '#000000', textInitials: 'Ad' },
  { id: 4,  name: 'Samsung',     logo: '/sponsors/samsung.svg',     color: '#1428A0', textInitials: 'SS' },
  { id: 5,  name: 'Pepsi',       logo: '/sponsors/pepsi.svg',       color: '#004B93', textInitials: 'PP' },
  { id: 6,  name: 'Coca-Cola',   logo: '/sponsors/cocacola.svg',    color: '#F40009', textInitials: 'CC' },
  { id: 7,  name: 'Microsoft',   logo: '/sponsors/microsoft.svg',   color: '#00A4EF', textInitials: 'Ms' },
  { id: 8,  name: 'Google',      logo: '/sponsors/google.svg',      color: '#4285F4', textInitials: 'G'  },
  { id: 9,  name: 'Apple',       logo: '/sponsors/apple.svg',       color: '#555555', textInitials: '' },
  { id: 10, name: 'Amazon',      logo: '/sponsors/amazon.svg',      color: '#FF9900', textInitials: 'Az' },
  { id: 11, name: 'Etisalat',    logo: '/sponsors/etisalat.svg',    color: '#5C8A2F', textInitials: 'Et' },
  { id: 12, name: 'Uber',        logo: '/sponsors/uber.svg',        color: '#000000', textInitials: 'Ub' },
  { id: 13, name: 'Emirates',    logo: '/sponsors/emirates.svg',    color: '#D71921', textInitials: 'Em' },
  { id: 14, name: 'Toyota',      logo: '/sponsors/toyota.svg',      color: '#EB0A1E', textInitials: 'Ty' },
  { id: 15, name: 'Huawei',      logo: '/sponsors/huawei.svg',      color: '#CF0A2C', textInitials: 'Hw' },
  { id: 16, name: 'Tesla',       logo: '/sponsors/tesla.svg',       color: '#CC0000', textInitials: 'Ts' },
  { id: 17, name: 'BMW',         logo: '/sponsors/bmw.svg',         color: '#0066B1', textInitials: 'BM' },
  { id: 18, name: 'Zara',        logo: '/sponsors/zara.svg',        color: '#000000', textInitials: 'ZR' },
  { id: 19, name: 'Visa',        logo: '/sponsors/visa.svg',        color: '#1A1F71', textInitials: 'Vi' },
  { id: 20, name: 'MasterCard',  logo: '/sponsors/mastercard.svg',  color: '#EB001B', textInitials: 'MC' },
];

// Split: 10 left, 10 right
const leftSponsors  = allSponsors.slice(0, 10);
const rightSponsors = allSponsors.slice(10, 20);

function SponsorLogo({ sponsor }: { sponsor: Sponsor }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: imgError ? '#f1f5f9' : 'transparent',
      }}
    >
      {!imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sponsor.logo}
          alt={sponsor.name}
          width={48}
          height={48}
          style={{
            width: 48,
            height: 48,
            objectFit: 'cover',
            borderRadius: '50%',
          }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: sponsor.color,
            letterSpacing: '-0.5px',
          }}
        >
          {sponsor.textInitials}
        </span>
      )}
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  return (
    <div
      className="sponsor-card"
      style={{
        width: '100%',
        padding: '10px 8px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: 'default',
        transition: 'transform 0.3s, box-shadow 0.3s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        flexShrink: 0,
        pointerEvents: 'auto',
      }}
    >
      <SponsorLogo sponsor={sponsor} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#334155',
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '0.3px',
        }}
      >
        {sponsor.name}
      </span>
    </div>
  );
}

function TickerColumn({ sponsors, direction }: { sponsors: Sponsor[]; direction: 'up' | 'down' }) {
  // Duplicate list 3x for seamless infinite loop
  const repeated = [...sponsors, ...sponsors, ...sponsors];
  const animName = direction === 'up' ? 'tickerUp' : 'tickerDown';

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        width: '100%',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
    >
      <div
        className={`ticker-track-${direction}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: `${animName} 50s linear infinite`,
          willChange: 'transform',
        }}
      >
        {repeated.map((s, i) => (
          <SponsorCard key={`${s.id}-${i}`} sponsor={s} />
        ))}
      </div>
    </div>
  );
}

export default function SponsorsSides() {
  const { language } = useTranslation();
  const label = language === 'ar' ? 'رعاة المنصة' : 'Our Sponsors';

  return (
    <>
      {/* Pure CSS infinite vertical ticker */}
      <style jsx global>{`
        @keyframes tickerUp {
          0%   { transform: translateY(0); }
          100% { transform: translateY(calc(-100% / 3)); }
        }
        @keyframes tickerDown {
          0%   { transform: translateY(calc(-100% / 3)); }
          100% { transform: translateY(0); }
        }

        .sponsor-sidebar:hover .ticker-track-up,
        .sponsor-sidebar:hover .ticker-track-down {
          animation-play-state: paused;
        }

        .sponsor-card:hover {
          transform: scale(1.06) !important;
          box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important;
        }

        @media (max-width: 1279px) {
          .sponsor-sidebar {
            display: none !important;
          }
        }
      `}</style>

      {/* ——— LEFT BAR ——— */}
      <aside
        className="sponsor-sidebar"
        style={{
          position: 'fixed',
          left: 0,
          top: 64,
          bottom: 0,
          width: 120,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 8px',
          gap: 6,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#94A3B8',
            background: 'rgba(241,245,249,0.92)',
            padding: '3px 10px',
            borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.05)',
            pointerEvents: 'auto',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
        <TickerColumn sponsors={leftSponsors} direction="up" />
      </aside>

      {/* ——— RIGHT BAR ——— */}
      <aside
        className="sponsor-sidebar"
        style={{
          position: 'fixed',
          right: 0,
          top: 64,
          bottom: 0,
          width: 120,
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 8px',
          gap: 6,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#94A3B8',
            background: 'rgba(241,245,249,0.92)',
            padding: '3px 10px',
            borderRadius: 20,
            border: '1px solid rgba(0,0,0,0.05)',
            pointerEvents: 'auto',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
        <TickerColumn sponsors={rightSponsors} direction="down" />
      </aside>
    </>
  );
}
