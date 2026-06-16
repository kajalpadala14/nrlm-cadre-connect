import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, ChevronDown, Camera, WifiOff, MapPin, FileImage, ArrowLeft, Send, Phone, User, Download, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/use-auth";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ContactInfo {
  full_name: string;
  phone: string | null;
}

export const Route = createFileRoute("/_authenticated/cadre/help")({
  component: CadreHelpPage,
});

interface FaqItem {
  id: string;
  icon: any;
  qEn: string;
  qHi: string;
  aEn: string;
  aHi: string;
}

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    icon: Camera,
    qEn: "How do I enable camera permissions?",
    qHi: "कैमरा अनुमतियां कैसे सक्षम करें?",
    aEn: "When submitting an activity, the browser will request permission to access your camera. Click 'Allow'. If blocked, check your browser site settings (usually in the URL lock icon) and set camera permissions to Allowed.",
    aHi: "गतिविधि जमा करते समय, ब्राउज़र आपके कैमरे तक पहुंच की अनुमति का अनुरोध करेगा। 'अनुमति दें' पर क्लिक करें। यदि अवरुद्ध है, तो अपने ब्राउज़र साइट सेटिंग्स (आमतौर पर यूआरएल लॉक आइकन में) की जांच करें और कैमरा अनुमतियों को सक्षम करें।",
  },
  {
    id: "faq-2",
    icon: WifiOff,
    qEn: "How does the Offline Sync feature work?",
    qHi: "ऑफ़लाइन सिंक सुविधा कैसे काम करती है?",
    aEn: "The application is fully offline-capable. If you submit a field activity without a cellular network, it automatically saves as a 'Draft' in local storage. Once network connection is restored, a 'Sync Now' bar allows you to upload pending submissions to Supabase.",
    aHi: "एप्लिकेशन पूरी तरह से ऑफ़लाइन काम कर सकता है। यदि आप मोबाइल नेटवर्क के बिना गतिविधि जमा करते हैं, तो यह स्थानीय डिवाइस में 'ड्राफ्ट' के रूप में सहेज लिया जाता है। इंटरनेट कनेक्शन उपलब्ध होने पर 'सिंक करें' बटन की मदद से आप इसे सर्वर पर भेज सकते हैं।",
  },
  {
    id: "faq-3",
    icon: MapPin,
    qEn: "Why is GPS coordinate validation required?",
    qHi: "जीपीएस स्थान सत्यापन क्यों आवश्यक है?",
    aEn: "To align with official NRLM guidelines, all field submissions require geographic validation. Your device's coordinates are captured automatically on submit to verify presence.",
    aHi: "आधिकारिक एनआरएलएम दिशानिर्देशों के तहत, सभी फील्ड गतिविधियों के लिए भौगोलिक सत्यापन आवश्यक है। आपके द्वारा दर्ज किए गए स्थान की पुष्टि करने के लिए सबमिट करते समय आपका अक्षांश / देशांतर स्वतः कैप्चर कर लिया जाता है।",
  },
  {
    id: "faq-4",
    icon: FileImage,
    qEn: "What are the photo upload size limits?",
    qHi: "फोटो अपलोड साइज सीमाएं क्या हैं?",
    aEn: "You can upload up to 10 photos per activity. Client-side image compression automatically downscales large JPEGs to ~1MB to minimize network bandwidth consumption in remote locations.",
    aHi: "आप प्रत्येक गतिविधि के लिए अधिकतम 10 फोटो अपलोड कर सकते हैं। ग्रामीण क्षेत्रों में कम नेटवर्क बैंडविड्थ की समस्या को सुलझाने के लिए एप्लिकेशन स्वयं फोटो को संपीड़ित (कंप्रेस) करके ~1MB तक छोटा कर देता है।",
  },
];

