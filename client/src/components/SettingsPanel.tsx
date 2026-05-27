import { Activity, AlertTriangle, Moon, Settings, ShieldCheck } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import type { ApiProvider } from "@/types/flight";

interface SettingsPanelProps {
  apiProvider: ApiProvider;
  setApiProvider: (v: ApiProvider) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  statusMessage: string;
  apiCallCount: number;
}

function getApiLimit(provider: ApiProvider): number {
  if (provider === "rapidapi") return 150;
  if (provider === "serpapi") return 100;
  return 0;
}

export function SettingsPanel({ apiProvider, setApiProvider, apiKey, setApiKey, statusMessage, apiCallCount }: SettingsPanelProps) {
  const { t } = useI18n();
  const { theme, toggleTheme, switchable } = useTheme();

  const usesRapidProxy =
    apiProvider === "rapidapi" &&
    import.meta.env.VITE_USE_RAPIDAPI_PROXY === "true";
  const hasError = statusMessage.toLowerCase().includes("error") || statusMessage.toLowerCase().includes("cors");
  const isConnected = statusMessage.toLowerCase().includes("flights") && !hasError;
  const limit = getApiLimit(apiProvider);
  const isDark = theme === "dark";

  const setDarkMode = (checked: boolean) => {
    if (checked !== isDark) {
      toggleTheme?.();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="size-11 rounded-lg bg-card font-bold transition-all duration-160 hover:-translate-y-0.5 hover:border-primary active:scale-[0.97]"
          aria-label={t("settings")}
        >
          <Settings />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(92vw,25rem)] overflow-y-auto p-0">
        <SheetHeader className="border-b border-border p-5 pr-12">
          <SheetTitle className="inline-flex items-center gap-2 text-lg">
            <Settings className="size-5 text-primary" />
            {t("settings")}
          </SheetTitle>
          <SheetDescription>{t("settingsDescription")}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-5">
          <section className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("appearance")}
            </p>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-foreground">
                <Moon className="size-4 text-primary" />
                {t("darkMode")}
              </span>
              <Switch
                checked={isDark}
                disabled={!switchable}
                onCheckedChange={setDarkMode}
                aria-label={t("darkMode")}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="apiProvider" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t("apiProvider")}
              </label>
              <select
                id="apiProvider"
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value as ApiProvider)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="demo">{t("demoMode")}</option>
                <option value="rapidapi">RapidAPI DataCrawler</option>
                <option value="serpapi">SerpApi Google Flights</option>
              </select>
            </div>

            {apiProvider !== "demo" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="apiKey" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {usesRapidProxy ? t("apiCredential") : t("apiKey")}
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={usesRapidProxy ? t("apiCredentialPlaceholder") : t("apiKeyPlaceholder")}
                  autoComplete="off"
                  className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}

            {/* API Usage Counter */}
            {apiProvider !== "demo" && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                <Activity className="size-4 flex-shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {t("apiUsage")}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {apiCallCount}/{limit}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        apiCallCount / limit > 0.8
                          ? "bg-destructive"
                          : apiCallCount / limit > 0.5
                          ? "bg-amber-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${Math.min((apiCallCount / limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {limit - apiCallCount} {t("requestsRemaining")}
                  </p>
                </div>
              </div>
            )}

            {/* Status feedback */}
            {apiProvider !== "demo" && statusMessage && (
              <div
                className={`flex gap-2.5 rounded-lg border p-3 text-sm ${
                  hasError
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : isConnected
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {hasError ? (
                  <AlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="mt-0.5 size-4 flex-shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Info box */}
            <div className="flex gap-2.5 rounded-lg border border-border bg-primary/5 p-3 text-sm">
              <ShieldCheck className="mt-0.5 size-4 flex-shrink-0 text-primary" />
              <div className="flex flex-col gap-1 text-muted-foreground">
                <p>{t("keysInfo")}</p>
                {apiProvider === "rapidapi" && (
                  <p>{usesRapidProxy ? t("rapidProxyInfo") : t("rapidApiInfo")}</p>
                )}
                {apiProvider === "serpapi" && <p>{t("serpApiInfo")}</p>}
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
