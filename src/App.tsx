import React, { useState, useRef, useEffect } from 'react';
import { PayInSlip } from './components/PayInSlip';
import { SetupModal } from './components/SetupModal';
import { Download, Printer, Plus, History, Trash2, ExternalLink, Save, Building, Settings, X, FileText, Minus, Lock, Unlock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { saveSlip, getAllSlips, deleteSlip, saveBank, getAllBanks, deleteBank, type SavedSlip, type SavedBank, saveOffice, getAllOffices, type SavedOffice, saveSettings, getSettings } from './lib/db';

const getCurrentDateDDMMYYYY = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}${mm}${yyyy}`;
};

export default function App() {
  const [data, setData] = useState({
    date: getCurrentDateDDMMYYYY(),
    bankName: 'STATE BANK OF INDIA',
    logo: 'SBI_Logo.png',
    logoScale: 1,
    branchName: '',
    branchCode: '',
    panNo: '',
    incDate: '',
    beneficiary: '',
    accountNo: '',
    depositorOffice: '',
    officeCode: '',
    energyBill: '',
    others: '',
    denominations: {
      '500': '0',
      '200': '0',
      '100': '0',
      '50': '0',
      '20': '0',
      '10': '0',
      'COIN': '0',
    } as Record<string, string>,
    isLocked: true,
  });

  const [history, setHistory] = useState<SavedSlip[]>([]);
  const [savedBanks, setSavedBanks] = useState<SavedBank[]>([]);
  const [savedOffices, setSavedOffices] = useState<SavedOffice[]>([]);
  const settingsKey = 'app_data_v1';
  const [showHistory, setShowHistory] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);

  const slipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      // Chrome/Edge: capture the event so we can show a custom install UI
      // @ts-ignore
      console.log('beforeinstallprompt event fired', e);
      // @ts-ignore
      if (e && typeof (e as any).preventDefault === 'function') (e as any).preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallButton(false);
      console.log('PWA installed (appinstalled event)');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled as EventListener);
    };
  }, []);

  // Log manifest loading and basic checks for debugging PWA install issues
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('manifest.json');
        if (!resp.ok) {
          console.warn('Manifest fetch returned non-OK status', resp.status);
          return;
        }
        const manifest = await resp.json();
        console.log('Loaded manifest.json', manifest);
        if (!manifest.icons || manifest.icons.length === 0) console.warn('Manifest has no icons');
      } catch (err) {
        console.warn('Failed to fetch manifest.json', err);
      }
      try {
        console.log('Service worker controller present?', !!navigator.serviceWorker?.controller);
      } catch {}
    })();
  }, []);

  // Detect iOS Safari and show inline A2HS instructions (iOS doesn't support beforeinstallprompt)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isInStandalone = ('standalone' in window && (window as any).standalone) || (navigator as any).standalone;
    setShowIosBanner(!!(isIos && !isInStandalone));
  }, []);

  useEffect(() => {
    const onSwWaiting = (e: any) => {
      const reg: ServiceWorkerRegistration | undefined = e?.detail;
      if (reg) {
        swRegistrationRef.current = reg;
        setUpdateAvailable(true);
      }
    };

    window.addEventListener('swWaiting', onSwWaiting as EventListener);

    // When the new SW takes control, reload so the user sees the updated app
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange);

    return () => {
      window.removeEventListener('swWaiting', onSwWaiting as EventListener);
      navigator.serviceWorker?.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const loadHistory = async () => {
    try {
      const slips = await getAllSlips();
      setHistory(slips.sort((a, b) => b.timestamp - a.timestamp));
      const banks = await getAllBanks();
      setSavedBanks(banks);
      const offices = await getAllOffices();
      setSavedOffices(offices);
      // Load app settings (saved form state)
      try {
        const settings = await getSettings(settingsKey);
        if (settings) {
          setData(prev => ({ ...prev, ...settings }));
        }
      } catch (err) {
        console.warn('Failed to load app settings:', err);
      }
    } catch (error) {
      console.error('Failed to load history or banks:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (data.isLocked && ['beneficiary', 'panNo', 'incDate'].includes(name)) {
      alert('These fields are locked. Please unlock them first.');
      return;
    }
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    if (isNaN(selectedId)) return;
    const bank = savedBanks.find(b => b.id === selectedId);
    if (bank) {
      setData(prev => ({
        ...prev,
        bankName: bank.bankName,
        accountNo: bank.accountNo,
        logo: bank.logo,
        logoScale: bank.logoScale || 1,
      }));
    }
  };

  const handleSaveBank = async () => {
    if (!data.bankName || !data.accountNo) {
      alert('Please enter Bank Name and A/C No to save.');
      return;
    }
    try {
      await saveBank({
        bankName: data.bankName,
        accountNo: data.accountNo,
        logo: data.logo,
        logoScale: data.logoScale,
      });
      await loadHistory();
      alert('Bank saved successfully!');
    } catch (error) {
      console.error('Failed to save bank:', error);
      alert('Failed to save bank.');
    }
  };

  const handleDeleteBank = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteBank(id);
      await loadHistory();
    } catch (error) {
      console.error('Failed to delete bank:', error);
    }
  };

  const uniqueBankNames = Array.from(new Set(history.map(h => h.bankName).filter(Boolean)));
  const uniqueAccountNos = Array.from(new Set(history.map(h => h.accountNo).filter(Boolean)));
  const uniqueBranchNames = Array.from(new Set(history.map(h => h.branchName).filter(Boolean)));
  const uniqueBranchCodes = Array.from(new Set(history.map(h => h.branchCode).filter(Boolean)));
  const uniqueDepositorOffices = Array.from(new Set([
    ...history.map(h => h.depositorOffice).filter(Boolean),
    ...savedOffices.map(o => o.depositorOffice).filter(Boolean)
  ]));
  const uniqueOfficeCodes = Array.from(new Set([
    ...history.map(h => h.officeCode).filter(Boolean),
    ...savedOffices.map(o => o.officeCode).filter(Boolean)
  ]));

  const handleDenomChange = (denom: string, value: string) => {
    setData(prev => ({
      ...prev,
      denominations: { ...prev.denominations, [denom]: value },
    }));
  };

  const handleClearDenominations = () => {
    setData(prev => ({
      ...prev,
      denominations: {
        '500': '',
        '200': '',
        '100': '',
        '50': '',
        '20': '',
        '10': '',
        'COIN': '',
      }
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    Object.entries(data.denominations).forEach(([denom, countStr]: [string, string]) => {
      const count = parseInt(countStr || '0');
      if (!isNaN(count)) {
        if (denom === 'COIN') {
          total += count;
        } else {
          total += parseInt(denom) * count;
        }
      }
    });
    return total;
  };

  const getMissingFields = () => {
    const missing = [];
    if (!data.bankName) missing.push('Bank Name');
    if (!data.branchName) missing.push('Branch Name');
    if (!data.branchCode) missing.push('Branch Code');
    if (!data.accountNo) missing.push('A/C No');
    if (!data.depositorOffice) missing.push('Depositor Office');
    if (!data.officeCode) missing.push('Office Code');
    return missing;
  };

  const handleSaveToHistory = async () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      alert(`Please complete the following fields before saving:\n- ${missing.join('\n- ')}`);
      return;
    }
    setIsSaving(true);
    try {
      const totalAmount = calculateTotal();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = data as any; // Remove ID to ensure a new entry is created
      const slipToSave: SavedSlip = {
        ...rest,
        timestamp: Date.now(),
        totalAmount,
      };
      await saveSlip(slipToSave);
      await loadHistory();
      alert("Slip saved to history!");
    } catch (error) {
      console.error('Failed to save slip:', error);
      alert("Failed to save slip to history.");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save current form data (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      saveSettings(settingsKey, data).catch(err => console.warn('Failed to save settings:', err));
    }, 800);
    return () => clearTimeout(t);
  }, [data]);

  const handleLoadFromHistory = (slip: SavedSlip) => {
    const { id, timestamp, totalAmount, ...rest } = slip;
    setData(prev => ({
      ...prev, // Keep current state (like isLocked) or overwrite? Usually overwrite.
      ...rest,
      bankName: rest.bankName || 'STATE BANK OF INDIA',
      logo: rest.logo || 'sbi',
      logoScale: rest.logoScale || 1,
      // We don't set 'id' in data to avoid overwriting the history entry if we save again (though we strip it now)
      // But if we want to support "updating" a history entry, we would need to keep it.
      // For now, we treat history as a log, so we don't set ID in state, or we ignore it on save.
    }));
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFromHistory = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSlip(id);
      await loadHistory();
    } catch (error) {
      console.error('Failed to delete slip:', error);
    }
  };

  const generatePDF = async () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      alert(`Please complete the following fields before generating PDF:\n- ${missing.join('\n- ')}`);
      return;
    }
    if (!slipRef.current || isGeneratingPDF) return;
    
    setIsGeneratingPDF(true);
    try {
      // Small delay to ensure rendering is stable
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await htmlToImage.toPng(slipRef.current, {
        backgroundColor: '#ffffff',
        width: 1122,
        height: 793,
        pixelRatio: 2, // Reduced from 3 to 2 for better performance/reliability
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`PayInSlip_${data.date}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try using the "Print" button and select "Save as PDF" instead.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const printSlip = async () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      alert(`Please complete the following fields before printing:\n- ${missing.join('\n- ')}`);
      return;
    }
    if (!slipRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Preparing Print...</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #333; }
          </style>
        </head>
        <body>
          <h2>Preparing high-quality document for printing...</h2>
        </body>
      </html>
    `);

    try {
      // Small delay to ensure rendering is stable
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await htmlToImage.toPng(slipRef.current, {
        backgroundColor: '#ffffff',
        width: 1122,
        height: 793,
        pixelRatio: 2, // Reduced from 3 to 2
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Slip</title>
            <style>
              @page { size: A4 landscape; margin: 0; }
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
              img { width: 100%; max-width: 297mm; height: auto; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Print failed:', error);
      printWindow.close();
      alert('Failed to prepare print. Please try downloading the PDF instead.');
    }
  };

  const [zoom, setZoom] = useState(1);

  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const toISO = (ddmmyyyy: string) => {
    const m = ddmmyyyy?.match(/^(\d{2})(\d{2})(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return '';
  };

  const fromISO = (iso: string) => {
    const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}${m[2]}${m[1]}`;
    return '';
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 pt-24 md:pt-28 font-sans text-slate-900">
      <div className="w-full">
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-50 backdrop-blur-md border-b border-slate-200 p-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-[#0072bc]" />
              Pay-In Slip Generator for Banks
            </h1>
          </div>
          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            {showInstallButton && (
              <button
                onClick={async () => {
                  if (!deferredPrompt) return;
                  try {
                    // @ts-ignore
                    deferredPrompt.prompt();
                    // @ts-ignore
                    const choice = await deferredPrompt.userChoice;
                    if (choice && choice.outcome === 'accepted') {
                      console.log('User accepted the PWA install');
                    } else {
                      console.log('User dismissed the PWA install');
                    }
                  } catch (err) {
                    console.warn('Install prompt failed:', err);
                  } finally {
                    setDeferredPrompt(null);
                    setShowInstallButton(false);
                  }
                }}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                <Download className="w-4 h-4" />
                Install
              </button>
            )}
           
            <button
              onClick={() => setShowSetupModal(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Settings className="w-4 h-4" />
              Setup
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <History className="w-4 h-4" />
              History ({history.length})
            </button>
            <button
              onClick={handleSaveToHistory}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save to History'}
            </button>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 bg-[#0072bc] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#005a96] transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={printSlip}
              className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </header>

        {updateAvailable && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-60 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md shadow-md flex items-center gap-3">
            <div className="text-sm font-medium">Update available</div>
            <button
              onClick={async () => {
                const reg = swRegistrationRef.current;
                if (!reg || !reg.waiting) return;
                try {
                  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                } catch (err) {
                  console.warn('Failed to post skipWaiting:', err);
                }
              }}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold"
            >
              Update
            </button>
            <button onClick={() => setUpdateAvailable(false)} className="text-sm text-yellow-700 underline">Dismiss</button>
          </div>
        )}

        {showIosBanner && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-slate-900 text-white px-4 py-3 rounded-md shadow-md flex items-center gap-3">
            <div className="text-sm">Install on iPhone: tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span></div>
            <button onClick={() => setShowIosBanner(false)} className="ml-3 text-sm underline">Dismiss</button>
          </div>
        )}

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-[#0072bc]" />
                  Saved Slips
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-slate-600 "
                >
                  Close
                </button>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No saved slips found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                  {history.map((slip) => (
                    <div
                      key={slip.id}
                      onClick={() => handleLoadFromHistory(slip)}
                      className="group p-4 border border-slate-100 rounded-xl hover:border-[#0072bc] hover:bg-blue-50/30 transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-[#0072bc]">{slip.date}</div>
                        <button
                          onClick={(e) => handleDeleteFromHistory(slip.id!, e)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-slate-700 truncate">{slip.branchName}</div>
                      <div className="text-xs text-slate-500 mt-1">A/C: {slip.accountNo}</div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="text-sm font-bold text-slate-900">₹{slip.totalAmount}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(slip.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-all">
                        <ExternalLink className="w-3 h-3 text-[#0072bc]" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="xl:col-span-4 space-y-6">
            {/* Quick Entry Section - Always Visible */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-[#0072bc] rounded-full"></div>
                Quick Entry
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Date (DDMMYYYY)</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="date"
                      value={data.date}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-12 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                      placeholder="02122025"
                    />
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={toISO(data.date)}
                      onChange={(e) => {
                        const iso = e.target.value; // yyyy-mm-dd
                        const formatted = iso ? fromISO(iso) : '';
                        setData((prev) => ({ ...prev, date: formatted }));
                      }}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = dateInputRef.current;
                        if (!el) return;
                        if (typeof el.showPicker === 'function') {
                          try { el.showPicker(); } catch { el.focus(); }
                        } else {
                          el.focus();
                        }
                      }}
                      aria-label="Open date picker"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-[#0072bc] hover:bg-blue-50 rounded-md transition-all"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>


            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#0072bc] rounded-full"></div>
                  Denominations
                </h2>
                <button
                  onClick={handleClearDenominations}
                  className=" flex items-center bg-red-600 text-white gap-1.5 text-xs font-semibold hover:bg-red-700 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
              <div className="space-y-3">
                {[500, 200, 100, 50, 20, 10, 'COIN'].map(denom => (
                  <div key={denom} className="flex items-center gap-4">
                    <div className="w-16 font-bold text-slate-600">{denom === 'COIN' ? 'COIN' : `${denom} X`}</div>
                    <input
                      type="number"
                      value={data.denominations[denom]}
                      onChange={(e) => handleDenomChange(denom.toString(), e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all text-right font-mono"
            
                    />
                    <div className="w-24 text-right font-bold text-[#0072bc]">
                      ₹{denom === 'COIN' ? (parseInt(data.denominations[denom]) || null) : (denom as number) * (parseInt(data.denominations[denom]) || null)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Preview Section */}
          <div className="xl:col-span-8">
            <div className="sticky top-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-full overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">A4 Pay In Slip</h2>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1 hover:bg-white rounded shadow-sm"><Minus className="w-4 h-4" /></button>
                    <button onClick={() => setZoom(1)} className="text-xs font-mono w-12 text-center hover:bg-white rounded shadow-sm">{Math.round(zoom * 100)}%</button>
                    <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1 hover:bg-white rounded shadow-sm"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="w-full overflow-x-auto pb-4 custom-scrollbar relative">
                  {(!data.bankName || !data.branchName || !data.branchCode || !data.accountNo || !data.depositorOffice || !data.officeCode) && (
                    <div className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 text-center max-w-sm mx-4">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Building className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Setup Incomplete</h3>
                        <p className="text-sm text-slate-500 mb-4">
                          Please complete the Bank and Office setup to generate the pay-in slip.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setShowSetupModal(true)}
                            className="text-xs bg-blue-50 text-[#0072bc] px-3 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
                          >
                            Open Setup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 w-max mx-auto origin-top-left" style={{ transform: `scale(${zoom})` }}>
                    <div id="print-area">
                      <PayInSlip ref={slipRef} data={data} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        data={data}
        setData={setData}
        handleInputChange={handleInputChange}
        savedBanks={savedBanks}
        handleBankSelect={handleBankSelect}
        handleSaveBank={handleSaveBank}
        uniqueBankNames={uniqueBankNames}
        uniqueBranchNames={uniqueBranchNames}
        uniqueBranchCodes={uniqueBranchCodes}
        uniqueAccountNos={uniqueAccountNos}
        uniqueDepositorOffices={uniqueDepositorOffices}
        uniqueOfficeCodes={uniqueOfficeCodes}
        setSavedOffices={setSavedOffices}
        loadHistory={loadHistory}
      />

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