function CadreHelpPage() {
  const { data: profile } = useProfile();
  const { t, lang } = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch Block Coordinator: single query — profiles joined with user_roles,
  // filtered to block_officer role and the cadre's own block_id.
  // Uses Supabase's PostgREST inner join: profiles!inner(user_roles!inner(...))
  // Falls back to null (shows "not available") if cadre has no block_id assigned.
  const { data: blockCoordinator, isLoading: loadingBC } = useQuery<ContactInfo | null>({
    queryKey: ["block-coordinator", profile?.block_id],
    enabled: !!profile,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!profile?.block_id) return null;
      // Join profiles → user_roles in one round-trip, scoped to the cadre's block
      const { data, error } = await supabase
        .from("user_roles")
        .select("profiles!inner(full_name, phone)")
        .eq("role", "block_officer")
        .eq("profiles.block_id", profile.block_id)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const p = (data as any).profiles;
      return p ? { full_name: p.full_name, phone: p.phone ?? null } : null;
    },
  });

  // Fetch District Admin: single query — user_roles joined with profiles,
  // filtered to admin role. District-level: no block scoping needed.
  const { data: districtAdmin, isLoading: loadingDA } = useQuery<ContactInfo | null>({
    queryKey: ["district-admin"],
    enabled: !!profile,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("profiles!inner(full_name, phone)")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const p = (data as any).profiles;
      return p ? { full_name: p.full_name, phone: p.phone ?? null } : null;
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("raise") === "true") {
        setTimeout(() => {
          const el = document.getElementById("raise-ticket-form");
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            const input = document.getElementById("ticket-subject-input");
            if (input) input.focus();
          }
        }, 100);
      }
    }
  }, []);

  // Ticket raising states
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Raised Tickets
  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ["my-tickets", profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("cadre_id", profile!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleFaq = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!subject.trim() || !description.trim()) {
      toast.error(t("fill_required_fields"));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("tickets").insert({
        cadre_id: profile.id,
        subject: subject.trim(),
        description: description.trim(),
        status: "open",
      });
      if (error) throw error;

      toast.success(t("ticket_raised"));
      setSubject("");
      setDescription("");
      refetchTickets();
    } catch (err: any) {
      toast.error(`Error raising ticket: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Back button */}
      <Link
        to="/cadre"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          {t("help_title")}
        </h2>
        <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
          Frequently asked questions, coordinators contacts, and support tickets
        </p>
      </div>

      {/* Grid: FAQs & Raise Ticket */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Left Col: FAQs Accordion */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
            {t("faq_heading")}
          </h3>
          <div className="space-y-3">
            {FAQS.map((faq) => {
              const Icon = faq.icon;
              const isExpanded = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{faq.qHi}</h4>
                        <h5 className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-none uppercase">{faq.qEn}</h5>
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300",
                        isExpanded && "transform rotate-180 text-blue-600",
                      )}
                    />
                  </button>

                  <div
                    className={cn(
                      "border-t border-slate-50 bg-slate-50/20 px-4 transition-all duration-300 ease-in-out overflow-hidden max-h-0 opacity-0",
                      isExpanded && "max-h-[300px] py-4 opacity-100",
                    )}
                  >
                    <div className="space-y-2.5 text-[11px] leading-relaxed text-slate-600 font-medium">
                      <div>
                        <p className="font-bold text-slate-800 mb-0.5">{t("answer_label")}</p>
                        <p>{faq.aHi}</p>
                      </div>
                      <div className="border-t border-slate-100/50 pt-2">
                        <p className="font-bold text-slate-500 mb-0.5">{t("answer_label")}</p>
                        <p>{faq.aEn}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Training Resources block */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
              {t("training_manuals")}
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl opacity-60 cursor-not-allowed">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Download className="h-4 w-4 text-slate-400" />
                  NRLM Cadre Operating Guide.pdf
                </span>
                <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-black uppercase">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl opacity-60 cursor-not-allowed">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Download className="h-4 w-4 text-slate-400" />
                  GPS Validation FAQ Manual.pdf
                </span>
                <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 font-black uppercase">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Raise Ticket Form & Raised Tickets list */}
        <div className="space-y-6">
          {/* Form */}
          <div id="raise-ticket-form" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4 text-xs font-bold text-slate-700">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
              {t("raise_ticket")}
            </h3>
            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] text-slate-400 uppercase">{t("subject_label")}</Label>
                <Input
                  id="ticket-subject-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. GPS coordinates not updating"
                  className="h-10 text-xs rounded-lg border-slate-200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] text-slate-400 uppercase">{t("desc_label_help")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="h-20 text-xs rounded-lg border-slate-200"
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 font-bold"
              >
                <Send className="h-4 w-4" />
                {submitting ? t("submitting_ticket") : t("submit_ticket")}
              </Button>
            </form>
          </div>

          {/* Raised Tickets History */}
          {tickets.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
                {t("my_tickets")} ({tickets.length})
              </h3>
              <div className="space-y-3.5 max-h-56 overflow-y-auto">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2 text-xs font-bold"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-extrabold">{ticket.subject}</span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                          ticket.status === "open" && "bg-blue-100 text-blue-800",
                          ticket.status === "resolved" && "bg-emerald-100 text-emerald-800",
                          ticket.status === "closed" && "bg-slate-100 text-slate-600",
                        )}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium italic">"{ticket.description}"</p>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium uppercase mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      Created: {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block/District Contacts Directory */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-50 pb-2">
          {t("coordinators_dir")}
        </h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 text-xs font-bold text-slate-700">
          {/* Block Coordinator */}
          <div className="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
            <User className="h-8 w-8 text-slate-400 bg-white p-1.5 rounded-lg border border-slate-100 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800">
                {lang === "hi" ? "ब्लॉक समन्वयक" : "Block Coordinator"}
              </h4>
              {loadingBC ? (
                <p className="text-slate-400 text-[11px]">Loading...</p>
              ) : blockCoordinator ? (
                <>
                  <p className="text-slate-700 font-extrabold">{blockCoordinator.full_name}</p>
                  {blockCoordinator.phone ? (
                    <p className="text-slate-500 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${blockCoordinator.phone}`} className="hover:text-blue-600 transition-colors">
                        {blockCoordinator.phone}
                      </a>
                    </p>
                  ) : (
                    <p className="text-slate-400 flex items-center gap-1 italic text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5" /> No phone on record
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-400 flex items-center gap-1 italic text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5" /> Contact information not available
                </p>
              )}
            </div>
          </div>
          {/* District Admin */}
          <div className="flex items-start gap-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl">
            <User className="h-8 w-8 text-slate-400 bg-white p-1.5 rounded-lg border border-slate-100 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800">
                {lang === "hi" ? "जिला प्रशासक" : "District Admin"}
              </h4>
              {loadingDA ? (
                <p className="text-slate-400 text-[11px]">Loading...</p>
              ) : districtAdmin ? (
                <>
                  <p className="text-slate-700 font-extrabold">{districtAdmin.full_name}</p>
                  {districtAdmin.phone ? (
                    <p className="text-slate-500 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <a href={`tel:${districtAdmin.phone}`} className="hover:text-blue-600 transition-colors">
                        {districtAdmin.phone}
                      </a>
                    </p>
                  ) : (
                    <p className="text-slate-400 flex items-center gap-1 italic text-[11px]">
                      <AlertCircle className="h-3.5 w-3.5" /> No phone on record
                    </p>
                  )}
                </>
              ) : (
                <p className="text-slate-400 flex items-center gap-1 italic text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5" /> Contact information not available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
