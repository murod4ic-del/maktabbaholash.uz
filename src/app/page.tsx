import Link from "next/link";

const features = [
  {
    icon: "📝",
    title: "Baho qo'yish",
    description:
      "O'qituvchilar o'quvchilarga kunlik va choraklik baholarni qulay tarzda qo'yishlari mumkin.",
  },
  {
    icon: "👁️",
    title: "Nazorat qilish",
    description:
      "Ota-onalar farzandlarining baholarini real vaqtda kuzatib borishlari mumkin.",
  },
  {
    icon: "📊",
    title: "Chorak natijalari",
    description:
      "Har bir chorak uchun avtomatik hisobotlar va tahlillar shakllanadi.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              🏫 O'zbekiston maktablari uchun
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
              Maktab Baholash
              <br />
              <span className="text-indigo-200">Tizimi</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-indigo-100 leading-relaxed mb-10">
              O&apos;qituvchilar va ota-onalar uchun zamonaviy, qulay va ishonchli
              baholash platformasi. Farzandingiz bilimini kuzating va
              nazorat qiling.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all duration-200"
              >
                📚 O&apos;qituvchi sifatida kirish
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/25 hover:bg-white/25 transition-all duration-200"
              >
                👨‍👩‍👧 Ota-ona sifatida kirish
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path
              d="M0 60V20C240 0 480 0 720 20C960 40 1200 40 1440 20V60H0Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Platforma imkoniyatlari
            </h2>
            <p className="max-w-xl mx-auto text-gray-500 text-lg">
              Maktab jarayonlarini raqamlashtirish va samaradorlikni oshirish
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`animate-fade-in stagger-${i + 1} bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100+", label: "Maktablar" },
              { value: "5000+", label: "O'quvchilar" },
              { value: "300+", label: "O'qituvchilar" },
              { value: "24/7", label: "Qo'llab-quvvatlash" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-semibold text-white mb-2">
            🏫 MaktabBaholash
          </p>
          <p className="text-sm">
            © 2026 Barcha huquqlar himoyalangan. maktabbaholash.uz
          </p>
        </div>
      </footer>
    </div>
  );
}
