"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  Loader2,
  Download,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

type FormData = {
  date: string;
  fournisseur: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  numero_facture: string;
};

export default function Home() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData | null>(null);
  const [historyCount, setHistoryCount] = useState(0);

  // Chargement compteur historique
  useEffect(() => {
    const stored = localStorage.getItem("factures");
    if (stored) setHistoryCount(JSON.parse(stored).length);
  }, []);

  // Sauvegarde auto après scan
  useEffect(() => {
    if (data) {
      const history = JSON.parse(localStorage.getItem("factures") || "[]");
      history.unshift({
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("factures", JSON.stringify(history.slice(0, 50)));
      setHistoryCount(history.slice(0, 50).length);
    }
  }, [data]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
      setData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setLoading(true);

    // DEBUG : Affiche l'URL utilisée dans la console
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    console.log("=== DEBUG API URL ===");
    console.log("URL utilisée:", apiUrl);
    console.log("Variable brute:", process.env.NEXT_PUBLIC_API_URL);

    toast.info("Analyse en cours...", {
      description: "L'IA lit votre facture",
    });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });

      if (!res.ok) throw new Error();
      const result = await res.json();
      setData(result);
      toast.success("Facture extraite !", {
        description: `${result.fournisseur} - ${result.montant_ttc}€`,
      });

      // Notification spécifique pour le webhook auto
      toast.success("Sync Google Sheets", {
        description: "Données envoyées automatiquement",
      });
    } catch (err: any) {
      console.error("=== ERREUR SCAN ===");
      console.error("Message:", err.message);
      console.error("Cause:", err.cause);

      let errorMsg = "Vérifiez votre connexion";
      if (err.message.includes("Failed to fetch")) {
        errorMsg = "Impossible de joindre le serveur (vérifiez l'URL API)";
      } else if (err.message.includes("timeout")) {
        errorMsg = "Le serveur met trop de temps à répondre (cold start ?)";
      }

      toast.error("Échec de l'analyse", { description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    const csv = `Date,Fournisseur,N° Facture,HT,TVA,TTC\n${data.date},${data.fournisseur},${data.numero_facture || ""},${data.montant_ht},${data.montant_tva},${data.montant_ttc}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture_${data.fournisseur}_${data.date}.csv`;
    a.click();
    toast.success("CSV téléchargé");
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FactureScan</h1>
              <p className="text-xs text-slate-500 font-medium">
                Numérisation intelligente
              </p>
            </div>
          </div>
          <a href="/historique" className="group flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition">
              HISTORIQUE
            </span>
            <span className="text-lg font-bold text-slate-800">
              {historyCount}
            </span>
          </a>
        </header>

        {/* Zone de Capture */}
        {!data && (
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center relative overflow-hidden">
              <input
                type="file"
                id="camera-input"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
              />

              {imageBase64 ? (
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-slate-100">
                  <img
                    src={imageBase64}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setImageBase64(null)}
                    className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="camera-input"
                  className="cursor-pointer block py-12"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    Scanner une facture
                  </h3>
                  <p className="text-sm text-slate-500">
                    Appuyez pour prendre une photo
                    <br />
                    ou choisir dans la galerie
                  </p>
                </label>
              )}

              {imageBase64 && (
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Lancer l'extraction"
                  )}
                </button>
              )}
            </div>
            <p className="text-center text-xs text-slate-400 mt-6">
              Les données sont envoyées automatiquement à votre comptabilité
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-800">
              Analyse en cours...
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Cela peut prendre quelques secondes
            </p>
          </div>
        )}

        {/* Résultats */}
        {data && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Données extraites
                </h2>
                <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">
                  {data.date}
                </span>
              </div>

              <div className="p-6 space-y-5">
                {/* Fournisseur */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={data.fournisseur}
                    onChange={(e) =>
                      setData({ ...data, fournisseur: e.target.value })
                    }
                    className="w-full text-lg font-medium text-slate-900 bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none pb-1 transition-colors"
                  />
                </div>

                {/* Grille Montants */}
                <div className="grid grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total HT
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        value={data.montant_ht}
                        onChange={(e) =>
                          setData({
                            ...data,
                            montant_ht: parseFloat(e.target.value),
                          })
                        }
                        className="w-full text-2xl font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none pb-1"
                      />
                      <span className="text-slate-400 font-medium">€</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total TTC
                    </label>
                    <div className="flex items-baseline gap-1">
                      <input
                        type="number"
                        value={data.montant_ttc}
                        readOnly
                        className="w-full text-2xl font-bold text-blue-600 bg-transparent border-b border-transparent pb-1"
                      />
                      <span className="text-blue-400 font-medium">€</span>
                    </div>
                  </div>
                </div>

                {/* Détails secondaires */}
                <div className="pt-4 border-t border-dashed border-slate-200 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      N° Facture
                    </label>
                    <input
                      type="text"
                      value={data.numero_facture || ""}
                      onChange={(e) =>
                        setData({ ...data, numero_facture: e.target.value })
                      }
                      className="w-full text-sm font-medium text-slate-600 bg-slate-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      TVA
                    </label>
                    <input
                      type="number"
                      value={data.montant_tva}
                      onChange={(e) =>
                        setData({
                          ...data,
                          montant_tva: parseFloat(e.target.value),
                        })
                      }
                      className="w-full text-sm font-medium text-slate-600 bg-slate-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => {
                    setData(null);
                    setImageBase64(null);
                  }}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm"
                >
                  Nouveau scan
                </button>
                <button
                  onClick={exportToCSV}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 transition shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exporter CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
