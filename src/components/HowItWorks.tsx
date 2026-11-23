export function HowItWorks() {
  const steps = [
    {
      num: '০১',
      title: 'বিড অথবা ফিক্সড রেট বেছে কাজ পোস্ট করুন',
      desc: 'কী ধরনের সহায়তা লাগবে (হাসপাতাল গাইড, স্কুল এসকর্ট, বডিগার্ড বা মিস্ত্রি), ঢাকা বা নারায়ণগঞ্জের এলাকা এবং লাইভ বিডিং বা ফিক্সড রেট নির্বাচন করে পোস্ট করুন।',
    },
    {
      num: '০২',
      title: 'আশেপাশের কর্মীরা বিড বা বুকিং নেবেন',
      desc: 'বিডিং মোডে আশেপাশের কর্মীরা চার্জ (৳) ও সময় জানিয়ে বিড করবেন। আর ফিক্সড রেট মোডে প্রথম প্রস্তুত কর্মী সরাসরি নির্ধারিত চার্জে কাজটি নিতে পারবেন।',
    },
    {
      num: '০৩',
      title: 'নিরাপদ সেবা ও সহজ পেমেন্ট',
      desc: 'কাজ শেষে বিকাশ, নগদ (০১৬৮৩৪২৯১০৯) অথবা হাতে নগদে পেমেন্ট সম্পন্ন করুন এবং অ্যাপে পেমেন্ট স্ট্যাটাস নিশ্চিত করুন।',
    },
  ];

  return (
    <section id="how-it-works" className="py-14 lg:py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
            যেভাবে ৩টি সহজ ধাপে জরুরি সহায়তা পাবেন
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            দালাল বা মধ্যস্থতাকারী ছাড়াই সরাসরি কর্মীর সাথে স্বচ্ছ চার্জে কাজের সমাধান।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-6 bg-green-50/40 border border-slate-200 rounded-xl flex flex-col"
            >
              <span className="font-mono text-sm font-semibold text-green-700 mb-3">
                ধাপ {step.num}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
