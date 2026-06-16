import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { e as CircleQuestionMark, K as Camera, a2 as WifiOff, M as MapPin, a3 as FileImage, g as ChevronDown } from "../_libs/lucide-react.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const FAQS = [{
  id: "faq-1",
  icon: Camera,
  qEn: "How do I enable camera permissions?",
  qHi: "कैमरा अनुमतियां कैसे सक्षम करें?",
  aEn: "When submitting an activity, the browser will request permission to access your camera. Click 'Allow'. If blocked, check your browser site settings (usually in the URL lock icon) and set camera permissions to Allowed.",
  aHi: "गतिविधि जमा करते समय, ब्राउज़र आपके कैमरे तक पहुंच की अनुमति का अनुरोध करेगा। 'अनुमति दें' पर क्लिक करें। यदि अवरुद्ध है, तो अपने ब्राउज़र साइट सेटिंग्स (आमतौर पर यूआरएल लॉक आइकन में) की जांच करें और कैमरा अनुमतियों को सक्षम करें।"
}, {
  id: "faq-2",
  icon: WifiOff,
  qEn: "How does the Offline Sync feature work?",
  qHi: "ऑफ़लाइन सिंक सुविधा कैसे काम करती है?",
  aEn: "The application is fully offline-capable. If you submit a field activity without a cellular network, it automatically saves as a 'Draft' in local storage. Once network connection is restored, a 'Sync Now' bar allows you to upload pending submissions to Supabase.",
  aHi: "एप्लिकेशन पूरी तरह से ऑफ़लाइन काम कर सकता है। यदि आप मोबाइल नेटवर्क के बिना गतिविधि जमा करते हैं, तो यह स्थानीय डिवाइस में 'ड्राफ्ट' के रूप में सहेज लिया जाता है। इंटरनेट कनेक्शन उपलब्ध होने पर 'सिंक करें' बटन की मदद से आप इसे सर्वर पर भेज सकते हैं।"
}, {
  id: "faq-3",
  icon: MapPin,
  qEn: "Why is GPS coordinate validation required?",
  qHi: "जीपीएस स्थान सत्यापन क्यों आवश्यक है?",
  aEn: "To align with official NRLM evidence-based monitoring guidelines, all field submissions require real-time geographic validation. Your device's latitude/longitude are captured automatically on submit to verify on-field presence.",
  aHi: "आधिकारिक एनआरएलएम दिशानिर्देशों के तहत, सभी फील्ड गतिविधियों के लिए भौगोलिक सत्यापन आवश्यक है। आपके द्वारा दर्ज किए गए स्थान की पुष्टि करने के लिए सबमिट करते समय आपका अक्षांश / देशांतर स्वतः कैप्चर कर लिया जाता है।"
}, {
  id: "faq-4",
  icon: FileImage,
  qEn: "What are the photo upload size limits?",
  qHi: "फोटो अपलोड साइज सीमाएं क्या हैं?",
  aEn: "You can upload up to 10 photos per activity. Client-side image compression automatically downscales large JPEGs to ~1MB to minimize network bandwidth consumption in remote locations.",
  aHi: "आप प्रत्येक गतिविधि के लिए अधिकतम 10 फोटो अपलोड कर सकते हैं। ग्रामीण क्षेत्रों में कम नेटवर्क बैंडविड्थ की समस्या को सुलझाने के लिए एप्लिकेशन स्वयं फोटो को संपीड़ित (कंप्रेस) करके ~1MB तक छोटा कर देता है।"
}];
function HelpPage() {
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const toggleFaq = (id) => {
    setExpandedId((prev) => prev === id ? null : id);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-black text-slate-800 tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleQuestionMark, { className: "h-6 w-6 text-blue-600" }),
        "सहायता और अक्सर पूछे जाने वाले प्रश्न / Help & Support FAQs"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Frequently asked questions and user guides for NRLM cadres" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3.5", children: FAQS.map((faq) => {
      const Icon = faq.icon;
      const isExpanded = expandedId === faq.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleFaq(faq.id), "aria-expanded": isExpanded, className: "w-full flex items-center justify-between gap-4 p-5 text-left focus:outline-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-extrabold text-slate-800", children: faq.qHi }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-semibold text-slate-400 mt-0.5", children: faq.qEn })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("h-5 w-5 text-slate-400 shrink-0 transition-transform duration-300", isExpanded && "transform rotate-180 text-blue-600") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("border-t border-slate-50 bg-slate-50/20 px-5 transition-all duration-300 ease-in-out overflow-hidden max-h-0 opacity-0", isExpanded && "max-h-[300px] py-4.5 opacity-100"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-xs leading-relaxed text-slate-600 font-medium", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-800 mb-0.5", children: "उत्तर:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: faq.aHi })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100/50 pt-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-500 mb-0.5", children: "Answer:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: faq.aEn })
          ] })
        ] }) })
      ] }, faq.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-emerald-100 bg-emerald-50/25 p-5 flex flex-col md:flex-row gap-4.5 items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1 text-xs text-emerald-800 font-medium leading-normal", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-black text-emerald-950 uppercase tracking-wide", children: "सरकारी दिशानिर्देशों का अनुपालन / Government Guidelines Compliance" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "This portal follows Indian Government Web Standards (GIGW / UX4G). Accessibility features (high-contrast text ratio, alt tags, keyboard tab index navigation, bilingual labels) are built-in for rural accessibility." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 shrink-0 shadow-sm border border-emerald-400/20", children: "WCAG 2.1 Compliant" })
    ] })
  ] });
}
export {
  HelpPage as component
};
