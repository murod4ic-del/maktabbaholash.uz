"use client";

interface ReadOnlyBannerProps {
  title?: string;
  description?: string;
}

export default function ReadOnlyBanner({
  title = "Bu ma'lumotlar AccessUZ dasturidan keladi",
  description = "Maktab, sinflar, fanlar, o'qituvchilar va o'quvchilar AccessUZ desktop dasturida boshqariladi. Web sahifa ularni faqat ko'rsatadi va o'qituvchilar baho qo'yadi. O'zgarishlar uchun dasturda yangilang va «Web sinxron» tugmasini bosing.",
}: ReadOnlyBannerProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3 items-start shadow-sm">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg">
        🔒
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-amber-900 text-sm">{title}</h3>
        <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
