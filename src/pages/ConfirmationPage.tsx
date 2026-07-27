import { Link, useSearchParams } from 'react-router-dom';

/**
 * PAGE DE CONFIRMATION — /confirmation
 * -------------------------------------
 * Destination du redirect envoyé par l'Edge Function `confirm-order` après
 * avoir vérifié le jeton et mis à jour le statut de la commande en base.
 *
 * Pourquoi une redirection plutôt qu'une page HTML rendue directement par
 * l'Edge Function : Supabase ne sert pas de HTML depuis *.supabase.co sur
 * le plan gratuit (la réponse est toujours forcée en téléchargement texte).
 * Cette page vit donc sur le domaine normal du site (Vercel), qui n'a pas
 * cette restriction.
 *
 * Paramètres attendus dans l'URL :
 *   ?status=success|already|error&ref=ORY-XXXXXX&msg=...(optionnel)
 */
export default function ConfirmationPage() {
  const [params] = useSearchParams();
  const status = params.get('status') ?? 'error';
  const ref = params.get('ref');
  const msg = params.get('msg');

  const config = {
    success: {
      ok: true,
      title: 'Commande confirmée !',
      message: ref
        ? `Merci — votre commande ${ref} est confirmée et sera préparée pour l’expédition.`
        : 'Merci — votre commande est confirmée.',
    },
    already: {
      ok: true,
      title: 'Déjà traitée',
      message: msg ?? 'Cette commande a déjà été traitée — aucune action supplémentaire nécessaire.',
    },
    error: {
      ok: false,
      title: 'Lien invalide',
      message: msg ?? 'Ce lien de confirmation est invalide ou a expiré. Contactez-nous si le problème persiste.',
    },
  } as const;

  const { ok, title, message } = config[status as keyof typeof config] ?? config.error;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5EFEC',
        fontFamily: '-apple-system, Helvetica, Arial, sans-serif',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '100%',
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 2px 24px rgba(43,35,32,0.08)',
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 24,
            color: '#0C0C0E',
            marginBottom: 18,
          }}
        >
          ORYAM<span style={{ color: '#D68D9C' }}>.</span>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: ok ? '#1F8F5F1A' : '#B84C4C1A',
            color: ok ? '#1F8F5F' : '#B84C4C',
            fontSize: 28,
            lineHeight: '56px',
            margin: '0 auto 16px',
          }}
        >
          {ok ? '✓' : '✕'}
        </div>
        <h1 style={{ fontSize: 19, color: '#2B2320', margin: '0 0 8px' }}>{title}</h1>
        <p style={{ fontSize: 14, color: '#8A8480', lineHeight: 1.6, margin: 0 }}>{message}</p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: 24,
            fontSize: 13,
            color: '#B85C71',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ← Retour à la boutique
        </Link>
      </div>
    </div>
  );
}