import { useState } from "react";
import { ListChecks, Search } from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { SearchPanel } from "@/components/SearchPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { useFlightSearch } from "@/hooks/useFlightSearch";
import { FadeIn } from "@/components/fx/FadeIn";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useI18n } from "@/contexts/I18nContext";

type WorkspaceTab = "search" | "results";

export default function Home() {
  const { t } = useI18n();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("search");
  const {
    form,
    updateForm,
    swapRoute,
    resetForm,
    apiProvider,
    setApiProvider,
    apiKey,
    setApiKey,
    activeTab,
    setActiveTab,
    flights,
    allFlights,
    loading,
    statusMessage,
    apiCallCount,
    search,
  } = useFlightSearch();

  const showWorkspaceTab = (tab: WorkspaceTab) => {
    setWorkspaceTab(tab);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  };

  const runSearch = () => {
    showWorkspaceTab("results");
    void search();
  };

  return (
    <div className="min-h-[100svh] bg-background pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="container max-w-[1180px]">
        <FadeIn y={8}>
          <Topbar
            apiProvider={apiProvider}
            setApiProvider={setApiProvider}
            apiKey={apiKey}
            setApiKey={setApiKey}
            statusMessage={statusMessage}
            apiCallCount={apiCallCount}
          />
        </FadeIn>
        <main className="pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
          <Tabs
            value={workspaceTab}
            onValueChange={(value) => showWorkspaceTab(value as WorkspaceTab)}
            className="gap-4"
          >
            <TabsList className="sticky top-0 mb-1 h-12 w-full rounded-lg border border-border bg-card/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <TabsTrigger value="search" className="h-full gap-2 font-bold">
                <Search />
                {t("searchTab")}
              </TabsTrigger>
              <TabsTrigger value="results" className="h-full gap-2 font-bold">
                <ListChecks />
                {t("resultsTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-0 outline-none">
              <FadeIn className="mx-auto max-w-[620px]" delay={0.06}>
                <SearchPanel
                  form={form}
                  updateForm={updateForm}
                  swapRoute={swapRoute}
                  resetForm={resetForm}
                  onSearch={runSearch}
                />
              </FadeIn>
            </TabsContent>

            <TabsContent value="results" className="mt-0 outline-none">
              <FadeIn delay={0.06}>
                <ResultsPanel
                  form={form}
                  updateForm={updateForm}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  flights={flights}
                  allFlights={[...allFlights.outbound, ...allFlights.return]}
                  loading={loading}
                  statusMessage={statusMessage}
                  onEditSearch={() => showWorkspaceTab("search")}
                />
              </FadeIn>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
