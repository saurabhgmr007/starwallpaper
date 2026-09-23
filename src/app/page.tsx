import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Live Wallpaper Notes</h1>
        <p className="text-gray-600">
          Manage your notes or view your live wallpaper.
        </p>
        <div className="flex flex-col gap-4">
          <Link 
            href="/notes"
            className="block w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Manage Notes (/notes)
          </Link>
          <Link 
            href="/wallpaper"
            className="block w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            View Wallpaper (/wallpaper)
          </Link>
        </div>
      </div>
    </div>
  );
}
