"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BiCloudUpload, BiCheckCircle, BiErrorCircle, BiRefresh, BiLinkAlt, BiHistory } from "react-icons/bi";
import toast from "react-hot-toast";
import { useTranslation } from "../context/TranslationContext";
import { applyOpenImmoImportApi, getOpenImmoConnectionApi, getOpenImmoImportsApi, rotateOpenImmoCredentialsApi, saveOpenImmoConnectionApi, uploadOpenImmoApi } from "@/api/apiRoutes";

const AgentOpenImmoImport = () => {
  const t = useTranslation();
  const tr = (key, fallback) => { const value = t(key); return !value || value === key ? fallback : value; };
  const [connection, setConnection] = useState(null);
  const [imports, setImports] = useState([]);
  const [file, setFile] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [catalog, setCatalog] = useState({ categories: [], parameters: [], sourceCategories: {}, parameterSources: {} });
  const [configuration, setConfiguration] = useState({ category_mapping: {}, parameter_mapping: {}, auto_publish: false, auto_approve: false, feed_mode: "dry_run" });
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const load = useCallback(async () => {
    try {
      const [connectionResult, importsResult] = await Promise.all([getOpenImmoConnectionApi(), getOpenImmoImportsApi()]);
      const data = connectionResult?.data || {};
      const current = data.connection || null;
      setConnection(current);
      setCatalog({ categories: data.categories || [], parameters: data.parameters || [], sourceCategories: data.source_categories || {}, parameterSources: data.parameter_sources || {} });
      setConfiguration({ category_mapping: current?.category_mapping || {}, parameter_mapping: current?.settings?.parameter_mapping || {}, auto_publish: Boolean(current?.settings?.auto_publish), auto_approve: Boolean(current?.settings?.auto_approve), feed_mode: current?.settings?.feed_mode || "dry_run" });
      setImports(importsResult?.data?.data || []);
    } catch (error) { toast.error(error?.message || tr("somethingWentWrong", "Daten konnten nicht geladen werden.")); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const running = imports.some((entry) => ["received", "processing"].includes(entry.status));
    if (!running) return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [imports, load]);

  const activePreview = useMemo(() => imports.find((entry) => entry.mode === "dry_run" && ["completed", "completed_with_errors"].includes(entry.status)), [imports]);

  const upload = async () => {
    if (!file) return toast.error(tr("selectFile", "Bitte wählen Sie eine ZIP-Datei aus."));
    setBusy(true);
    try { await uploadOpenImmoApi(file, "dry_run"); setFile(null); toast.success(tr("importQueued", "Prüfung wurde gestartet.")); await load(); }
    catch (error) { toast.error(error?.message || tr("importFailed", "Upload fehlgeschlagen.")); }
    finally { setBusy(false); }
  };

  const publish = async (id) => {
    setBusy(true);
    try { await applyOpenImmoImportApi(id); toast.success(tr("importQueued", "Import wurde gestartet.")); await load(); }
    catch (error) { toast.error(error?.message || tr("importFailed", "Import konnte nicht gestartet werden.")); }
    finally { setBusy(false); }
  };

  const rotate = async () => {
    setBusy(true);
    try { const result = await rotateOpenImmoCredentialsApi(); setCredentials(result?.data); setConnection((current) => ({ ...current, username: result?.data?.username, transport: "sftp" })); }
    catch (error) { toast.error(error?.message || tr("somethingWentWrong", "Zugangsdaten konnten nicht erstellt werden.")); }
    finally { setBusy(false); }
  };

  const saveConfiguration = async () => {
    setBusy(true);
    try {
      const clean = (values) => Object.fromEntries(Object.entries(values).filter(([, value]) => value));
      const result = await saveOpenImmoConnectionApi({
        category_mapping: clean(configuration.category_mapping),
        settings: { auto_publish: configuration.auto_publish, auto_approve: configuration.auto_approve, feed_mode: configuration.feed_mode, parameter_mapping: clean(configuration.parameter_mapping) },
      });
      setConnection(result?.data || connection);
      toast.success(tr("settingsSaved", "Zuordnungen wurden gespeichert."));
    } catch (error) { toast.error(error?.message || tr("somethingWentWrong", "Einstellungen konnten nicht gespeichert werden.")); }
    finally { setBusy(false); }
  };

  const setMapping = (group, key, value) => setConfiguration((current) => ({ ...current, [group]: { ...current[group], [key]: value ? Number(value) : "" } }));

  const statusStyle = (status) => status === "completed" ? "bg-emerald-50 text-emerald-700" : status === "completed_with_errors" || status === "failed" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full primaryBg opacity-10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><span className="inline-flex items-center gap-2 rounded-full primaryBgLight12 px-3 py-1 text-sm font-semibold primaryColor"><BiLinkAlt /> OpenImmo 1.2.7d</span><h1 className="mt-4 text-2xl md:text-3xl font-bold brandColor">{tr("openImmoImport", "Import & Schnittstellen")}</h1><p className="mt-2 max-w-2xl secondryTextColor">{tr("openImmoDescription", "Übertragen Sie Immobilien aus onOffice, FLOWFACT, Propstack und anderen Maklersystemen sicher zu Ximmo24.")}</p></div>
          <div className="rounded-2xl border bg-slate-50 px-5 py-4 min-w-56"><p className="text-xs uppercase tracking-wide secondryTextColor">{tr("connectionStatus", "Verbindungsstatus")}</p><p className="mt-1 flex items-center gap-2 font-semibold text-emerald-700"><BiCheckCircle size={20} /> {connection?.status === "paused" ? tr("paused", "Pausiert") : tr("ready", "Bereit")}</p></div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl primaryBgLight12 primaryColor"><BiCloudUpload size={24}/></div><div><h2 className="text-xl font-bold brandColor">{tr("uploadOpenImmo", "OpenImmo-Datei prüfen")}</h2><p className="text-sm secondryTextColor">ZIP mit XML, Bildern und Dokumenten</p></div></div>
          <label onDragOver={(e)=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(e)=>{e.preventDefault();setDragging(false);setFile(e.dataTransfer.files?.[0] || null)}} className={`mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition ${dragging ? "primaryBgLight12 border-blue-400" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}>
            <input type="file" accept=".zip,application/zip" className="hidden" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
            <BiCloudUpload size={42} className="primaryColor"/><p className="mt-4 font-semibold brandColor">{file?.name || tr("dropOpenImmoZip", "ZIP-Datei hier ablegen oder auswählen")}</p><p className="mt-1 text-sm secondryTextColor">{tr("dryRunHint", "Zuerst erfolgt immer eine sichere Vorschau ohne Veröffentlichung.")}</p>
          </label>
          <button disabled={busy || !file} onClick={upload} className="mt-5 w-full rounded-2xl primaryBg px-5 py-3.5 font-semibold text-white disabled:opacity-50">{busy ? tr("processing", "Wird verarbeitet…") : tr("checkImport", "Import prüfen")}</button>
          {activePreview && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-bold brandColor">{tr("previewReady", "Vorschau bereit")}</p><p className="text-sm secondryTextColor">{activePreview.source_filename}</p></div><button disabled={busy || activePreview.failed_count > 0} onClick={()=>publish(activePreview.public_id)} className="rounded-xl primaryBg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{tr("startImport", "Jetzt importieren")}</button></div><div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">{[["Gesamt",activePreview.total_count],["Neu",activePreview.created_count],["Updates",activePreview.updated_count],["Unverändert",activePreview.unchanged_count],["Deaktiviert",activePreview.deactivated_count],["Fehler",activePreview.failed_count]].map(([label,value])=><div key={label} className="rounded-xl bg-white p-3 text-center"><strong className="block text-lg brandColor">{value}</strong><span className="text-xs secondryTextColor">{label}</span></div>)}</div></div>}
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl primaryBgLight12 primaryColor"><BiRefresh size={24}/></div><div><h2 className="text-xl font-bold brandColor">{tr("automaticTransfer", "Automatische Übertragung")}</h2><p className="text-sm secondryTextColor">CRM → Ximmo24</p></div></div><div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"><p><span className="secondryTextColor">Format:</span> <strong>OpenImmo XML/ZIP</strong></p><p><span className="secondryTextColor">Benutzer:</span> <strong>{connection?.username || "Noch nicht erstellt"}</strong></p><p className="break-all"><span className="secondryTextColor">Endpoint:</span> <strong>{credentials?.endpoint || connection?.feed_endpoint || "–"}</strong></p></div><button disabled={busy} onClick={rotate} className="mt-4 w-full rounded-2xl border px-4 py-3 font-semibold brandColor hover:bg-slate-50">{connection?.username ? tr("rotateCredentials", "Zugangsdaten erneuern") : tr("createCredentials", "Zugangsdaten erstellen")}</button>{credentials && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-semibold text-amber-900">{tr("savePasswordNow", "Passwort jetzt sicher speichern")}</p><p className="mt-2 break-all">{credentials.username}</p><p className="mt-1 break-all font-mono">{credentials.password}</p><p className="mt-2 text-xs text-amber-800">Es wird aus Sicherheitsgründen nicht erneut angezeigt.</p></div>}</section>
      </div>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div><h2 className="text-xl font-bold brandColor">{tr("fieldMapping", "Feldzuordnung")}</h2><p className="mt-1 text-sm secondryTextColor">OpenImmo-Daten werden eindeutig Ihren Ximmo24-Kategorien und Merkmalen zugeordnet.</p></div>
        <div className="mt-6 grid gap-7 lg:grid-cols-2">
          <div><h3 className="font-semibold brandColor">Kategorien</h3><div className="mt-3 space-y-3">{Object.entries(catalog.sourceCategories).map(([key,label])=><label key={key} className="grid gap-1 text-sm sm:grid-cols-2 sm:items-center"><span>{label}</span><select value={configuration.category_mapping[key] || ""} onChange={(event)=>setMapping("category_mapping",key,event.target.value)} className="rounded-xl border bg-white px-3 py-2.5"><option value="">Nicht zugeordnet</option>{catalog.categories.map((category)=><option key={category.id} value={category.id}>{category.category}</option>)}</select></label>)}</div></div>
          <div><h3 className="font-semibold brandColor">Merkmale</h3><div className="mt-3 space-y-3">{Object.entries(catalog.parameterSources).map(([key,label])=><label key={key} className="grid gap-1 text-sm sm:grid-cols-2 sm:items-center"><span>{label}</span><select value={configuration.parameter_mapping[key] || ""} onChange={(event)=>setMapping("parameter_mapping",key,event.target.value)} className="rounded-xl border bg-white px-3 py-2.5"><option value="">Nicht zugeordnet</option>{catalog.parameters.map((parameter)=><option key={parameter.id} value={parameter.id}>{parameter.name}</option>)}</select></label>)}</div><div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4"><label className="flex items-center justify-between gap-3 text-sm"><span>CRM-Übertragungen automatisch anwenden</span><input type="checkbox" checked={configuration.feed_mode === "apply"} onChange={(event)=>setConfiguration((current)=>({...current,feed_mode:event.target.checked ? "apply" : "dry_run"}))}/></label><label className="flex items-center justify-between gap-3 text-sm"><span>Neue Objekte automatisch freigeben</span><input type="checkbox" checked={configuration.auto_approve} onChange={(event)=>setConfiguration((current)=>({...current,auto_approve:event.target.checked}))}/></label><label className="flex items-center justify-between gap-3 text-sm"><span>Freigegebene Objekte sofort veröffentlichen</span><input type="checkbox" checked={configuration.auto_publish} onChange={(event)=>setConfiguration((current)=>({...current,auto_publish:event.target.checked,auto_approve:event.target.checked ? true : current.auto_approve}))}/></label></div></div>
        </div>
        <button disabled={busy} onClick={saveConfiguration} className="mt-6 rounded-2xl primaryBg px-6 py-3 font-semibold text-white disabled:opacity-50">{tr("save", "Speichern")}</button>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><BiHistory className="primaryColor" size={24}/><h2 className="text-xl font-bold brandColor">{tr("importHistory", "Importverlauf")}</h2></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left secondryTextColor"><th className="p-3">Datei</th><th className="p-3">Modus</th><th className="p-3">Status</th><th className="p-3 text-center">Gesamt</th><th className="p-3 text-center">Neu</th><th className="p-3 text-center">Updates</th><th className="p-3 text-center">Fehler</th></tr></thead><tbody>{imports.map((entry)=><tr key={entry.public_id} className="border-b last:border-0"><td className="p-3 font-medium brandColor">{entry.source_filename}</td><td className="p-3">{entry.mode === "dry_run" ? "Vorschau" : "Import"}</td><td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(entry.status)}`}>{entry.status === "failed" ? <BiErrorCircle/> : <BiCheckCircle/>}{entry.status}</span></td><td className="p-3 text-center">{entry.total_count}</td><td className="p-3 text-center">{entry.created_count}</td><td className="p-3 text-center">{entry.updated_count}</td><td className="p-3 text-center">{entry.failed_count}</td></tr>)}{imports.length===0&&<tr><td colSpan="7" className="p-8 text-center secondryTextColor">{tr("noImports", "Noch keine Importe vorhanden.")}</td></tr>}</tbody></table></div></section>
    </div>
  );
};

export default AgentOpenImmoImport;
