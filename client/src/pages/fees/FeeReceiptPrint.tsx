import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApiQuery } from '@/hooks/useApi';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface FeeReceipt {
  feeId: string; receiptNumber: string; paidAt: string; paidAmount: number; balance: number;
  amount: number; componentName: string; paymentMode: string; lateFine: number; remarks?: string;
  student: { name: string; admissionNumber: string; classId: string; };
  school: { name: string; address: string; phone: string; };
}

export default function FeeReceiptPrint() {
  const { feeId } = useParams<{ feeId: string }>();
  const { data: receipt, isLoading } = useApiQuery<FeeReceipt>(['receipt', feeId!], `/api/v1/fees/receipt/${feeId}`);

  if (isLoading) return <LoadingSpinner fullPage />;
  if (!receipt) return <div className="p-8 text-center text-muted-foreground">Receipt not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Actions — hidden in print */}
      <div className="flex gap-3 mb-6 print:hidden">
        <Link to="/fees"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" />Print Receipt</Button>
      </div>

      {/* Receipt Card */}
      <div className="border-2 border-gray-800 rounded-lg p-6 print:border-black font-mono text-sm" id="receipt">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase">{receipt.school?.name || 'School Name'}</h1>
          <p className="text-xs text-muted-foreground">{receipt.school?.address}</p>
          <p className="text-xs text-muted-foreground">Phone: {receipt.school?.phone}</p>
          <h2 className="text-lg font-bold mt-2 tracking-widest">FEE RECEIPT</h2>
        </div>

        {/* Receipt Meta */}
        <div className="grid grid-cols-2 gap-1 mb-4 text-xs">
          <span className="text-muted-foreground">Receipt No:</span><span className="font-bold">{receipt.receiptNumber}</span>
          <span className="text-muted-foreground">Date:</span><span>{formatDate(receipt.paidAt)}</span>
          <span className="text-muted-foreground">Payment Mode:</span><span className="capitalize">{receipt.paymentMode}</span>
        </div>

        {/* Student Info */}
        <div className="bg-muted/40 rounded p-3 mb-4 text-xs space-y-1">
          <div><span className="text-muted-foreground">Student Name: </span><span className="font-semibold">{receipt.student?.name}</span></div>
          <div><span className="text-muted-foreground">Admission No: </span><span>{receipt.student?.admissionNumber}</span></div>
          <div><span className="text-muted-foreground">Class: </span><span>{receipt.student?.classId}</span></div>
        </div>

        {/* Fee Details */}
        <table className="w-full text-xs mb-4">
          <thead><tr className="border-b border-gray-800"><th className="text-left py-1">Description</th><th className="text-right py-1">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b"><td className="py-1">{receipt.componentName}</td><td className="text-right py-1">{formatCurrency(receipt.amount)}</td></tr>
            {receipt.lateFine > 0 && <tr className="border-b"><td className="py-1 text-red-600">Late Fine</td><td className="text-right py-1 text-red-600">{formatCurrency(receipt.lateFine)}</td></tr>}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-bold">
              <td className="py-2">Amount Paid</td><td className="text-right py-2 text-green-700">{formatCurrency(receipt.paidAmount)}</td>
            </tr>
            {receipt.balance > 0 && (
              <tr className="text-red-600">
                <td className="py-1">Balance Due</td><td className="text-right py-1">{formatCurrency(receipt.balance)}</td>
              </tr>
            )}
          </tfoot>
        </table>

        {receipt.remarks && <p className="text-xs text-muted-foreground mb-4">Remarks: {receipt.remarks}</p>}

        {/* Footer */}
        <div className="border-t border-gray-400 pt-4 flex justify-between text-xs text-muted-foreground">
          <span>Computer generated receipt</span>
          <span>Authorised Signatory</span>
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } body { margin: 0; } }`}</style>
    </div>
  );
}
