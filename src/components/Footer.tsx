export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-600">
        <p>&copy; {new Date().getFullYear()} Mediconnect. All rights reserved.</p>
        <p className="mt-2">Built for demo purposes. Follow security best-practices before production use.</p>
      </div>
    </footer>
  );
}
