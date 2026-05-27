import { Globe, PlaneTakeoff } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/contexts/I18nContext";
import { SettingsPanel } from "@/components/SettingsPanel";
import type { ApiProvider } from "@/types/flight";

interface TopbarProps {
  apiProvider: ApiProvider;
  setApiProvider: (v: ApiProvider) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  statusMessage: string;
  apiCallCount: number;
}

export function Topbar({
  apiProvider,
  setApiProvider,
  apiKey,
  setApiKey,
  statusMessage,
  apiCallCount,
}: TopbarProps) {
  const { locale, setLocale, t } = useI18n();
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const toggleLocale = () => {
    setLocale(locale === "en" ? "zh-HK" : "en");
  };

  return (
    <header className="flex items-center justify-between gap-4 py-7">
      <div className="flex items-center gap-3">
        <div className="flightmark grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-primary shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
          <PlaneTakeoff className="h-5 w-5" />
        </div>
        <div>
          <motion.h1
            className="text-2xl font-bold leading-tight text-foreground"
            initial={reduceMotion ? false : { opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            {t("appTitle")}
          </motion.h1>
          <p className="hidden text-sm text-muted-foreground sm:block">
            {t("appSubtitle")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={toggleLocale}
          className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground transition-all duration-160 hover:-translate-y-0.5 hover:border-primary active:scale-[0.97]"
          aria-label={locale === "en" ? "切換至中文" : "Switch to English"}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{locale === "en" ? "中文" : "EN"}</span>
        </button>
        <SettingsPanel
          apiProvider={apiProvider}
          setApiProvider={setApiProvider}
          apiKey={apiKey}
          setApiKey={setApiKey}
          statusMessage={statusMessage}
          apiCallCount={apiCallCount}
        />
      </div>
    </header>
  );
}
