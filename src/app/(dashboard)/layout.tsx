import Kenarlik from '@/components/layout/Kenarlik';
import UstBar from '@/components/layout/UstBar';
import OfflineBari from '@/components/mobil/OfflineBari';
import MobilAltNav from '@/components/layout/MobilAltNav';

export default function DashboardDuzeni({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBari />
      <div className="flex h-screen bg-gray-50">
        {/* Masaüstü sidebar — mobilde gizli */}
        <div className="hidden md:block">
          <Kenarlik />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <UstBar />
          <main className="flex-1 overflow-y-auto
            pb-[calc(4rem+env(safe-area-inset-bottom))]
            md:pb-0">
            {children}
          </main>
        </div>
      </div>

      {/* Mobil alt navigasyon — masaüstünde gizli */}
      <MobilAltNav />
    </>
  );
}
