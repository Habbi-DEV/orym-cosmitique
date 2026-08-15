import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ChevronDown,
  ChevronLeft,
  Home,
  Store,
  User,
  Check,
  TicketPercent,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useData } from '../context/DataContext';
import { useLang } from '../context/LanguageContext';
import { localizeProduct } from '../lib/i18n-product';
import { formatDA, scrollToId } from '../lib/format';
import { track } from '../lib/meta';

type Step = 1 | 2 | 3;

interface OrderSnapshot {
  ref: string;
  firstName: string;
  phone: string;
  wilaya: string;
  commune: string;
  total: number;
  shipping: number;
  discount: number;
}

const inputCls =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13.5px] outline-none transition placeholder:text-neutral-400 focus:border-blush focus:ring-2 focus:ring-blush/20';

export default function CheckoutModal() {
  const {
    checkoutOpen,
    closeCheckout,
    cart,
    updateQty,
    removeFromCart,
    clearCart,
    cartTotal,
    addToCart,
  } = useStore();
  const {
    getProduct,
    activeProducts,
    links,
    shipping: rates,
    validatePromo,
    createOrder,
    incrementPromoUsage,
  } = useData();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const steps = [t('checkout.stepPanier'), t('checkout.stepLivraison'), t('checkout.stepConfirmation')];

  const [step, setStep] = useState<Step>(1);
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [attempted, setAttempted] = useState(false);

  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  const [form, setForm] = useState({
    gender: 'madame' as 'madame' | 'monsieur',
    name: '',
    phone: '',
    wilaya: '',
    commune: '',
    delivery: 'domicile' as 'domicile' | 'stopdesk',
    address: '',
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    document.body.style.overflow = checkoutOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [checkoutOpen]);

  useEffect(() => {
    if (checkoutOpen) {
      setStep(1);
      setAttempted(false);
    }
  }, [checkoutOpen]);

  const wilaya = useMemo(
    () => rates.find((w) => String(w.code) === form.wilaya),
    [rates, form.wilaya],
  );
  const commune = useMemo(
    () => wilaya?.communes.find((co) => co.name === form.commune),
    [wilaya, form.commune],
  );

  const shipping = useMemo(() => {
    if (!wilaya || !commune) return null;
    return (form.delivery === 'domicile' ? wilaya.home : wilaya.stopdesk) + commune.extra;
  }, [wilaya, commune, form.delivery]);

  const discount = promoApplied?.discount ?? 0;
  const grandTotal = cartTotal - discount + (shipping ?? 0);

  // Suggestions "Complétez votre commande" — produits liés à ceux déjà dans
  // le panier (mêmes `links` que la section "Vous aimerez aussi" côté
  // produit), en excluant ce qui est déjà dans le panier ou en rupture.
  const crossSell = useMemo(() => {
    if (cart.length === 0) return [];
    const cartIds = new Set(cart.map((i) => i.id));
    const candidateIds = new Set<string>();
    for (const item of cart) {
      const p = getProduct(item.id);
      if (!p) continue;
      for (const relId of links[p.id] ?? p.related) candidateIds.add(relId);
    }
    return [...candidateIds]
      .filter((id) => !cartIds.has(id))
      .map((id) => activeProducts.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter((p) => p.inStock)
      .slice(0, 6);
  }, [cart, getProduct, links, activeProducts]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 3) e.name = t('checkout.errNom');
    const digits = form.phone.replace(/[\s.-]/g, '');
    if (!/^(?:\+213|0)(5|6|7)\d{8}$/.test(digits)) e.phone = t('checkout.errTel');
    if (!wilaya) e.wilaya = t('checkout.errWilaya');
    else if (!commune) e.commune = t('checkout.errCommune');
    if (form.delivery === 'domicile' && form.address.trim().length < 5)
      e.address = t('checkout.errAdresse');
    return e;
  }, [form, wilaya, commune, t]);

  const applyPromo = () => {
    if (!promoInput.trim()) return;
    const res = validatePromo(promoInput, cartTotal);
    if (res.ok) {
      setPromoApplied({ code: res.promo.code, discount: res.discount });
      setPromoError('');
    } else {
      setPromoApplied(null);
      setPromoError(res.message);
    }
  };

  const goToProducts = () => {
    closeCheckout();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollToId('produits'), 180);
    } else {
      setTimeout(() => scrollToId('produits'), 80);
    }
  };

  const confirmOrder = () => {
    setAttempted(true);
    if (Object.keys(errors).length > 0 || cart.length === 0) return;

    const items = cart
      .map((i) => {
        const p = getProduct(i.id);
        if (!p) return null;
        return { productId: p.id, name: p.name, price: p.price, qty: i.qty, image: p.images[0] };
      })
      .filter((i): i is NonNullable<typeof i> => Boolean(i));

    const created = createOrder({
      gender: form.gender,
      name: form.name.trim(),
      phone: form.phone,
      wilayaCode: wilaya?.code ?? 0,
      wilayaName: wilaya?.name ?? '',
      commune: form.commune,
      delivery: form.delivery,
      address: form.address.trim() || undefined,
      items,
      subtotal: cartTotal,
      shipping: shipping ?? 0,
      discount,
      total: grandTotal,
      promoCode: promoApplied?.code,
    });

    if (promoApplied) incrementPromoUsage(promoApplied.code);
    track('Purchase', {
      value: grandTotal,
      currency: 'DZD',
      content_ids: items.map((i) => i.productId),
      num_items: items.reduce((s, i) => s + i.qty, 0),
      order_ref: created.ref,
    });

    setOrder({
      ref: created.ref,
      firstName: form.name.trim().split(' ')[0],
      phone: form.phone,
      wilaya: wilaya?.name ?? '',
      commune: form.commune,
      total: grandTotal,
      shipping: shipping ?? 0,
      discount,
    });
    clearCart();
    setPromoApplied(null);
    setPromoInput('');
    setStep(3);
  };

  const goHomeLater = () => {
    if (location.pathname !== '/') navigate('/');
  };

  const label = (text: string) => (
    <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
      {text}
    </span>
  );

  return (
    <AnimatePresence>
      {checkoutOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCheckout}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[25px] bg-white shadow-2xl sm:max-w-md sm:rounded-[25px]"
          >
            {/* Header */}
            <div className="border-b border-neutral-100 px-5 pb-4 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {step === 2 && (
                    <button
                      onClick={() => setStep(1)}
                      aria-label={t('checkout.retourPanier')}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-cream"
                    >
                      <ChevronLeft size={16} className="rtl:rotate-180" />
                    </button>
                  )}
                  <h2 className="font-serif text-2xl font-semibold">
                    {step === 1 && t('checkout.panierTitle')}
                    {step === 2 && t('checkout.livraisonTitle')}
                    {step === 3 && t('checkout.confirmationTitle')}
                  </h2>
                </div>
                <button
                  onClick={closeCheckout}
                  aria-label={t('common.fermer')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-neutral-500 transition hover:bg-neutral-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Step indicator */}
              <div className="mt-4 flex items-center gap-1.5">
                {steps.map((labelStep, i) => {
                  const n = (i + 1) as Step;
                  const done = step > n;
                  const current = step === n;
                  return (
                    <div key={labelStep} className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition ${
                            done
                              ? 'bg-stockgreen text-white'
                              : current
                                ? 'bg-ink text-white'
                                : 'bg-neutral-100 text-neutral-400'
                          }`}
                        >
                          {done ? <Check size={11} /> : n}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${current ? 'text-ink' : 'text-neutral-400'}`}
                        >
                          {labelStep}
                        </span>
                      </div>
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

            {/* STEP 1 — CART */}
            {step === 1 && (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blush-soft text-blush">
                        <ShoppingBag size={26} />
                      </span>
                      <p className="mt-4 font-serif text-xl font-semibold">{t('checkout.panierVide')}</p>
                      <p className="mt-1 text-[13px] text-neutral-500">{t('checkout.panierVideSub')}</p>
                    </div>
                  ) : (
                    cart.map((item) => {
                      const p = getProduct(item.id);
                      if (!p) return null;
                      const view = localizeProduct(p, lang);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-3"
                        >
                          <img
                            src={p.images[0]}
                            alt={view.name}
                            className="h-16 w-16 shrink-0 rounded-xl bg-cream object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-serif text-[14.5px] font-semibold leading-tight">
                              {view.name}
                            </p>
                            <p className="mt-0.5 text-[12px] text-neutral-500">{formatDA(p.price)}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <div className="flex items-center gap-2.5 rounded-full border border-neutral-200 px-2 py-1">
                                <button
                                  aria-label="-"
                                  onClick={() => updateQty(item.id, item.qty - 1)}
                                  className="text-neutral-500 transition hover:text-ink active:scale-90"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-4 text-center text-[13px] font-bold">
                                  {item.qty}
                                </span>
                                <button
                                  aria-label="+"
                                  onClick={() => updateQty(item.id, item.qty + 1)}
                                  className="text-neutral-500 transition hover:text-ink active:scale-90"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                              <span className="text-[12.5px] font-bold text-blush">
                                {formatDA(p.price * item.qty)}
                              </span>
                            </div>
                          </div>
                          <button
                            aria-label="X"
                            onClick={() => removeFromCart(item.id)}
                            className="self-start p-1 text-neutral-300 transition hover:text-navred"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      );
                    })
                  )}

                  <button
                    onClick={goToProducts}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 py-3.5 text-[13px] font-semibold text-neutral-400 transition hover:border-blush hover:text-blush"
                  >
                    <Plus size={15} />
                    {t('checkout.ajouterAutreProduit')}
                  </button>

                  {crossSell.length > 0 && (
                    <div className="pt-1">
                      <p className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                        {t('checkout.completezCommande')}
                      </p>
                      <div
                        className="flex gap-2.5 overflow-x-auto pb-1"
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {crossSell.map((p) => {
                          const view = localizeProduct(p, lang);
                          return (
                            <div
                              key={p.id}
                              className="flex w-32 shrink-0 flex-col rounded-2xl border border-neutral-100 bg-white p-2.5"
                            >
                              <img
                                src={p.images[0]}
                                alt={view.name}
                                className="h-20 w-full rounded-xl bg-cream object-cover"
                              />
                              <p className="mt-2 line-clamp-2 text-[11.5px] font-semibold leading-tight">
                                {view.name}
                              </p>
                              <p className="mt-1 text-[11px] font-bold text-blush">
                                {formatDA(p.price)}
                              </p>
                              <button
                                onClick={() => {
                                  addToCart(p.id, 1);
                                  track('AddToCart', {
                                    content_ids: [p.id],
                                    value: p.price,
                                    currency: 'DZD',
                                  });
                                }}
                                className="mt-2 flex items-center justify-center gap-1 rounded-full bg-ink py-1.5 text-[10.5px] font-bold text-white transition hover:bg-black"
                              >
                                <Plus size={11} />
                                {t('checkout.ajouter')}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-100 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[13px] text-neutral-500">{t('checkout.sousTotal')}</span>
                    <span className="text-[15px] font-extrabold">{formatDA(cartTotal)}</span>
                  </div>
                  <button
                    disabled={cart.length === 0}
                    onClick={() => setStep(2)}
                    className={`w-full rounded-full py-3.5 text-[14px] font-bold transition active:scale-[0.98] ${
                      cart.length === 0
                        ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
                        : 'bg-ink text-white hover:bg-black'
                    }`}
                  >
                    {t('checkout.continuerLivraison')}
                  </button>
                </div>
              </>
            )}

            {/* STEP 2 — SHIPPING FORM */}
            {step === 2 && (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {/* Gender */}
                  <div>
                    {label(t('checkout.civilite'))}
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { v: 'madame', t: t('checkout.madame') },
                          { v: 'monsieur', t: t('checkout.monsieur') },
                        ] as const
                      ).map((g) => (
                        <button
                          key={g.v}
                          onClick={() => set('gender', g.v)}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-[13px] font-semibold transition ${
                            form.gender === g.v
                              ? 'border-ink bg-ink text-white'
                              : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300'
                          }`}
                        >
                          <User size={14} />
                          {g.t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    {label(t('checkout.nomComplet'))}
                    <input
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder={t('checkout.nomPlaceholder')}
                      className={inputCls}
                    />
                    {attempted && errors.name && (
                      <p className="mt-1 text-[11.5px] font-medium text-navred">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    {label(t('checkout.telephone'))}
                    <input
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder={t('checkout.telPlaceholder')}
                      inputMode="tel"
                      className={inputCls}
                    />
                    {attempted && errors.phone && (
                      <p className="mt-1 text-[11.5px] font-medium text-navred">{errors.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      {label(t('checkout.wilaya'))}
                      <div className="relative">
                        <select
                          value={form.wilaya}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, wilaya: e.target.value, commune: '' }));
                          }}
                          className={`${inputCls} appearance-none pr-9 ${form.wilaya === '' ? 'text-neutral-400' : ''}`}
                        >
                          <option value="">{t('checkout.choisir')}</option>
                          {rates.map((w) => (
                            <option key={w.code} value={String(w.code)}>
                              {String(w.code).padStart(2, '0')} — {w.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                      </div>
                      {attempted && errors.wilaya && (
                        <p className="mt-1 text-[11.5px] font-medium text-navred">{errors.wilaya}</p>
                      )}
                    </div>
                    <div>
                      {label(t('checkout.commune'))}
                      <div className="relative">
                        <select
                          value={form.commune}
                          disabled={!wilaya}
                          onChange={(e) => set('commune', e.target.value)}
                          className={`${inputCls} appearance-none pr-9 disabled:cursor-not-allowed disabled:bg-neutral-50 ${
                            form.commune === '' ? 'text-neutral-400' : ''
                          }`}
                        >
                          <option value="">
                            {wilaya ? t('checkout.choisir') : t('checkout.wilayaDabord')}
                          </option>
                          {wilaya?.communes.map((co) => (
                            <option key={co.name} value={co.name}>
                              {co.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                      </div>
                      {attempted && errors.commune && (
                        <p className="mt-1 text-[11.5px] font-medium text-navred">{errors.commune}</p>
                      )}
                    </div>
                  </div>

                  {/* Delivery type */}
                  <div>
                    {label(t('checkout.modeLivraison'))}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => set('delivery', 'domicile')}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition ${
                          form.delivery === 'domicile'
                            ? 'border-ink bg-cream ring-1 ring-ink'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-[13px] font-bold">
                          <Home size={14} /> {t('checkout.domicile')}
                        </span>
                        <span
                          className={`text-[12px] font-semibold ${wilaya ? 'text-blush' : 'text-neutral-400'}`}
                        >
                          {wilaya ? formatDA(wilaya.home) : '— DA'}
                        </span>
                      </button>
                      <button
                        onClick={() => set('delivery', 'stopdesk')}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition ${
                          form.delivery === 'stopdesk'
                            ? 'border-ink bg-cream ring-1 ring-ink'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-[13px] font-bold">
                          <Store size={14} /> {t('checkout.pointRelais')}
                        </span>
                        <span
                          className={`text-[12px] font-semibold ${wilaya ? 'text-blush' : 'text-neutral-400'}`}
                        >
                          {wilaya ? formatDA(wilaya.stopdesk) : '— DA'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {form.delivery === 'domicile' && (
                    <div>
                      {label(t('checkout.adresseComplete'))}
                      <input
                        value={form.address}
                        onChange={(e) => set('address', e.target.value)}
                        placeholder={t('checkout.adressePlaceholder')}
                        className={inputCls}
                      />
                      {attempted && errors.address && (
                        <p className="mt-1 text-[11.5px] font-medium text-navred">{errors.address}</p>
                      )}
                    </div>
                  )}

                  {/* Promo code */}
                  <div>
                    {label(t('checkout.codePromo'))}
                    {promoApplied ? (
                      <div className="flex items-center justify-between rounded-xl border border-stockgreen/40 bg-stock-soft px-4 py-3">
                        <span className="flex items-center gap-2 text-[13px] font-bold text-stockgreen">
                          <TicketPercent size={16} />
                          {promoApplied.code} {t('checkout.applique')}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="text-[13px] font-extrabold text-stockgreen">
                            -{formatDA(promoApplied.discount)}
                          </span>
                          <button
                            onClick={() => setPromoApplied(null)}
                            aria-label={t('checkout.retirerCode')}
                            className="text-stockgreen/60 transition hover:text-stockgreen"
                          >
                            <X size={15} />
                          </button>
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            setPromoError('');
                          }}
                          placeholder={t('checkout.promoPlaceholder')}
                          className={`${inputCls} uppercase`}
                        />
                        <button
                          onClick={applyPromo}
                          className="shrink-0 rounded-xl bg-ink px-4 text-[12.5px] font-bold text-white transition hover:bg-black active:scale-[0.97]"
                        >
                          {t('checkout.appliquerBtn')}
                        </button>
                      </div>
                    )}
                    {promoError && (
                      <p className="mt-1 text-[11.5px] font-medium text-navred">{promoError}</p>
                    )}
                  </div>

                  {/* Recap */}
                  <div className="rounded-2xl bg-cream p-4">
                    <div className="flex items-center justify-between text-[13px] text-neutral-500">
                      <span>{t('checkout.sousTotal')}</span>
                      <span className="font-semibold text-ink">{formatDA(cartTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="mt-1.5 flex items-center justify-between text-[13px] text-stockgreen">
                        <span>
                          {t('checkout.reduction')} ({promoApplied?.code})
                        </span>
                        <span className="font-semibold">-{formatDA(discount)}</span>
                      </div>
                    )}
                    <div className="mt-1.5 flex items-center justify-between text-[13px] text-neutral-500">
                      <span>
                        {t('checkout.livraisonLabel')}
                        {wilaya ? ` · ${wilaya.name}` : ''}
                      </span>
                      <span className="font-semibold text-ink">
                        {shipping !== null ? formatDA(shipping) : '—'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                      <span className="text-[13px] font-bold">{t('checkout.totalAPayer')}</span>
                      <motion.span
                        key={grandTotal}
                        initial={{ scale: 1.12, color: '#D68D9C' }}
                        animate={{ scale: 1, color: '#0C0C0E' }}
                        className="text-lg font-extrabold tracking-tight"
                      >
                        {formatDA(grandTotal)}
                      </motion.span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-neutral-400">{t('checkout.paiementEspeces')}</p>
                  </div>
                </div>

                <div className="border-t border-neutral-100 px-5 py-4">
                  <button
                    onClick={confirmOrder}
                    className="w-full rounded-full bg-blush py-3.5 text-[14px] font-bold text-white shadow-lg shadow-blush/30 transition hover:bg-blush-dark active:scale-[0.98]"
                  >
                    {t('checkout.commanderMaintenant')} · {formatDA(grandTotal)}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 — CONFIRMATION */}
            {step === 3 && order && (
              <div className="flex-1 overflow-y-auto px-5 py-8">
                <div className="flex flex-col items-center text-center">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-stock-soft"
                  >
                    <Check size={38} className="text-stockgreen" strokeWidth={2.6} />
                  </motion.span>
                  <h3 className="mt-5 font-serif text-[26px] font-semibold">
                    {t('checkout.merci')}, {order.firstName}
                  </h3>
                  <span className="mt-2 rounded-full bg-blush-soft px-4 py-1.5 text-[12px] font-bold tracking-wide text-[#8E4254]">
                    {t('checkout.reference')} : {order.ref}
                  </span>
                  <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-neutral-500">
                    {t('checkout.commandeRecuePre')}{' '}
                    <span className="font-semibold text-ink">{order.phone}</span>{' '}
                    {t('checkout.commandeRecuePost')} {order.commune}, {order.wilaya}.
                  </p>

                  <div className="mt-6 w-full rounded-2xl bg-cream p-4 text-[13px]">
                    <div className="flex justify-between text-neutral-500">
                      <span>{t('checkout.totalProduits')}</span>
                      <span className="font-semibold text-ink">
                        {formatDA(order.total - order.shipping + order.discount)}
                      </span>
                    </div>
                    {order.discount > 0 && (
                      <div className="mt-1.5 flex justify-between text-stockgreen">
                        <span>{t('checkout.reduction')}</span>
                        <span className="font-semibold">-{formatDA(order.discount)}</span>
                      </div>
                    )}
                    <div className="mt-1.5 flex justify-between text-neutral-500">
                      <span>{t('checkout.livraisonLabel')}</span>
                      <span className="font-semibold text-ink">{formatDA(order.shipping)}</span>
                    </div>
                    <div className="mt-3 flex justify-between border-t border-black/10 pt-3">
                      <span className="font-bold">{t('checkout.payeALaLivraison')}</span>
                      <span className="text-[15px] font-extrabold">{formatDA(order.total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      closeCheckout();
                      goHomeLater();
                    }}
                    className="mt-6 w-full rounded-full bg-ink py-3.5 text-[14px] font-bold text-white transition hover:bg-black active:scale-[0.98]"
                  >
                    {t('checkout.continuerAchats')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
