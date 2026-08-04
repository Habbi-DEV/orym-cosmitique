import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
  ImageIcon,
  Star,
  Link2,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  Megaphone,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';
import { marginOf, type CatalogProduct, type Variant } from '../lib/types';
import { formatDA, promoPercent } from '../lib/format';
import { isSupabaseConfigured } from '../lib/supabase';
import { uploadProductImages } from '../lib/storage';

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

// ----------------------------- FORM MODAL -----------------------------
interface FormState {
  id: string;
  name: string;
  type: 'produit' | 'pack';
  category: string;
  shortDesc: string;
  description: string;
  ingredients: string;
  usage: string;
  images: string[];
  price: number;
  oldPrice: number;
  costPrice: number;
  stock: number;
  variants: Variant[];
  linkIds: string[];
  rating: number;
  reviews: number;
  isActive: boolean;
}

const blankForm: FormState = {
  id: '',
  name: '',
  type: 'produit',
  category: 'Autres',
  shortDesc: '',
  description: '',
  ingredients: '',
  usage: '',
  images: [],
  price: 0,
  oldPrice: 0,
  costPrice: 0,
  stock: 10,
  variants: [],
  linkIds: [],
  rating: 5,
  reviews: 0,
  isActive: true,
};

const FORM_STEPS = ['Infos générales', 'Images', 'Prix & Variantes', 'Cross-selling'];

