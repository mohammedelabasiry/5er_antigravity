import dynamic from 'next/dynamic';

// Dynamically import the Map component to avoid SSR errors with Leaflet
const MapDiscovery = dynamic(() => import('@/components/MapDiscovery'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-50 flex items-center justify-center h-[calc(100vh-4rem)]">
      <div className="text-center space-y-3">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full"></div>
        <p className="text-sm font-semibold text-slate-500">Initializing Map Discovery...</p>
      </div>
    </div>
  ),
});

export default function DonorMapPage() {
  return <MapDiscovery />;
}
