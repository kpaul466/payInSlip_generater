import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building, Settings, FileText, Save, Lock, Unlock, Calendar, Edit2 } from 'lucide-react';
import { saveOffice } from '../lib/db';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  
  // Bank Setup Props
  savedBanks: any[];
  handleBankSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleSaveBank: () => void;
  uniqueBankNames: string[];
  uniqueBranchNames: string[];
  uniqueBranchCodes: string[];
  uniqueAccountNos: string[];

  // Office Setup Props
  uniqueDepositorOffices: string[];
  uniqueOfficeCodes: string[];
  setSavedOffices: React.Dispatch<React.SetStateAction<any[]>>;
  loadHistory: () => Promise<void>;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  data,
  setData,
  handleInputChange,
  savedBanks,
  handleBankSelect,
  handleSaveBank,
  uniqueBankNames,
  uniqueBranchNames,
  uniqueBranchCodes,
  uniqueAccountNos,
  uniqueDepositorOffices,
  uniqueOfficeCodes,
  setSavedOffices,
  loadHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'office' | 'transaction'>('bank');
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const toISO = (ddmmyyyy: string) => {
    const m = ddmmyyyy?.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return '';
  };

  const fromISO = (iso: string) => {
    const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return `${m[3]}.${m[2]}.${m[1]}`;
    return '';
  };

  const tabs = [
    { id: 'bank', label: 'Bank Setup', icon: Building },
    { id: 'office', label: 'Office Setup', icon: Settings },
    { id: 'transaction', label: 'Transaction Details', icon: FileText },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#0072bc]" />
                Setup
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-slate-100 shrink-0 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-[#0072bc] border-b-2 border-[#0072bc] bg-blue-50/50'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar grow">
              {activeTab === 'bank' && (
                <div className="space-y-4">
                  {savedBanks.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-2">Load Saved Bank</label>
                      <select
                        onChange={handleBankSelect}
                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all bg-white"
                        defaultValue=""
                      >
                        <option value="" disabled>Select a saved bank...</option>
                        {savedBanks.map(bank => (
                          <option key={bank.id} value={bank.id}>
                            {bank.bankName} - {bank.accountNo}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      list="bankNamesList"
                      value={data.bankName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                    />
                    <datalist id="bankNamesList">
                      {uniqueBankNames.map((name, i) => (
                        <option key={i} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Bank Branch Name</label>
                    <input
                      type="text"
                      name="branchName"
                      list="branchNamesList"
                      value={data.branchName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                    />
                    <datalist id="branchNamesList">
                      {uniqueBranchNames.map((name, i) => (
                        <option key={i} value={name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Bank Branch Code</label>
                    <input
                      type="text"
                      name="branchCode"
                      list="branchCodesList"
                      value={data.branchCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                    />
                    <datalist id="branchCodesList">
                      {uniqueBranchCodes.map((code, i) => (
                        <option key={i} value={code} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">A/C No</label>
                    <input
                      type="text"
                      name="accountNo"
                      list="accountNosList"
                      value={data.accountNo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all font-mono"
                    />
                    <datalist id="accountNosList">
                      {uniqueAccountNos.map((no, i) => (
                        <option key={i} value={no} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Logo</label>
                    <div className="space-y-2">
                      <select
                        name="logo"
                        value={['SBI_Logo.png', 'none', 'CBI_Logo.png', 'PNB_Logo.png'].includes(data.logo) ? data.logo : 'custom'}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === 'custom') {
                            setData(prev => ({ ...prev, logo: '' }));
                          } else {
                            handleInputChange(e);
                          }
                        }}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                      >
                        <option value="SBI_Logo.png">SBI Logo (Default)</option>
                        <option value="CBI_Logo.png">Central Bank of India</option>
                        <option value="PNB_Logo.png">Punjab National Bank</option>
                        <option value="none">No Logo</option>
                        {![ 'SBI_Logo.png', 'none', 'CBI_Logo.png', 'PNB_Logo.png' ].includes(data.logo) && <option value="custom">Custom Logo</option>}
                      </select>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setData(prev => ({ ...prev, logo: reader.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#0072bc] hover:file:bg-blue-100"
                      />
                      {/* Allow entering a path to an image in the public folder when custom is selected */}
                      {![ 'SBI_Logo.png', 'none', 'CBI_Logo.png', 'PNB_Logo.png' ].includes(data.logo) && (
                        <input
                          type="text"
                          placeholder="my-logo.png (optional: path in public/)"
                          value={data.logo && !data.logo.startsWith('data:') ? data.logo : ''}
                          onChange={(e) => setData(prev => ({ ...prev, logo: e.target.value }))}
                          className="w-full mt-2 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                        />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Select or upload a logo to display on the pay-in slip.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Logo Scale ({Math.round(data.logoScale * 100)}%)</label>
                    <input
                      type="range"
                      name="logoScale"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={data.logoScale}
                      onChange={(e) => setData(prev => ({ ...prev, logoScale: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0072bc]"
                    />
                  </div>
                  <div className="pt-4 flex justify-start">
                    <button
                      onClick={handleSaveBank}
                      className="text-[#0072bc] font-semibold hover:text-[#005a96] transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save to DB
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'office' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Depositor Office Name</label>
                    <input
                      type="text"
                      name="depositorOffice"
                      list="depositorOfficesList"
                      value={data.depositorOffice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                    />
                    <datalist id="depositorOfficesList">
                      {uniqueDepositorOffices.map((office, i) => (
                        <option key={i} value={office} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Office Code</label>
                    <input
                      type="text"
                      name="officeCode"
                      list="officeCodesList"
                      value={data.officeCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                    />
                    <datalist id="officeCodesList">
                      {uniqueOfficeCodes.map((code, i) => (
                        <option key={i} value={code} />
                      ))}
                    </datalist>
                  </div>
                  <div className="pt-4 flex justify-start">
                     <button
                      onClick={async () => {
                        const name = data.depositorOffice?.trim();
                        const code = data.officeCode?.trim();
                        if (!name && !code) {
                          alert('Please enter office name or code to save.');
                          return;
                        }
                        try {
                          const id = await saveOffice({ depositorOffice: name, officeCode: code });
                          console.log('Saved office id:', id);
                          // Optimistically update local state so datalists reflect immediately
                          setSavedOffices(prev => {
                            const exists = prev.find(o => o.depositorOffice === name && o.officeCode === code);
                            if (exists) return prev;
                            return [{ id: id as number, depositorOffice: name || '', officeCode: code || '' }, ...prev];
                          });
                          await loadHistory();
                          alert('Office saved to DB!');
                        } catch (err) {
                          console.error('Failed to save office setup:', err);
                          alert('Failed to save office setup.');
                        }
                      }}
                      className="text-[#0072bc] font-semibold hover:text-[#005a96] transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save to DB
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'transaction' && (
                <div className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        if (data.isLocked) {
                          if (confirm('Are you sure you want to unlock these fields?')) {
                            if (confirm('This action requires special permission. Are you really sure?')) {
                              setData((prev: any) => ({ ...prev, isLocked: false }));
                            }
                          }
                        } else {
                          setData((prev: any) => ({ ...prev, isLocked: true }));
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#0072bc] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-sm active:scale-95"
                    >
                      {data.isLocked ? (
                        <>
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Lock
                        </>
                      )}
                    </button>
                    {/* Removed the redundant icon-only button to avoid confusion */}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Beneficiary</label>
                    <input
                      type="text"
                      name="beneficiary"
                      value={data.beneficiary}
                      onChange={handleInputChange}
                      readOnly={data.isLocked}
                      className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all ${data.isLocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Energy Bill (₹)</label>
                      <input
                        type="text"
                        name="energyBill"
                        value={data.energyBill}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Others (₹)</label>
                      <input
                        type="text"
                        name="others"
                        value={data.others}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">PAN No</label>
                      <input
                        type="text"
                        name="panNo"
                        value={data.panNo}
                        onChange={handleInputChange}
                        readOnly={data.isLocked}
                        className={`w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all ${data.isLocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Inc. Date (DD.MM.YYYY)</label>
                      <div className="flex items-center">
                        <input
                          ref={dateInputRef}
                          type="date"
                          name="incDate"
                          value={toISO(data.incDate)}
                          onChange={(e) => {
                            const iso = e.target.value; // yyyy-mm-dd
                            const formatted = iso ? fromISO(iso) : '';
                            setData((prev: any) => ({ ...prev, incDate: formatted }));
                          }}
                          disabled={data.isLocked}
                          className={`flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0072bc] outline-none transition-all ${data.isLocked ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (data.isLocked) return;
                            const el = dateInputRef.current as any;
                            if (!el) return;
                            if (typeof el.showPicker === 'function') {
                              try { el.showPicker(); } catch { el.focus(); }
                            } else {
                              el.focus();
                            }
                          }}
                          aria-label="Open date picker"
                          disabled={data.isLocked}
                          className={`ml-2 p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors ${data.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={onClose}
                className="bg-[#0072bc] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#005a96] transition-all shadow-sm active:scale-95"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
