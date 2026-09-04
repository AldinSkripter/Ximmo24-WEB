"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BiCloudUpload, BiCheckCircle, BiErrorCircle, BiRefresh, BiLinkAlt, BiHistory } from "react-icons/bi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useTranslation } from "../context/TranslationContext";
import { applyOpenImmoImportApi, getOpenImmoConnectionApi, getOpenImmoImportsApi, rotateOpenImmoCredentialsApi, saveOpenImmoConnectionApi, uploadOpenImmoApi } from "@/api/apiRoutes";

const AgentOpenImmoImport = () => {
  const t = useTranslation();
  const activeLanguage = useSelector((state) => state.LanguageSettings?.active_language);
  const isLanguageLoaded = useSelector((state) => state.LanguageSettings?.isLanguageLoaded);
  const fallbackLanguage = activeLanguage?.toLowerCase().startsWith("de") ? "de" : "en";
  const fallbacks = {
    openImmoImport: { de: "Import & Schnittstellen", en: "Import & Integrations" },
    openImmoDescription: { de: "Übertragen Sie Immobilien aus onOffice, FLOWFACT, Propstack und anderen Maklersystemen sicher zu Ximmo24.", en: "Transfer properties securely from onOffice, FLOWFACT, Propstack and other real estate systems to Ximmo24." },
    connectionStatus: { de: "Verbindungsstatus", en: "Connection status" }, paused: { de: "Pausiert", en: "Paused" }, ready: { de: "Bereit", en: "Ready" },
    uploadOpenImmo: { de: "OpenImmo-Datei prüfen", en: "Check OpenImmo file" }, openImmoZipContents: { de: "ZIP mit XML, Bildern und Dokumenten", en: "ZIP with XML, images and documents" },
    dropOpenImmoZip: { de: "ZIP-Datei hier ablegen oder auswählen", en: "Drop or select a ZIP file here" }, dryRunHint: { de: "Zuerst erfolgt immer eine sichere Vorschau ohne Veröffentlichung.", en: "A safe preview is always created first without publishing." },
    processing: { de: "Wird verarbeitet…", en: "Processing…" }, checkImport: { de: "Import prüfen", en: "Check import" }, previewReady: { de: "Vorschau bereit", en: "Preview ready" }, startImport: { de: "Jetzt importieren", en: "Import now" },
    total: { de: "Gesamt", en: "Total" }, new: { de: "Neu", en: "New" }, updates: { de: "Aktualisiert", en: "Updated" }, unchanged: { de: "Unverändert", en: "Unchanged" }, deactivated: { de: "Deaktiviert", en: "Deactivated" }, errors: { de: "Fehler", en: "Errors" },
    automaticTransfer: { de: "Automatische Übertragung", en: "Automatic transfer" }, format: { de: "Format", en: "Format" }, user: { de: "Benutzer", en: "User" }, endpoint: { de: "Endpunkt", en: "Endpoint" }, notCreated: { de: "Noch nicht erstellt", en: "Not created yet" },
    rotateCredentials: { de: "Zugangsdaten erneuern", en: "Renew credentials" }, createCredentials: { de: "Zugangsdaten erstellen", en: "Create credentials" }, savePasswordNow: { de: "Passwort jetzt sicher speichern", en: "Save the password securely now" }, passwordShownOnce: { de: "Es wird aus Sicherheitsgründen nicht erneut angezeigt.", en: "For security reasons, it will not be shown again." },
    fieldMapping: { de: "Feldzuordnung", en: "Field mapping" }, fieldMappingDescription: { de: "OpenImmo-Daten werden eindeutig Ihren Ximmo24-Kategorien und Merkmalen zugeordnet.", en: "Map OpenImmo data clearly to your Ximmo24 categories and features." }, categories: { de: "Kategorien", en: "Categories" }, features: { de: "Merkmale", en: "Features" }, notMapped: { de: "Nicht zugeordnet", en: "Not mapped" },
    automaticApply: { de: "CRM-Übertragungen automatisch anwenden", en: "Apply CRM transfers automatically" }, autoApprove: { de: "Neue Objekte automatisch freigeben", en: "Approve new properties automatically" }, autoPublish: { de: "Freigegebene Objekte sofort veröffentlichen", en: "Publish approved properties immediately" },
    save: { de: "Speichern", en: "Save" }, settingsSaved: { de: "Zuordnungen wurden gespeichert.", en: "Mappings have been saved." }, importHistory: { de: "Importverlauf", en: "Import history" }, file: { de: "Datei", en: "File" }, mode: { de: "Modus", en: "Mode" }, status: { de: "Status", en: "Status" }, preview: { de: "Vorschau", en: "Preview" }, import: { de: "Import", en: "Import" }, noImports: { de: "Noch keine Importe vorhanden.", en: "No imports yet." },
    selectFile: { de: "Bitte wählen Sie eine ZIP-Datei aus.", en: "Please select a ZIP file." }, importQueued: { de: "Prüfung wurde gestartet.", en: "The check has started." }, uploadFailed: { de: "Upload fehlgeschlagen.", en: "Upload failed." }, publishFailed: { de: "Import konnte nicht gestartet werden.", en: "The import could not be started." }, credentialsFailed: { de: "Zugangsdaten konnten nicht erstellt werden.", en: "Credentials could not be created." }, dataLoadFailed: { de: "Daten konnten nicht geladen werden.", en: "Data could not be loaded." }, somethingWentWrong: { de: "Etwas ist schiefgelaufen.", en: "Something went wrong." },
  };
  const tr = (key) => { const value = t(key); return !value || value === key ? (fallbacks[key]?.[fallbackLanguage] || key) : value; };
  const sourceCategoryLabels = {
    wohnung: { de: "Wohnung", en: "Apartment" }, haus: { de: "Haus", en: "House" }, grundstueck: { de: "Grundstück", en: "Plot" },
    buero_praxen: { de: "Büro / Praxis", en: "Office / Practice" }, einzelhandel: { de: "Einzelhandel", en: "Retail" }, gastgewerbe: { de: "Gastgewerbe", en: "Hospitality" },
    hallen_lager_prod: { de: "Halle / Lager / Produktion", en: "Warehouse / Production" }, land_und_forstwirtschaft: { de: "Land- und Forstwirtschaft", en: "Agriculture / Forestry" }, parken: { de: "Parken", en: "Parking" }, sonstige: { de: "Sonstige Immobilie", en: "Other property" },
  };
  const parameterSourceLabels = {
    living_area: { de: "Wohnfläche", en: "Living area" }, plot_area: { de: "Grundstücksfläche", en: "Plot area" }, rooms: { de: "Zimmer", en: "Rooms" },
    energy_value: { de: "Energiekennwert", en: "Energy value" }, energy_year: { de: "Baujahr", en: "Construction year" }, energy_carrier: { de: "Energieträger", en: "Energy source" },
  };
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
    } catch (error) { toast.error(error?.message || tr("dataLoadFailed")); }
  }, [activeLanguage]);

  useEffect(() => { if (isLanguageLoaded) load(); }, [isLanguageLoaded, load]);
  useEffect(() => {
    const running = imports.some((entry) => ["received", "processing"].includes(entry.status));
    if (!running) return;
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [imports, load]);

  const activePreview = useMemo(() => imports.find((entry) => entry.mode === "dry_run" && ["completed", "completed_with_errors"].includes(entry.status)), [imports]);

  const upload = async () => {
    if (!file) return toast.error(tr("selectFile"));
    setBusy(true);
    try { await uploadOpenImmoApi(file, "dry_run"); setFile(null); toast.success(tr("importQueued")); await load(); }
    catch (error) { toast.error(error?.message || tr("uploadFailed")); }
    finally { setBusy(false); }
  };

  const publish = async (id) => {
    setBusy(true);
    try { await applyOpenImmoImportApi(id); toast.success(tr("importQueued")); await load(); }
    catch (error) { toast.error(error?.message || tr("publishFailed")); }
    finally { setBusy(false); }
  };

  const rotate = async () => {
    setBusy(true);
    try { const result = await rotateOpenImmoCredentialsApi(); setCredentials(result?.data); setConnection((current) => ({ ...current, username: result?.data?.username, transport: "sftp" })); }
    catch (error) { toast.error(error?.message || tr("credentialsFailed")); }
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
      toast.success(tr("settingsSaved"));
    } catch (error) { toast.error(error?.message || tr("somethingWentWrong")); }
    finally { setBusy(false); }
  };

  const setMapping = (group, key, value) => setConfiguration((current) => ({ ...current, [group]: { ...current[group], [key]: value ? Number(value) : "" } }));

  const statusStyle = (status) => status === "completed" ? "bg-emerald-50 text-emerald-700" : status === "completed_with_errors" || status === "failed" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700";

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full primaryBg opacity-10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><span className="inline-flex items-center gap-2 rounded-full primaryBgLight12 px-3 py-1 text-sm font-semibold primaryColor"><BiLinkAlt /> OpenImmo 1.2.7d</span><h1 className="mt-4 text-2xl md:text-3xl font-bold brandColor">{tr("openImmoImport")}</h1><p className="mt-2 max-w-2xl secondryTextColor">{tr("openImmoDescription")}</p></div>
          <div className="rounded-2xl border bg-slate-50 px-5 py-4 min-w-56"><p className="text-xs uppercase tracking-wide secondryTextColor">{tr("connectionStatus")}</p><p className="mt-1 flex items-center gap-2 font-semibold text-emerald-700"><BiCheckCircle size={20} /> {connection?.status === "paused" ? tr("paused") : tr("ready")}</p></div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl primaryBgLight12 primaryColor"><BiCloudUpload size={24}/></div><div><h2 className="text-xl font-bold brandColor">{tr("uploadOpenImmo")}</h2><p className="text-sm secondryTextColor">{tr("openImmoZipContents")}</p></div></div>
          <label onDragOver={(e)=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(e)=>{e.preventDefault();setDragging(false);setFile(e.dataTransfer.files?.[0] || null)}} className={`mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition ${dragging ? "primaryBgLight12 border-blue-400" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"}`}>
            <input type="file" accept=".zip,application/zip" className="hidden" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
            <BiCloudUpload size={42} className="primaryColor"/><p className="mt-4 font-semibold brandColor">{file?.name || tr("dropOpenImmoZip")}</p><p className="mt-1 text-sm secondryTextColor">{tr("dryRunHint")}</p>
          </label>
          <button disabled={busy || !file} onClick={upload} className="mt-5 w-full rounded-2xl primaryBg px-5 py-3.5 font-semibold text-white disabled:opacity-50">{busy ? tr("processing") : tr("checkImport")}</button>
          {activePreview && <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5"><div className="flex items-center justify-between gap-3"><div><p className="font-bold brandColor">{tr("previewReady")}</p><p className="text-sm secondryTextColor">{activePreview.source_filename}</p></div><button disabled={busy || activePreview.failed_count > 0} onClick={()=>publish(activePreview.public_id)} className="rounded-xl primaryBg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{tr("startImport")}</button></div><div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">{[["total",activePreview.total_count],["new",activePreview.created_count],["updates",activePreview.updated_count],["unchanged",activePreview.unchanged_count],["deactivated",activePreview.deactivated_count],["errors",activePreview.failed_count]].map(([label,value])=><div key={label} className="rounded-xl bg-white p-3 text-center"><strong className="block text-lg brandColor">{value}</strong><span className="text-xs secondryTextColor">{tr(label)}</span></div>)}</div></div>}
        </section>

        <section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl primaryBgLight12 primaryColor"><BiRefresh size={24}/></div><div><h2 className="text-xl font-bold brandColor">{tr("automaticTransfer")}</h2><p className="text-sm secondryTextColor">CRM → Ximmo24</p></div></div><div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm"><p><span className="secondryTextColor">{tr("format")}:</span> <strong>OpenImmo XML/ZIP</strong></p><p><span className="secondryTextColor">{tr("user")}:</span> <strong>{connection?.username || tr("notCreated")}</strong></p><p className="break-all"><span className="secondryTextColor">{tr("endpoint")}:</span> <strong>{credentials?.endpoint || connection?.feed_endpoint || "–"}</strong></p></div><button disabled={busy} onClick={rotate} className="mt-4 w-full rounded-2xl border px-4 py-3 font-semibold brandColor hover:bg-slate-50">{connection?.username ? tr("rotateCredentials") : tr("createCredentials")}</button>{credentials && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-semibold text-amber-900">{tr("savePasswordNow")}</p><p className="mt-2 break-all">{credentials.username}</p><p className="mt-1 break-all font-mono">{credentials.password}</p><p className="mt-2 text-xs text-amber-800">{tr("passwordShownOnce")}</p></div>}</section>
      </div>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div><h2 className="text-xl font-bold brandColor">{tr("fieldMapping")}</h2><p className="mt-1 text-sm secondryTextColor">{tr("fieldMappingDescription")}</p></div>
        <div className="mt-6 grid gap-7 lg:grid-cols-2">
          <div><h3 className="font-semibold brandColor">{tr("categories")}</h3><div className="mt-3 space-y-3">{Object.keys(catalog.sourceCategories).map((key)=><label key={key} className="grid gap-1 text-sm sm:grid-cols-2 sm:items-center"><span>{sourceCategoryLabels[key]?.[fallbackLanguage] || key}</span><select value={configuration.category_mapping[key] || ""} onChange={(event)=>setMapping("category_mapping",key,event.target.value)} className="rounded-xl border bg-white px-3 py-2.5"><option value="">{tr("notMapped")}</option>{catalog.categories.map((category)=><option key={category.id} value={category.id}>{category.translated_name || category.category}</option>)}</select></label>)}</div></div>
          <div><h3 className="font-semibold brandColor">{tr("features")}</h3><div className="mt-3 space-y-3">{Object.keys(catalog.parameterSources).map((key)=><label key={key} className="grid gap-1 text-sm sm:grid-cols-2 sm:items-center"><span>{parameterSourceLabels[key]?.[fallbackLanguage] || key}</span><select value={configuration.parameter_mapping[key] || ""} onChange={(event)=>setMapping("parameter_mapping",key,event.target.value)} className="rounded-xl border bg-white px-3 py-2.5"><option value="">{tr("notMapped")}</option>{catalog.parameters.map((parameter)=><option key={parameter.id} value={parameter.id}>{parameter.translated_name || parameter.name}</option>)}</select></label>)}</div><div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4"><label className="flex items-center justify-between gap-3 text-sm"><span>{tr("automaticApply")}</span><input type="checkbox" checked={configuration.feed_mode === "apply"} onChange={(event)=>setConfiguration((current)=>({...current,feed_mode:event.target.checked ? "apply" : "dry_run"}))}/></label><label className="flex items-center justify-between gap-3 text-sm"><span>{tr("autoApprove")}</span><input type="checkbox" checked={configuration.auto_approve} onChange={(event)=>setConfiguration((current)=>({...current,auto_approve:event.target.checked}))}/></label><label className="flex items-center justify-between gap-3 text-sm"><span>{tr("autoPublish")}</span><input type="checkbox" checked={configuration.auto_publish} onChange={(event)=>setConfiguration((current)=>({...current,auto_publish:event.target.checked,auto_approve:event.target.checked ? true : current.auto_approve}))}/></label></div></div>
        </div>
        <button disabled={busy} onClick={saveConfiguration} className="mt-6 rounded-2xl primaryBg px-6 py-3 font-semibold text-white disabled:opacity-50">{tr("save")}</button>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><BiHistory className="primaryColor" size={24}/><h2 className="text-xl font-bold brandColor">{tr("importHistory")}</h2></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left secondryTextColor"><th className="p-3">{tr("file")}</th><th className="p-3">{tr("mode")}</th><th className="p-3">{tr("status")}</th><th className="p-3 text-center">{tr("total")}</th><th className="p-3 text-center">{tr("new")}</th><th className="p-3 text-center">{tr("updates")}</th><th className="p-3 text-center">{tr("errors")}</th></tr></thead><tbody>{imports.map((entry)=><tr key={entry.public_id} className="border-b last:border-0"><td className="p-3 font-medium brandColor">{entry.source_filename}</td><td className="p-3">{entry.mode === "dry_run" ? tr("preview") : tr("import")}</td><td className="p-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(entry.status)}`}>{entry.status === "failed" ? <BiErrorCircle/> : <BiCheckCircle/>}{entry.status}</span></td><td className="p-3 text-center">{entry.total_count}</td><td className="p-3 text-center">{entry.created_count}</td><td className="p-3 text-center">{entry.updated_count}</td><td className="p-3 text-center">{entry.failed_count}</td></tr>)}{imports.length===0&&<tr><td colSpan="7" className="p-8 text-center secondryTextColor">{tr("noImports")}</td></tr>}</tbody></table></div></section>
    </div>
  );
};

export default AgentOpenImmoImport;
