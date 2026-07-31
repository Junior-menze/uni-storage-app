import { Truck, Warehouse, Home } from 'lucide-react'

export function HowItWorks() {
  const steps = [
    {
      icon: Truck,
      title: 'Friday collection',
      description: 'Pick a Friday from the calendar. Our team collects from your UMP or TUT residence.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Warehouse,
      title: 'Secure storage',
      description: 'Your items are stored in our monitored Nelspruit facility for the whole break.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Home,
      title: 'Doorstep delivery',
      description: 'Pay the balance 7 days before delivery, and we drop everything back at your door.',
      color: 'bg-green-100 text-green-600'
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Three easy steps
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From your res door to secure storage and back again — we do the heavy lifting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < 2 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-blue-200 -z-10" />
              )}
              <div className="bg-white p-8 rounded-2xl shadow-lg text-center relative">
                <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <step.icon size={32} />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Campus Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-blue-600">
            <h3 className="text-2xl font-bold text-blue-800 mb-3">🏛️ University of Mpumalanga</h3>
            <p className="text-gray-600">Friday pickups from res gates. Delivery back on your chosen weekday.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-purple-600">
            <h3 className="text-2xl font-bold text-purple-800 mb-3">🏫 TUT Nelspruit Campus</h3>
            <p className="text-gray-600">Friday pickups from res gates. Delivery back on your chosen weekday.</p>
          </div>
        </div>
      </div>
    </section>
  )
}