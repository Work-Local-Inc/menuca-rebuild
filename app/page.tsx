'use client'

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #fff7ed, #ffffff, #faf5ff)',
      overflow: 'hidden'
    }}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-float-delay-1"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-red-200 rounded-full opacity-20 animate-float-delay-2"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-orange-600 group-hover:scale-110 transition-transform duration-300">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"></path>
                  <line x1="6" x2="18" y1="17" y2="17"></line>
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent">MenuCA</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-7xl md:text-8xl font-black text-gray-900 mb-4 leading-tight">
              <span className="bg-gradient-to-r from-orange-600 via-red-600 to-purple-600 bg-clip-text text-transparent">REVOLUTIONARY</span><br/>
              <span className="text-gray-900">Food Ordering</span><br/>
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Experience</span>
            </h1>
            <p className="text-2xl text-gray-700 mb-8 max-w-4xl mx-auto font-medium">
              🧠 <strong>AI-Powered Personalization</strong> • 🚀 <strong>Sub-30 Second Ordering</strong> • 📊 <strong>Real-Time Business Intelligence</strong>
            </p>
          </div>

          {/* CTA section */}
          <div className="text-center bg-gray-900 rounded-3xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Experience the future of restaurant ordering and management</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.href = '/restaurant/onboard'}
                className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-blue-50 h-11 rounded-md text-lg px-8 py-6 bg-orange-600 hover:bg-orange-700"
              >
                🚀 Start Restaurant Onboarding
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