function ProductFormModal({
  initial,
  onClose,
}: {
  initial: CatalogProduct | null;
  onClose: () => void;
}) {
  const { catalog, links, upsertProduct } = useData();
  const { showToast } = useStore();
  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>(() =>
    initial
      ? {
          id: initial.id,
          name: initial.name,
          type: initial.type,
          category: initial.category || 'Autres',
          shortDesc: initial.shortDesc,
          description: initial.description,
          ingredients: initial.ingredients,
          usage: initial.usage,
          images: [...initial.images],
          price: initial.price,
          oldPrice: initial.oldPrice ?? 0,
          costPrice: initial.costPrice,
          stock: initial.stock,
          variants: [...initial.variants],
          linkIds: links[initial.id] ?? initial.related,
          rating: initial.rating,
          reviews: initial.reviews,
          isActive: initial.isActive,
        }
      : { ...blankForm, id: '' },
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const readFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;

    // Production : upload vers Supabase Storage (bucket public `product-images`)
    if (isSupabaseConfigured) {
      showToast('Upload vers Supabase Storage\u2026');
      void uploadProductImages(list).then((urls) => {
        if (urls.length === 0) {
          showToast('Upload échoué — vérifiez le bucket \u00ab product-images \u00bb');
          return;
        }
        setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
        showToast(`${urls.length} image(s) publiée(s) — URL publique enregistrée`);
      });
      return;
    }

    // Mode démo : fallback dataURL local
    void Promise.all(
      list.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          }),
      ),
    ).then((urls) => {
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
      showToast(`${urls.length} image(s) haute résolution ajoutée(s)`);
    });
  };

  const makeCover = (i: number) =>
    setForm((f) => {
      const imgs = [...f.images];
      const [cover] = imgs.splice(i, 1);
      return { ...f, images: [cover, ...imgs] };
    });

  const removeImage = (i: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));

  const margin = marginOf(form.price || 0, form.costPrice || 0);

  const canNext = () => {
    if (step === 1) return form.name.trim().length >= 3;
    if (step === 2) return form.images.length >= 1;
    if (step === 3) return form.price > 0;
    return true;
  };

  const save = () => {
    const id =
      initial?.id ??
      `${form.type}-${form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'produit'}-${Math.floor(Math.random() * 900 + 100)}`;
    const product: CatalogProduct = {
      id,
      name: form.name.trim(),
      type: form.type,
      category: form.category.trim() || 'Autres',
      price: Math.round(form.price),
      oldPrice: form.oldPrice > form.price ? Math.round(form.oldPrice) : undefined,
      images: form.images,
      shortDesc: form.shortDesc.trim() || form.description.trim().slice(0, 90),
      description: form.description.trim() || form.shortDesc.trim(),
      ingredients: form.ingredients.trim() || 'Formule déposée Oryam — liste INCI disponible sur demande.',
      usage: form.usage.trim() || 'Appliquer selon les recommandations de la fiche produit.',
      inStock: form.stock > 0,
      rating: form.rating,
      reviews: form.reviews,
      promo: form.oldPrice > form.price,
      related: form.linkIds,
      stock: Math.round(form.stock),
      costPrice: Math.round(form.costPrice),
      isActive: form.isActive,
      variants: form.variants,
      packItems: initial?.packItems,
    };
    upsertProduct(product, form.linkIds);
    showToast(initial ? 'Produit mis à jour' : 'Produit publié en boutique');
    onClose();
  };

  const linkCandidates = catalog.filter(
    (p) =>
      p.id !== form.id &&
      p.name.toLowerCase().includes(linkSearch.trim().toLowerCase()),
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[25px] bg-white shadow-2xl sm:max-w-2xl sm:rounded-[25px]"
      >
        {/* Header */}
        <div className="border-b border-neutral-100 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold">
              {initial ? 'Modifier le produit' : 'Nouveau produit'}
            </h2>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-neutral-500 hover:bg-neutral-200"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            {FORM_STEPS.map((s, i) => {
              const n = i + 1;
              const current = step === n;
              const done = step > n;
              return (
                <div key={s} className="flex flex-1 flex-col gap-1.5">
                  <span
                    className={`text-[9.5px] font-bold uppercase tracking-wide ${
                      current ? 'text-ink' : 'text-neutral-400'
                    }`}
                  >
                    {n}. {s}
                  </span>
                  <div
                    className={`h-1 rounded-full transition ${
                      done ? 'bg-stockgreen' : current ? 'bg-blush' : 'bg-neutral-100'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Type de produit
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: 'produit', t: 'Produit', d: 'Soin individuel — tag bleu' },
                      { v: 'pack', t: 'Pack / Coffret', d: 'Ensemble de soins — tag violet' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.v}
                      onClick={() => set('type', t.v)}
                      className={`rounded-xl border p-3.5 text-left transition ${
                        form.type === t.v
                          ? t.v === 'pack'
                            ? 'border-violetp bg-violetp-soft ring-1 ring-violetp'
                            : 'border-tagblue bg-blue-50 ring-1 ring-tagblue'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className="text-[13px] font-bold">{t.t}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-500">{t.d}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Nom du produit *
                </p>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ex : Sérum Éclat — Vitamine C"
                  className={inputCls}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Catégorie
                </p>
                <input
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Ex : Sérums, Crèmes, Huiles…"
                  list="categories-existantes"
                  className={inputCls}
                />
                <datalist id="categories-existantes">
                  {[...new Set(catalog.map((p) => p.category).filter(Boolean))].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Description courte (carte)
                </p>
                <input
                  value={form.shortDesc}
                  onChange={(e) => set('shortDesc', e.target.value)}
                  placeholder="Une phrase accrocheuse pour la fiche produit"
                  className={inputCls}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Description complète
                </p>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  placeholder="Bénéfices, texture, résultats…"
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Ingrédients
                  </p>
                  <textarea
                    value={form.ingredients}
                    onChange={(e) => set('ingredients', e.target.value)}
                    rows={3}
                    placeholder="Liste INCI…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Conseils d’utilisation
                  </p>
                  <textarea
                    value={form.usage}
                    onChange={(e) => set('usage', e.target.value)}
                    rows={3}
                    placeholder="Mode d’emploi…"
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP 2 — IMAGES */}
          {step === 2 && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  readFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed py-10 text-center transition ${
                  dragOver ? 'border-blush bg-blush-soft/50' : 'border-neutral-200 hover:border-blush/60'
                }`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-soft text-blush">
                  <Upload size={22} />
                </span>
                <p className="mt-3 text-[13.5px] font-bold">
                  Glissez vos images haute résolution ici
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">
                  ou cliquez pour parcourir — PNG, JPG jusqu’à 10 Mo
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) readFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {form.images.map((img, i) => (
                    <div
                      key={i}
                      className={`group relative overflow-hidden rounded-2xl border-2 ${
                        i === 0 ? 'border-blush' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="" className="aspect-square w-full bg-cream object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-blush px-2 py-0.5 text-[9px] font-bold text-white">
                          <Star size={9} className="fill-current" /> Cover
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition group-hover:opacity-100">
                        {i !== 0 && (
                          <button
                            onClick={() => makeCover(i)}
                            title="Définir comme cover"
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink"
                          >
                            <Star size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => removeImage(i)}
                          title="Supprimer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-navred text-white"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {form.images.length === 0 && (
                <p className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
                  <ImageIcon size={14} /> Au moins une image est requise pour publier.
                </p>
              )}
            </>
          )}

          {/* STEP 3 — PRIX & VARIANTES */}
          {step === 3 && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Prix de vente (DA) *
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={form.price || ''}
                    onChange={(e) => set('price', Number(e.target.value))}
                    placeholder="2 850"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Ancien prix (promo)
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={form.oldPrice || ''}
                    onChange={(e) => set('oldPrice', Number(e.target.value))}
                    placeholder="3 500"
                    className={inputCls}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Prix d’achat (coût)
                  </p>
                  <input
                    type="number"
                    min={0}
                    value={form.costPrice || ''}
                    onChange={(e) => set('costPrice', Number(e.target.value))}
                    placeholder="1 600"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-4">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                    Marge
                  </p>
                  <p
                    className={`text-xl font-extrabold ${margin < 25 ? 'text-navred' : 'text-stockgreen'}`}
                  >
                    {form.price > 0 ? `${margin}%` : '—'}
                  </p>
                </div>
                <div className="h-8 w-px bg-black/10" />
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                    Bénéfice / unité
                  </p>
                  <p className="text-xl font-extrabold">
                    {form.price > 0 ? formatDA(Math.max(0, form.price - form.costPrice)) : '—'}
                  </p>
                </div>
                {promoPercent(form.price, form.oldPrice) && (
                  <>
                    <div className="h-8 w-px bg-black/10" />
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                        Remise affichée
                      </p>
                      <p className="text-xl font-extrabold text-navred">
                        -{promoPercent(form.price, form.oldPrice)}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Stock initial
                </p>
                <input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => set('stock', Number(e.target.value))}
                  className={`${inputCls} max-w-[160px]`}
                />
              </div>

              {/* Variants */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Variantes (taille, format…)
                  </p>
                  <button
                    onClick={() =>
                      set('variants', [
                        ...form.variants,
                        { id: `v-${Date.now()}`, name: '', price: 0, stock: 5 },
                      ])
                    }
                    className="flex items-center gap-1 text-[11.5px] font-bold text-blush hover:underline"
                  >
                    <Plus size={13} /> Ajouter une variante
                  </button>
                </div>
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-2">
                      <input
                        value={v.name}
                        onChange={(e) =>
                          set(
                            'variants',
                            form.variants.map((x, xi) =>
                              xi === i ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Ex : 100 ml"
                        className={`${inputCls} flex-1`}
                      />
                      <input
                        type="number"
                        min={0}
                        value={v.price || ''}
                        onChange={(e) =>
                          set(
                            'variants',
                            form.variants.map((x, xi) =>
                              xi === i ? { ...x, price: Number(e.target.value) } : x,
                            ),
                          )
                        }
                        placeholder="+ DA"
                        className={`${inputCls} w-24`}
                      />
                      <input
                        type="number"
                        min={0}
                        value={v.stock}
                        onChange={(e) =>
                          set(
                            'variants',
                            form.variants.map((x, xi) =>
                              xi === i ? { ...x, stock: Number(e.target.value) } : x,
                            ),
                          )
                        }
                        placeholder="Stock"
                        className={`${inputCls} w-20`}
                      />
                      <button
                        onClick={() =>
                          set(
                            'variants',
                            form.variants.filter((_, xi) => xi !== i),
                          )
                        }
                        aria-label="Supprimer la variante"
                        className="text-neutral-300 transition hover:text-navred"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  {form.variants.length === 0 && (
                    <p className="rounded-xl border border-dashed border-neutral-200 py-3 text-center text-[12px] text-neutral-400">
                      Aucune variante — le produit sera vendu en format unique.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 4 — CROSS-SELL */}
          {step === 4 && (
            <>
              <div className="rounded-2xl bg-violetp-soft/60 p-4">
                <p className="flex items-center gap-2 text-[12.5px] font-bold text-violetp-dark">
                  <Link2 size={15} />
                  Souvent achetés ensemble — {form.linkIds.length} produit(s) lié(s)
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-violetp-dark/70">
                  Ces produits s’afficheront dans la section « Vous aimerez aussi » de la
                  fiche boutique.
                </p>
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder="Rechercher un produit à lier…"
                  className={`${inputCls} pl-10`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {linkCandidates.map((p) => {
                  const selected = form.linkIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        set(
                          'linkIds',
                          selected
                            ? form.linkIds.filter((x) => x !== p.id)
                            : [...form.linkIds, p.id],
                        )
                      }
                      className={`relative overflow-hidden rounded-2xl border-2 text-left transition ${
                        selected ? 'border-violetp ring-1 ring-violetp' : 'border-transparent hover:border-neutral-200'
                      }`}
                    >
                      <img src={p.images[0]} alt="" className="aspect-square w-full bg-cream object-cover" />
                      {selected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-violetp text-white">
                          <Check size={12} />
                        </span>
                      )}
                      <p className="truncate bg-white px-2 py-1.5 text-[10.5px] font-semibold">
                        {p.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-bold transition ${
              step === 1 ? 'invisible' : 'text-neutral-500 hover:text-ink'
            }`}
          >
            <ChevronLeft size={15} /> Précédent
          </button>
          {step < 4 ? (
            <button
              onClick={() => {
                if (!canNext()) {
                  showToast(
                    step === 1
                      ? 'Le nom du produit est requis (3 caractères min.)'
                      : step === 2
                        ? 'Ajoutez au moins une image'
                        : 'Le prix de vente doit être supérieur à 0',
                  );
                  return;
                }
                setStep((s) => Math.min(4, s + 1));
              }}
              className="flex items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 text-[12.5px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
            >
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={save}
              className="flex items-center gap-2 rounded-full bg-blush px-6 py-2.5 text-[12.5px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
            >
              <Check size={15} />
              {initial ? 'Enregistrer les modifications' : 'Publier le produit'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ----------------------------- PAGE -----------------------------
export default function AdminProducts() {
  const { catalog, links, deleteProduct, setProductActive } = useData();
  const { showToast } = useStore();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      catalog.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())),
    [catalog, query],
  );

  // Lien de campagne (page /lp/:id sans navigation, pensée pour les publicités
  // Facebook/Instagram) — copié dans le presse-papiers pour coller direct
  // dans le gestionnaire de pub.
  const copyLandingLink = (p: CatalogProduct) => {
    const url = `${window.location.origin}/lp/${p.id}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => showToast('Lien de campagne copié \u2014 prêt à coller dans vos publicités'))
      .catch(() => showToast('Impossible de copier le lien \u2014 copiez-le manuellement : ' + url));
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blush">Catalogue</p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Produits
          </h1>
          <p className="mt-1 text-[13px] text-neutral-500">
            {catalog.filter((p) => p.isActive).length} actifs · {catalog.length} au total
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-full bg-blush px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
        >
          <Plus size={16} />
          Nouveau produit
        </button>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-11 pr-4 text-[13px] outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/20"
        />
      </div>

      <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_2px_18px_rgba(12,12,14,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-black/5 bg-cream/60 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                <th className="px-5 py-3.5">Produit</th>
                <th className="px-4 py-3.5">Prix</th>
                <th className="px-4 py-3.5">Coût / Marge</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Liens</th>
                <th className="px-4 py-3.5">Visible</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.map((p) => {
                const low = p.stock <= 8;
                return (
                  <tr key={p.id} className="transition hover:bg-cream/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl bg-cream object-cover"
                        />
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-[13px] font-bold">{p.name}</p>
                          <span
                            className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9.5px] font-bold text-white ${
                              p.type === 'pack' ? 'bg-violetp' : 'bg-tagblue'
                            }`}
                          >
                            {p.type === 'pack' ? 'Pack' : 'Produit'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-extrabold">{formatDA(p.price)}</p>
                      {p.oldPrice && (
                        <p className="text-[10.5px] text-neutral-400 line-through">
                          {formatDA(p.oldPrice)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[12px] text-neutral-500">{formatDA(p.costPrice)}</p>
                      <p
                        className={`text-[11.5px] font-bold ${
                          marginOf(p.price, p.costPrice) < 25 ? 'text-navred' : 'text-stockgreen'
                        }`}
                      >
                        {marginOf(p.price, p.costPrice)}% marge
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          low ? 'bg-red-100 text-navred' : 'bg-stock-soft text-stockgreen'
                        }`}
                      >
                        {low && <AlertTriangle size={11} />}
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[12px] font-semibold text-violetp-dark">
                        <Link2 size={13} />
                        {links[p.id]?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setProductActive(p.id, !p.isActive);
                          showToast(
                            p.isActive
                              ? `${p.name} masqué de la boutique`
                              : `${p.name} visible en boutique`,
                          );
                        }}
                        aria-label="Basculer la visibilité"
                        className={`relative h-6 w-11 rounded-full transition ${
                          p.isActive ? 'bg-stockgreen' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                            p.isActive ? 'left-[22px]' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyLandingLink(p)}
                          aria-label="Copier le lien de campagne (Landing Page)"
                          title="Copier le lien de campagne (Landing Page)"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-violetp hover:text-violetp"
                        >
                          <Megaphone size={13} />
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          aria-label="Modifier"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-ink hover:text-ink"
                        >
                          <Pencil size={13} />
                        </button>
                        {confirmDelete === p.id ? (
                          <button
                            onClick={() => {
                              deleteProduct(p.id);
                              setConfirmDelete(null);
                              showToast(`${p.name} supprimé`);
                            }}
                            className="flex h-8 items-center gap-1 rounded-lg bg-navred px-2.5 text-[10.5px] font-bold text-white"
                          >
                            <Trash2 size={12} /> Confirmer
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmDelete(p.id);
                              setTimeout(() => setConfirmDelete((c) => (c === p.id ? null : c)), 3500);
                            }}
                            aria-label="Supprimer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition hover:border-navred hover:text-navred"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-10 text-center text-[13px] text-neutral-400">
            Aucun produit trouvé.
          </p>
        )}
      </div>

      <AnimatePresence>
        {(creating || editing) && (
          <ProductFormModal
            key={editing?.id ?? 'new'}
            initial={editing}
            onClose={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center gap-2 text-[11.5px] text-neutral-400">
        <Package size={13} />
        Les modifications sont enregistrées directement dans Supabase et visibles
        par les clients au prochain chargement de la boutique.
      </div>
    </div>
  );
}
