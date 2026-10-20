"use client";
import { useState } from "react";
import {
  Camera,
  Loader2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type ErrorDetail = {
  type_erreur: string;
  citation?: string;
  explication: string;
  suggestion: string;
};

type CorrectionData = {
  note: number;
  appreciation_generale: string;
  points_forts: string[];
  axes_amelioration: string[];
  erreurs_details: ErrorDetail[];
  structure_evaluee: string;
};

export default function CorrectionPage() {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CorrectionData | null>(null);

  // Paramètres pédagogiques persistants pour le mode rafale
  const [sujet, setSujet] = useState("");
  const [bareme, setBareme] = useState(20);

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
    if (!imageBase64 || !sujet.trim()) {
      toast.error("Informations manquantes", {
        description: "Merci d'ajouter une photo ET le sujet de la copie.",
      });
      return;
    }

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/correct-copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          matiere: "Français",
          consigne: sujet,
          bareme: bareme,
        }),
      });

      if (!res.ok) throw new Error("Erreur serveur");
      const result = await res.json();
      setData(result);

      toast.success("Copie corrigée !", {
        description: `Note estimée : ${result.note}/${bareme}`,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Échec de la correction", {
        description: "Vérifiez votre connexion ou réessayez plus tard.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mode Rafale : Garde le sujet et le barème en mémoire
  const resetForNextCopy = () => {
    setData(null);
    setImageBase64(null);
  };

  // Nouveau Sujet : Réinitialise tout
  const resetAll = () => {
    setData(null);
    setImageBase64(null);
    setSujet("");
    setBareme(20);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-md mx-auto min-h-screen flex flex-col p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pt-2">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Correcteur IA
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Lettres Modernes
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-indigo-600 transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> RETOUR
          </Link>
        </header>

        {/* Zone de Saisie (si pas de résultat) */}
        {!data && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sujet & Barème */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Sujet / Consigne
                </label>
                <textarea
                  value={sujet}
                  onChange={(e) => setSujet(e.target.value)}
                  placeholder="Ex: Commentaire composé sur 'Le Lac' de Lamartine..."
                  className="w-full text-sm font-medium text-slate-900 bg-slate-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-100 focus:outline-none resize-none h-24 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Barème
                </span>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
                  <input
                    type="number"
                    value={bareme}
                    onChange={(e) => setBareme(Number(e.target.value))}
                    className="w-12 text-right text-sm font-bold text-indigo-600 bg-transparent focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">/ 20</span>
                </div>
              </div>
            </div>

            {/* Capture Photo */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 text-center relative overflow-hidden">
              <input
                type="file"
                id="copy-input"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
              />

              {imageBase64 ? (
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-slate-100 border border-slate-200">
                  <img
                    src={imageBase64}
                    alt="Preview Copie"
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
                  htmlFor="copy-input"
                  className="cursor-pointer block py-12"
                >
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">
                    Photographier la copie
                  </h3>
                  <p className="text-sm text-slate-500">
                    Assurez-vous que l'écriture est nette et bien éclairée
                  </p>
                </label>
              )}

              {imageBase64 && (
                <button
                  onClick={handleScan}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Correction en
                      cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" /> Lancer la correction
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-2">
              ⚠️ RGPD : Les images sont traitées à la volée et ne sont jamais
              stockées.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <h3 className="text-lg font-semibold text-slate-800">
              Analyse pédagogique...
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs">
              L'IA évalue la structure, l'argumentation et l'expression.
            </p>
          </div>
        )}

        {/* Résultats Pédagogiques */}
        {data && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            {/* Carte Note Principale */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-center text-white">
                <p className="text-xs font-medium opacity-80 uppercase tracking-widest mb-1">
                  Note Attribuée
                </p>
                <div className="text-5xl font-bold tracking-tighter">
                  {data.note}
                  <span className="text-2xl opacity-60">/{bareme}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <PenLine className="w-3 h-3" /> Appréciation Générale
                  </label>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {data.appreciation_generale}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Structure Évaluée
                  </label>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {data.structure_evaluee}
                  </p>
                </div>
              </div>
            </div>

            {/* Points Forts & Axes d'amélioration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100">
                <h4 className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Points Forts
                </h4>
                <ul className="space-y-2">
                  {data.points_forts.map((pt, i) => (
                    <li
                      key={i}
                      className="text-xs text-green-800 font-medium flex gap-2"
                    >
                      <span className="text-green-500">•</span> {pt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100">
                <h4 className="text-xs font-bold text-orange-700 uppercase mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> À Améliorer
                </h4>
                <ul className="space-y-2">
                  {data.axes_amelioration.map((ax, i) => (
                    <li
                      key={i}
                      className="text-xs text-orange-800 font-medium flex gap-2"
                    >
                      <span className="text-orange-500">•</span> {ax}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Détail des Erreurs */}
            {data.erreurs_details.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" /> Analyse
                  Détaillée
                </h3>
                <div className="space-y-3">
                  {data.erreurs_details.map((err, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-red-200 pl-4 py-1"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">
                          {err.type_erreur}
                        </span>
                        {err.citation && (
                          <span className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                            "{err.citation}"
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium mb-1">
                        {err.explication}
                      </p>
                      <p className="text-xs text-indigo-600 bg-indigo-50/50 p-2 rounded-lg">
                        💡 {err.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Finales - Mode Rafale vs Nouveau Sujet */}
            <div className="pt-4 pb-8 grid grid-cols-2 gap-3">
              {/* Bouton 1 : Nouvelle copie (Garde le sujet et le barème) */}
              <button
                onClick={resetForNextCopy}
                className="flex flex-col items-center justify-center py-4 rounded-xl font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition gap-2"
              >
                <Camera className="w-5 h-5" />
                <span className="text-sm">Même sujet</span>
                <span className="text-[10px] font-normal opacity-70">
                  Mode rafale
                </span>
              </button>

              {/* Bouton 2 : Changer de sujet (Réinitialise TOUT) */}
              <button
                onClick={resetAll}
                className="flex flex-col items-center justify-center py-4 rounded-xl font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition gap-2"
              >
                <PenLine className="w-5 h-5" />
                <span className="text-sm">Nouveau sujet</span>
                <span className="text-[10px] font-normal opacity-70">
                  Tout effacer
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
