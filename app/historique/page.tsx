"use client";

import { useState, useEffect } from "react";
import { FileText, Trash2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

type Facture = {
  id: number;
  date: string;
  fournisseur: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  numero_facture: string;
  timestamp: string;
};

export default function HistoriquePage() {
  const [factures, setFactures] = useState<Facture[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("factures");
    if (stored) {
      setFactures(JSON.parse(stored));
    }
  }, []);

  const deleteFacture = (id: number) => {
    const updated = factures.filter((f) => f.id !== id);
    setFactures(updated);
    localStorage.setItem("factures", JSON.stringify(updated));
    toast.success("Facture supprimée");
  };

  const clearAll = () => {
    if (confirm("Supprimer tout l'historique ?")) {
      setFactures([]);
      localStorage.removeItem("factures");
      toast.success("Historique vidé");
    }
  };

  const exportAll = () => {
    if (factures.length === 0) return;
    const headers = "Date,Fournisseur,N° Facture,HT,TVA,TTC\n";
    const rows = factures
      .map(
        (f) =>
          `${f.date},${f.fournisseur},${f.numero_facture || ""},${f.montant_ht},${f.montant_tva},${f.montant_ttc}`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historique_factures_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success(`${factures.length} factures exportées`);
  };

  const totalTTC = factures.reduce((sum, f) => sum + f.montant_ttc, 0);

  return (
    <main className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <header className="mb-6 flex items-center gap-3">
        <a href="/" className="p-2 hover:bg-gray-200 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
      </header>

      {factures.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalTTC.toFixed(2)} €
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportAll}
                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                title="Exporter tout en CSV"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={clearAll}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                title="Vider l'historique"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {factures.length} facture(s)
          </p>
        </div>
      )}

      {factures.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune facture scannée</p>
          <a href="/" className="text-blue-600 text-sm mt-2 inline-block">
            Scanner une facture →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {factures.map((facture) => (
            <div
              key={facture.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {facture.fournisseur}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(facture.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {facture.montant_ttc.toFixed(2)} €
                  </p>
                  <p className="text-xs text-gray-500">TTC</p>
                </div>
              </div>

              <div className="flex gap-4 text-xs text-gray-600 mb-3">
                <span>HT: {facture.montant_ht.toFixed(2)} €</span>
                <span>TVA: {facture.montant_tva.toFixed(2)} €</span>
                {facture.numero_facture && (
                  <span>N°: {facture.numero_facture}</span>
                )}
              </div>

              <button
                onClick={() => deleteFacture(facture.id)}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
