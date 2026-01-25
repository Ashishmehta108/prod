import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../../api/client";
import {
    Settings,
    Server,
    Building2,
    Package,
    ArrowRight,
    Link2,
    Save,
    Loader2,
    ShieldCheck,
    Database,
    AlertCircle,
    Boxes
} from "lucide-react";

/**
 * Tally Settings Page
 * Manages ERP-to-Tally sync configuration and master creation tools.
 */
const TallySettings: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [config, setConfig] = useState({
        tallyIp: "127.0.0.1",
        tallyPort: 9000,
        companyName: "",
        defaultGodown: "Main Location",
        ledgerMappings: {
            stockLedger: "Internal Consumption",
            expenseLedger: "Production Expenses",
            partyLedger: "Cash"
        },
        autoSync: false
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get("/tally/config");
            if (res.data.success && res.data.data) {
                setConfig(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch tally config");
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            const res = await api.post("/tally/test-connection", config);
            if (res.data.success) {
                toast.success("Connection to Tally Agent successful!");
            } else {
                toast.error("Could not reach Tally Agent. Check IP/Port.");
            }
        } catch (err) {
            toast.error("Test connection failed");
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await api.post("/tally/config", config);
            if (res.data.success) {
                toast.success("Configuration saved successfully");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Save failed");
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-all";
    const labelBase = "text-xs font-medium text-neutral-600 mb-2 block";

    return (
        <div className="min-h-screen bg-neutral-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-200">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Tally Configuration</h1>
                        <p className="text-sm text-neutral-500">Configure Tally Prime integration and master data synchronization</p>
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={testing}
                        className="h-10 px-6 bg-white border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 flex items-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        {testing ? <Loader2 size={16} className="animate-spin text-neutral-400" /> : <Link2 size={16} className="text-neutral-500" />}
                        {testing ? "Checking Tally..." : "Test Connection"}
                    </button>
                </div>

                {/* --- MAIN GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column (8/12): Core Config & Master Tools */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* 1. Network / Connection Settings */}
                        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm">
                                        <Server size={18} className="text-neutral-600" />
                                    </div>
                                    <h2 className="font-bold text-neutral-800 tracking-tight">Network Settings</h2>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Auto Sync</span>
                                    <button
                                        onClick={() => setConfig({ ...config, autoSync: !config.autoSync })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.autoSync ? 'bg-neutral-900' : 'bg-neutral-200'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${config.autoSync ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelBase}>Tally Agent IP Address</label>
                                    <input type="text" value={config.tallyIp} onChange={(e) => setConfig({ ...config, tallyIp: e.target.value })} className={inputBase} placeholder="e.g. 127.0.0.1" />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelBase}>Port Number (ODBC)</label>
                                    <input type="number" value={config.tallyPort} onChange={(e) => setConfig({ ...config, tallyPort: parseInt(e.target.value) || 0 })} className={inputBase} placeholder="e.g. 9000" />
                                </div>
                            </div>
                        </div>

                        {/* 2. Accounting/Ledger Mappings */}
                        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-3">
                                <div className="h-9 w-9 bg-white border border-neutral-200 rounded-xl flex items-center justify-center shadow-sm">
                                    <Database size={18} className="text-neutral-600" />
                                </div>
                                <h2 className="font-bold text-neutral-800 tracking-tight">Ledger Mappings</h2>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelBase}>Inward / Stock Ledger</label>
                                        <input type="text" value={config.ledgerMappings.stockLedger} onChange={(e) => setConfig({ ...config, ledgerMappings: { ...config.ledgerMappings, stockLedger: e.target.value } })} className={inputBase} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelBase}>Production Expense Head</label>
                                        <input type="text" value={config.ledgerMappings.expenseLedger} onChange={(e) => setConfig({ ...config, ledgerMappings: { ...config.ledgerMappings, expenseLedger: e.target.value } })} className={inputBase} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelBase}>Default Counter Party Ledger</label>
                                    <input type="text" value={config.ledgerMappings.partyLedger} onChange={(e) => setConfig({ ...config, ledgerMappings: { ...config.ledgerMappings, partyLedger: e.target.value } })} className={inputBase} />
                                </div>
                            </div>
                        </div>

                        {/* 3. Master Data Synchronization Tools */}
                        <div className="bg-white border border-neutral-200 rounded-2xl shadow-md overflow-hidden">
                            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white flex items-center gap-3">
                                <div className="h-9 w-9 bg-neutral-800 rounded-xl flex items-center justify-center">
                                    <Boxes size={18} className="text-white" />
                                </div>
                                <h2 className="font-bold tracking-tight">Tally Master Synchronization</h2>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                    {/* Tool: Units of Measure */}
                                    <div className="space-y-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-[0.1em]">1. Create Unit</h3>
                                        </div>
                                        <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">Create UOM (like kg, pcs) in Tally Prime. This must exist before creating items.</p>
                                        <div className="flex flex-col gap-2">
                                            <input id="tallyUnitSym" placeholder="Symbol (e.g. kg)" className="h-10 w-full rounded-xl border border-neutral-200 px-4 text-sm font-bold shadow-inner" />
                                            <input id="tallyUnitName" placeholder="Formal Name (e.g. Kilograms)" className="h-10 w-full rounded-xl border border-neutral-200 px-4 text-sm shadow-inner" />
                                            <button
                                                onClick={async () => {
                                                    const sym = (document.getElementById('tallyUnitSym') as HTMLInputElement).value;
                                                    const name = (document.getElementById('tallyUnitName') as HTMLInputElement).value;
                                                    if (!sym) return toast.error("Enter unit symbol");
                                                    try {
                                                        const tid = toast.loading(`Creating unit ${sym}...`);
                                                        const res = await api.post("/tally/create-unit", { symbol: sym, formalName: name || sym });
                                                        toast.dismiss(tid);
                                                        if (res.data.success) toast.success(`Unit '${sym}' created in Tally!`);
                                                        else toast.error(res.data.message || "Failed to create unit");
                                                    } catch (err: any) { toast.dismiss(); toast.error("API Connection Error"); }
                                                }}
                                                className="w-full h-10 bg-neutral-900 text-white text-xs font-black rounded-xl hover:bg-neutral-800 transition-all uppercase tracking-widest shadow-lg active:scale-95"
                                            >
                                                Sync to Tally
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tool: Stock Items */}
                                    <div className="space-y-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-[0.1em]">2. Create Product</h3>
                                        </div>
                                        <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">Create a Stock Item master in Tally. Ensure the Unit already exists.</p>
                                        <div className="flex flex-col gap-2">
                                            <input id="tallyItemName" placeholder="Item Name (e.g. PVC Resin)" className="h-10 w-full rounded-xl border border-neutral-200 px-4 text-sm font-bold shadow-inner" />
                                            <select id="tallyItemUnit" className="h-10 w-full rounded-xl border border-neutral-200 px-4 text-sm bg-white shadow-inner appearance-none">
                                                <option value="kg">kg (Kilograms)</option>
                                                <option value="pcs">pcs (Pieces)</option>
                                                <option value="mtr">mtr (Meters)</option>
                                            </select>
                                            <button
                                                onClick={async () => {
                                                    const name = (document.getElementById('tallyItemName') as HTMLInputElement).value;
                                                    const unit = (document.getElementById('tallyItemUnit') as HTMLSelectElement).value;
                                                    if (!name) return toast.error("Enter item name");
                                                    try {
                                                        const tid = toast.loading(`Creating item ${name}...`);
                                                        const res = await api.post("/tally/create-stock-item", { itemName: name, unit });
                                                        toast.dismiss(tid);
                                                        if (res.data.success) toast.success(`Item '${name}' created in Tally!`);
                                                        else toast.error(res.data.message || "Failed to create item");
                                                    } catch (err: any) { toast.dismiss(); toast.error("API Connection Error"); }
                                                }}
                                                className="w-full h-10 bg-neutral-900 text-white text-xs font-black rounded-xl hover:bg-neutral-800 transition-all uppercase tracking-widest shadow-lg active:scale-95"
                                            >
                                                Sync to Tally
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tool: Godowns */}
                                    <div className="space-y-4 p-5 rounded-2xl bg-neutral-50 border border-neutral-100 md:col-span-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-[0.1em]">3. Create Godown / Location</h3>
                                        </div>
                                        <div className="flex gap-3">
                                            <input id="tallyGodownNew" defaultValue={config.defaultGodown} placeholder="Godown Name" className="h-10 flex-1 rounded-xl border border-neutral-200 px-4 text-sm font-bold shadow-inner" />
                                            <button
                                                onClick={async () => {
                                                    const name = (document.getElementById('tallyGodownNew') as HTMLInputElement).value;
                                                    if (!name) return toast.error("Enter godown name");
                                                    try {
                                                        const tid = toast.loading(`Creating godown...`);
                                                        const res = await api.post("/tally/create-godown", { godownName: name });
                                                        toast.dismiss(tid);
                                                        if (res.data.success) toast.success(`Godown '${name}' created!`);
                                                        else toast.error(res.data.message || "Failed to create godown");
                                                    } catch (err: any) { toast.dismiss(); toast.error("API Connection Error"); }
                                                }}
                                                className="h-10 px-8 bg-neutral-900 text-white text-xs font-black rounded-xl hover:bg-neutral-800 transition-all uppercase tracking-widest shadow-lg active:scale-95 whitespace-nowrap"
                                            >
                                                Sync Godown
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (4/12): Side Actions & Info */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Company Settings Card */}
                        <div className="bg-neutral-900 rounded-2xl p-6 text-white shadow-xl space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-neutral-800 rounded-xl flex items-center justify-center border border-neutral-700">
                                    <Building2 size={20} className="text-neutral-400" />
                                </div>
                                <h2 className="font-bold tracking-tight">Active Company</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Tally Account Name</label>
                                    <input
                                        type="text"
                                        value={config.companyName}
                                        onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                                        className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder:text-neutral-600 focus:ring-2 focus:ring-neutral-600 outline-none border-dashed transition-all"
                                        placeholder="EXACT Tally Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Primary Godown</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={config.defaultGodown}
                                            onChange={(e) => setConfig({ ...config, defaultGodown: e.target.value })}
                                            className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-sm font-medium text-white focus:ring-2 focus:ring-neutral-600 outline-none border-dashed transition-all"
                                        />
                                        <Package size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full h-14 bg-white hover:bg-neutral-100 text-neutral-900 rounded-xl flex items-center justify-center gap-3 font-bold text-sm shadow-lg shadow-white/10 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                {loading ? "Applying..." : "Save Configuration"}
                            </button>
                        </div>

                        {/* Help & Info Box */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-neutral-800">
                                <AlertCircle size={20} className="text-amber-500" />
                                <span className="font-bold tracking-tight">Integration Help</span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                                        1. Ensure <span className="text-neutral-900 font-bold underline decoration-neutral-300">Tally Prime</span> is open with the specified company.
                                    </p>
                                </div>
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                                        2. Unit master (kg, pcs) must exist **before** you can create stock items via API.
                                    </p>
                                </div>
                                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                                        3. Educational mode only allows dates: <span className="font-bold text-neutral-900">1st, 2nd, 31st</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-neutral-100 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Active Protection Sync</span>
                            </div>
                        </div>
                    </div>

                </div> {/* End Grid */}
            </div> {/* End Max-W Container */}
        </div>
    );
};

export default TallySettings;