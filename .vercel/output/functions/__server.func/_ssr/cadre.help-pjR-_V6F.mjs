import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { a as useProfile } from "./use-auth-DM5yQtMG.mjs";
import { u as useT } from "./router-yzFmt3hU.mjs";
import { s as supabase } from "./client-UF72EdR8.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input } from "./input-C0QjszdI.mjs";
import { L as Label } from "./label-JU3yqRBo.mjs";
import { T as Textarea } from "./textarea-DSyJ1nlY.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { ag as ArrowLeft, e as CircleQuestionMark, K as Camera, a2 as WifiOff, M as MapPin, a3 as FileImage, g as ChevronDown, a1 as Download, am as Send, w as Clock, U as User, an as Phone, ah as CircleAlert } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
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
  aEn: "To align with official NRLM guidelines, all field submissions require geographic validation. Your device's coordinates are captured automatically on submit to verify presence.",
  aHi: "आधिकारिक एनआरएलएम दिशानिर्देशों के तहत, सभी फील्ड गतिविधियों के लिए भौगोलिक सत्यापन आवश्यक है। आपके द्वारा दर्ज किए गए स्थान की पुष्टि करने के लिए सबमिट करते समय आपका अक्षांश / देशांतर स्वतः कैप्चर कर लिया जाता है।"
}, {
  id: "faq-4",
  icon: FileImage,
  qEn: "What are the photo upload size limits?",
  qHi: "फोटो अपलोड साइज सीमाएं क्या हैं?",
  aEn: "You can upload up to 10 photos per activity. Client-side image compression automatically downscales large JPEGs to ~1MB to minimize network bandwidth consumption in remote locations.",
  aHi: "आप प्रत्येक गतिविधि के लिए अधिकतम 10 फोटो अपलोड कर सकते हैं। ग्रामीण क्षेत्रों में कम नेटवर्क बैंडविड्थ की समस्या को सुलझाने के लिए एप्लिकेशन स्वयं फोटो को संपीड़ित (कंप्रेस) करके ~1MB तक छोटा कर देता है।"
}];
function CadreHelpPage() {
  const {
    data: profile
  } = useProfile();
  const {
    t,
    lang
  } = useT();
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const {
    data: blockCoordinator,
    isLoading: loadingBC
  } = useQuery({
    queryKey: ["block-coordinator", profile?.block_id],
    enabled: !!profile,
    staleTime: 5 * 6e4,
    queryFn: async () => {
      if (!profile?.block_id) return null;
      const {
        data,
        error
      } = await supabase.from("user_roles").select("profiles!inner(full_name, phone)").eq("role", "block_officer").eq("profiles.block_id", profile.block_id).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const p = data.profiles;
      return p ? {
        full_name: p.full_name,
        phone: p.phone ?? null
      } : null;
    }
  });
  const {
    data: districtAdmin,
    isLoading: loadingDA
  } = useQuery({
    queryKey: ["district-admin"],
    enabled: !!profile,
    staleTime: 5 * 6e4,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("user_roles").select("profiles!inner(full_name, phone)").eq("role", "admin").limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const p = data.profiles;
      return p ? {
        full_name: p.full_name,
        phone: p.phone ?? null
      } : null;
    }
  });
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("raise") === "true") {
        setTimeout(() => {
          const el = document.getElementById("raise-ticket-form");
          if (el) {
            el.scrollIntoView({
              behavior: "smooth"
            });
            const input = document.getElementById("ticket-subject-input");
            if (input) input.focus();
          }
        }, 100);
      }
    }
  }, []);
  const [subject, setSubject] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const {
    data: tickets = [],
    refetch: refetchTickets
  } = useQuery({
    queryKey: ["my-tickets", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("tickets").select("*").eq("cadre_id", profile.id).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const toggleFaq = (id) => {
    setExpandedId((prev) => prev === id ? null : id);
  };
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!profile) return;
    if (!subject.trim() || !description.trim()) {
      toast.error(t("fill_required_fields"));
      return;
    }
    setSubmitting(true);
    try {
      const {
        error
      } = await supabase.from("tickets").insert({
        cadre_id: profile.id,
        subject: subject.trim(),
        description: description.trim(),
        status: "open"
      });
      if (error) throw error;
      toast.success(t("ticket_raised"));
      setSubject("");
      setDescription("");
      refetchTickets();
    } catch (err) {
      toast.error(`Error raising ticket: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-4xl mx-auto pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/cadre", className: "inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
      t("back")
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-black text-slate-800 tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleQuestionMark, { className: "h-6 w-6 text-blue-600" }),
        t("help_title")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 font-semibold uppercase mt-0.5", children: "Frequently asked questions, coordinators contacts, and support tickets" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 grid-cols-1 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2", children: t("faq_heading") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: FAQS.map((faq) => {
          const Icon = faq.icon;
          const isExpanded = expandedId === faq.id;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleFaq(faq.id), className: "w-full flex items-center justify-between gap-3 p-4 text-left focus:outline-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4.5 w-4.5" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-extrabold text-slate-800 leading-tight", children: faq.qHi }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h5", { className: "text-[10px] font-semibold text-slate-400 mt-0.5 leading-none uppercase", children: faq.qEn })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300", isExpanded && "transform rotate-180 text-blue-600") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("border-t border-slate-50 bg-slate-50/20 px-4 transition-all duration-300 ease-in-out overflow-hidden max-h-0 opacity-0", isExpanded && "max-h-[300px] py-4 opacity-100"), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2.5 text-[11px] leading-relaxed text-slate-600 font-medium", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-800 mb-0.5", children: t("answer_label") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: faq.aHi })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-100/50 pt-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-slate-500 mb-0.5", children: t("answer_label") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: faq.aEn })
              ] })
            ] }) })
          ] }, faq.id);
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2", children: t("training_manuals") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-xs font-bold text-slate-600", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl opacity-60 cursor-not-allowed", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-slate-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 text-slate-400" }),
                "NRLM Cadre Operating Guide.pdf"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-black uppercase", children: "Coming Soon" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl opacity-60 cursor-not-allowed", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-slate-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 text-slate-400" }),
                "GPS Validation FAQ Manual.pdf"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-black uppercase", children: "Coming Soon" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { id: "raise-ticket-form", className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 text-xs font-bold text-slate-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2", children: t("raise_ticket") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleRaiseTicket, className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 uppercase", children: t("subject_label") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "ticket-subject-input", value: subject, onChange: (e) => setSubject(e.target.value), placeholder: "e.g. GPS coordinates not updating", className: "h-10 text-xs rounded-lg border-slate-200" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] text-slate-400 uppercase", children: t("desc_label_help") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Describe your issue in detail...", className: "h-20 text-xs rounded-lg border-slate-200" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: submitting, className: "w-full h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
              submitting ? t("submitting_ticket") : t("submit_ticket")
            ] })
          ] })
        ] }),
        tickets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2", children: [
            t("my_tickets"),
            " (",
            tickets.length,
            ")"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3.5 max-h-56 overflow-y-auto", children: tickets.map((ticket) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2 text-xs font-bold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-800 font-extrabold", children: ticket.subject }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider", ticket.status === "open" && "bg-blue-100 text-blue-800", ticket.status === "resolved" && "bg-emerald-100 text-emerald-800", ticket.status === "closed" && "bg-slate-100 text-slate-600"), children: ticket.status })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-500 font-medium italic", children: [
              '"',
              ticket.description,
              '"'
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[9px] text-slate-400 font-medium uppercase mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }),
              "Created: ",
              new Date(ticket.created_at).toLocaleString()
            ] })
          ] }, ticket.id)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2", children: t("coordinators_dir") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 grid-cols-1 sm:grid-cols-2 text-xs font-bold text-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-8 w-8 text-slate-400 bg-white p-1.5 rounded-lg border border-slate-100 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-extrabold text-slate-800", children: lang === "hi" ? "ब्लॉक समन्वयक" : "Block Coordinator" }),
            loadingBC ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-[11px]", children: "Loading..." }) : blockCoordinator ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-700 font-extrabold", children: blockCoordinator.full_name }),
              blockCoordinator.phone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-500 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `tel:${blockCoordinator.phone}`, className: "hover:text-blue-600 transition-colors", children: blockCoordinator.phone })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 flex items-center gap-1 italic text-[11px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
                " No phone on record"
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 flex items-center gap-1 italic text-[11px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
              " Contact information not available"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-8 w-8 text-slate-400 bg-white p-1.5 rounded-lg border border-slate-100 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-extrabold text-slate-800", children: lang === "hi" ? "जिला प्रशासक" : "District Admin" }),
            loadingDA ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-[11px]", children: "Loading..." }) : districtAdmin ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-700 font-extrabold", children: districtAdmin.full_name }),
              districtAdmin.phone ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-500 flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `tel:${districtAdmin.phone}`, className: "hover:text-blue-600 transition-colors", children: districtAdmin.phone })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 flex items-center gap-1 italic text-[11px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
                " No phone on record"
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 flex items-center gap-1 italic text-[11px]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
              " Contact information not available"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  CadreHelpPage as component
};
