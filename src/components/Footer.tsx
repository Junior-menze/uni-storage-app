import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">StashSpace</h3>
            <p className="text-gray-400 text-sm">
              Student storage & logistics for UMP & TUT Nelspruit. Secure, affordable, and convenient.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/#pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition">How it works</Link></li>
              <li><Link href="/booking" className="hover:text-white transition">Book now</Link></li>
            </ul>
          </div>

          {/* Campuses */}
          <div>
            <h4 className="font-semibold mb-4">Campuses</h4>
            <ul className="space-y-2 text-gray-400">
              <li>University of Mpumalanga</li>
              <li>TUT Nelspruit Campus</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li> info@stashspace.co.za</li>
              <li> Nelspruit, South Africa</li>
              <li> +27 82 123 4567</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>© 2026 StashSpace Nelspruit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}