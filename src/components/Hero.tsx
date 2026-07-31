'use client'

import Link from 'next/link'

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Built for UMP & TUT Nelspruit
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Vacation storage without the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">headache</span>.
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We collect from your res on Friday, store your stuff safely in Nelspruit, 
              and deliver it back when the term starts. From <span className="font-bold text-blue-600">R400</span> for up to 2 items.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/booking" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
                Book your storage
              </Link>
              <Link href="#pricing" className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-blue-600 hover:text-blue-600 transition">
                See pricing
              </Link>
            </div>
            <div className="flex gap-6 mt-8">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Insured & secure
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Friday collections
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-green-500">✓</span> Nelspruit local
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold mb-4">Live price calculator</h3>
            <p className="text-gray-600 mb-6">See exactly what you'll pay. No hidden fees.</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Number of items</label>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                  <span className="text-gray-500 text-sm">e.g. boxes, suitcases, mini-fridge, etc.</span>
                </div>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base package (up to 2 items)</span>
                  <span className="font-semibold">R400.00</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Extra items (0 x R30)</span>
                  <span>R0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-blue-600">R400.00</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>50% Deposit</span>
                  <span>R200.00 <span className="text-xs text-gray-400">Due to book</span></span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>50% Balance</span>
                  <span>R200.00 <span className="text-xs text-gray-400">7 days before delivery</span></span>
                </div>
              </div>
              <Link href="/booking" className="block bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition">
                Book for R400.00
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}