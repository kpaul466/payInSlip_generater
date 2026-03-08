import React from 'react';
import { numberToIndianWords } from '../lib/currency-utils';
import { Scissors } from 'lucide-react';

interface PayInSlipProps {
  data: {
    date: string;
    bankName?: string;
    logo?: string;
    logoScale?: number;
    branchName: string;
    branchCode: string;
    panNo: string;
    incDate: string;
    beneficiary: string;
    accountNo: string;
    depositorOffice: string;
    officeCode: string;
    energyBill: string;
    others: string;
    denominations: Record<number | string, string>;
  };
}

export const PayInSlip = React.forwardRef<HTMLDivElement, PayInSlipProps>(({ data }, ref) => {
  const denoms = [500, 200, 100, 50, 20, 10, 'COIN'];
  const logoScale = data.logoScale || 1;
  const logoMap: Record<string, string> = {
    sbi: 'SBI_Logo.png',
    cbi: 'CBI_Logo.png',
    pnb: 'PNB_Logo.png',
  };
  const rawLogo = data.logo || '';
  const resolvedLogo = logoMap[rawLogo] || rawLogo;
  
  const calculateTotal = () => {
    let total = 0;
    denoms.forEach(d => {
      const count = parseInt(data.denominations[d] || '0');
      if (!isNaN(count)) {
        if (d === 'COIN') {
          total += count;
        } else {
          total += (d as number) * count;
        }
      }
    });
    return total;
  };

  const totalAmount = calculateTotal();
  const displayDate = data.date.padEnd(8, ' ').split('');
  const officeCodeChars = data.officeCode.padEnd(7, ' ').split('');

  const renderSlip = (title: string) => (
    <div className="w-[48%] border border-[#000000] p-4 text-[10px] font-sans bg-[#ffffff] text-[#000000] leading-tight">
      <div className="flex justify-between items-start mb-2">
        <div className="font-bold">PAY-IN-SLIP</div>
        <div className="text-right">
          <div>PAN NO.- {data.panNo}</div>
          <div>INCORPORATION DATE - {data.incDate}</div>
        </div>
      </div>

      <div className="flex items-left gap-4 mb-2">
        <div className="w-40 h-10 flex items-left justify-left shrink-0 overflow-hidden">
          {(!resolvedLogo || resolvedLogo === 'none') ? null : (
            (() => {
              // If resolvedLogo is a data URL or a public path/http URL, render an <img>
              if (typeof resolvedLogo === 'string' && (resolvedLogo.startsWith('data:') || resolvedLogo.startsWith('http') || /\.(png|jpe?g|svg|webp)$/i.test(resolvedLogo)) ) {
                return (
                  <img
                    src={resolvedLogo}
                    alt="Bank Logo"
                    className="w-auto h-auto object-contain"
                    style={{ transform: `scale(${logoScale})` }}
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                );
              }

              // fallback: render inline default SVG for predefined logos or missing files
              return (
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-contain" style={{ transform: `scale(${logoScale})` }}>
                  <circle cx="50" cy="50" r="50" fill="#0072bc" />
                  <text x="50" y="55" textAnchor="middle" fill="#ffffff" fontSize="35" fontWeight="bold" fontFamily="sans-serif">
                    {data.bankName ? data.bankName.substring(0, 1).toUpperCase() : 'B'}
                  </text>
                </svg>
              );
            })()
          )}
        </div>




        
        <div className="text-center flex-1">
          <div className="font-bold text-sm underline">{data.bankName || 'STATE BANK OF INDIA'}</div>
          <div className="font-semibold">{data.branchName}</div>
          <div>Code Bo-{data.branchCode}</div>
          <div className="font-bold mt-1">REVENUE COLLECTION</div>
        </div>
        <div className="font-bold text-[9px]">{title}</div>
      </div>

      <div className="mb-2">
        To The Credit of {data.beneficiary}.
      </div>

      <div className="flex border border-[#000000] mb-2">
        <div className="flex-1 border-r border-[#000000] p-1 font-bold text-center">Power Jyoti A/C No.</div>
        <div className="flex-1 p-1 text-center font-bold tracking-[0.5em]">{data.accountNo}</div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div>Deposited date:-</div>
        <div className="flex border-y border-l border-[#000000]">
          {displayDate.map((c, i) => (
            <div key={i} className="w-4 h-5 border-r border-[#000000] flex items-center justify-center font-bold">{c}</div>
          ))}
        </div>
      </div>

      <div className="mb-2 font-bold">
        Depositor (Electric Supply) Office Name : {data.depositorOffice}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div>Office Code :</div>
        <div className="flex border-y border-l border-[#000000]">
          {officeCodeChars.map((c, i) => (
            <div key={i} className="w-4 h-5 border-r border-[#000000] flex items-center justify-center font-bold">{c}</div>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <div>Nature of Collection:</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24">Energy Bill</div>
          <div className="flex-1 border-b border-dotted border-[#000000] h-4 flex items-end px-2">
            {data.energyBill && <span>RS {data.energyBill}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24">Others</div>
          <div className="flex-1 border-b border-dotted border-[#000000] h-4 flex items-end px-2">
            {data.others && <span>RS {data.others}</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center font-bold text-sm mb-4">
        <div>Total</div>
        <div className="flex-1 border-b border-dotted border-[#000000] mx-4 h-4"></div>
        <div>RS..................{totalAmount}/-..............</div>
      </div>

      <div className="mb-2">Deposit Reference: Cash</div>

      <table className="w-full border-collapse border border-[#000000] mb-4">
        <thead>
          <tr className="border-b border-[#000000]">
            <th className="border-r border-[#000000] p-1 text-left w-1/3">Perticulars of Notes</th>
            <th className="border-r border-[#000000] p-1 text-left w-1/6">No.s</th>
            <th className="border-r border-[#000000] p-1 text-right w-1/3">Amount</th>
            <th className="p-1 text-left">P.</th>
          </tr>
        </thead>
        <tbody>
          {denoms.map((d, i) => {
            const count = data.denominations[d] || '0';
            const amount = d === 'COIN' ? parseInt(count) || 0 : (d as number) * (parseInt(count) || 0);
            return (
              <tr key={i} className="border-b border-[#000000]">
                <td className="border-r border-[#000000] p-1">{d === 'COIN' ? 'COIN' : `${d} X`}</td>
                <td className="border-r border-[#000000] p-1 text-center font-bold">{count !== '0' ? count : ''}</td>
                <td className="border-r border-[#000000] p-1 text-right font-bold">{amount > 0 ? amount : ''}</td>
                <td className="p-1">.00</td>
              </tr>
            );
          })}
          <tr className="font-bold">
            <td className="border-r border-[#000000] p-1">TOTAL</td>
            <td className="border-r border-[#000000] p-1"></td>
            <td className="border-r border-[#000000] p-1 text-right">{totalAmount}</td>
            <td className="p-1">.00</td>
          </tr>
        </tbody>
      </table>

      <div className="mb-8">
        <div className="font-bold">Amount in Words:</div>
        <div className="italic">Rupees {numberToIndianWords(totalAmount)}</div>
      </div>

      <div className="flex justify-between items-end mt-8 pt-4">
        <div className="text-center border-t border-[#000000] pt-1 w-32">Depositor's Signature</div>
        <div className="text-center border-t border-[#000000] pt-1 w-32">Authorized Signatory of SBI</div>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="flex justify-between p-8 bg-[#ffffff] w-[1122px] h-[793px] mx-auto gap-8 shrink-0 relative">
      {renderSlip('DEPOSITOR COPY')}
      
      {/* Scissor / Cutting Mark */}
      <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col items-center justify-between py-4 pointer-events-none">
        <div className="w-[1px] h-full border-l border-dashed border-[#cbd5e1] relative">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-[#ffffff] p-1">
            <Scissors className="w-4 h-4 text-[#94a3b8] rotate-90" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 bg-[#ffffff] p-1">
            <Scissors className="w-4 h-4 text-[#94a3b8] rotate-90" />
          </div>
          <div className="absolute top-3/4 left-1/2 -translate-x-1/2 bg-[#ffffff] p-1">
            <Scissors className="w-4 h-4 text-[#94a3b8] rotate-90" />
          </div>
        </div>
      </div>

      {renderSlip('SBI OFFICE COPY')}
    </div>
  );
});

PayInSlip.displayName = 'PayInSlip';
