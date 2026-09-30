import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PiArrowRightBold,
  PiBookOpenTextFill,
  PiCheckBold,
  PiCopyBold,
  PiLightningFill,
  PiShareNetworkFill,
  PiStarFill,
  PiUsersThreeFill,
} from 'react-icons/pi';

const EarnFinStars = ({ userEmail }) => {
  const navigate = useNavigate();
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleCopyInvite = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://myfined.com';
    const inviteLink = `${origin}/?ref=${encodeURIComponent(userEmail || 'fined-learner')}`;
    const logoUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? `${window.location.origin}/logo.ico` 
      : 'https://myfined.com/logo.ico';

    const plainText = 
`🎓 Join me on FinEd — Financial Education Made Simple! 🚀

Hey! I'm learning smart money habits, budgeting, and investing on FinEd. Use my exclusive invite link to get started:

👉 Join here: ${inviteLink}

🎁 Welcome Bonus & Rewards:
• Sign up and complete your 1st interactive lesson to earn +100 FinStars instantly!
• Redeem your FinStars for exclusive vouchers, rewards & brand discounts on the Rewards store! ⭐

Start your financial freedom journey:
🔗 ${inviteLink}`;

    const htmlText = 
`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; line-height: 1.5;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
    <img src="${logoUrl}" alt="FinEd Logo" width="36" height="36" style="vertical-align: middle; border-radius: 8px;" />
    <strong style="font-size: 16px; color: #4338CA;">FinEd — Financial Education Made Simple</strong>
  </div>
  <p>Hey! I'm learning smart money habits, budgeting, and investing on FinEd. Use my exclusive invite link to get started:</p>
  <p>👉 <a href="${inviteLink}" style="color: #4338CA; font-weight: bold; text-decoration: underline;">${inviteLink}</a></p>
  <p><strong>🎁 Welcome Bonus & Rewards:</strong><br/>
  ✨ Sign up and complete your 1st interactive lesson to receive <strong>+100 FinStars</strong>!<br/>
  ⭐ Redeem your FinStars for exclusive vouchers, rewards & brand discounts on the Rewards store!</p>
</div>`;

    const triggerCopiedFeedback = () => {
      setCopiedInvite(true);
      toast.success('Invite link & message copied! 🎁 Ready to share with friends.', {
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#171321',
          color: '#fff',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 10px 25px -5px rgba(65, 0, 188, 0.4)',
        },
        icon: '📋'
      });
      setTimeout(() => {
        setCopiedInvite(false);
      }, 3000);
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        if (typeof ClipboardItem !== 'undefined') {
          try {
            const blobPlain = new Blob([plainText], { type: 'text/plain' });
            const blobHtml = new Blob([htmlText], { type: 'text/html' });
            await navigator.clipboard.write([
              new ClipboardItem({
                'text/plain': blobPlain,
                'text/html': blobHtml,
              })
            ]);
            triggerCopiedFeedback();
            return;
          } catch (clipItemErr) {
            // Fallback to writeText if ClipboardItem fails
            await navigator.clipboard.writeText(plainText);
            triggerCopiedFeedback();
            return;
          }
        } else {
          await navigator.clipboard.writeText(plainText);
          triggerCopiedFeedback();
          return;
        }
      } else {
        fallbackCopy(plainText);
      }
    } catch (err) {
      fallbackCopy(plainText);
    }
  };

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedInvite(true);
      toast.success('Invite link & message copied! 🎁 Ready to share with friends.', {
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: '#171321',
          color: '#fff',
          fontWeight: '600',
        },
        icon: '📋'
      });
      setTimeout(() => {
        setCopiedInvite(false);
      }, 3000);
    } catch (e) {
      toast.error('Failed to copy invite link');
    }
  };

  const WAYS = [
    {
      key: 'refer',
      icon: <PiUsersThreeFill />,
      stars: 100,
      title: 'Refer a Friend',
      desc: 'Invite friends to FinEd. When they join and complete their first lesson, you both receive 100 FinStars!',
    },
    {
      key: 'share',
      icon: <PiShareNetworkFill />,
      stars: 20,
      title: 'Share an Article',
      desc: 'Share interesting financial articles and insights with friends or on LinkedIn to earn FinStars daily.',
      action: 'Browse Articles',
      to: '/articles',
    },
    {
      key: 'streak',
      icon: <PiLightningFill />,
      stars: 50,
      title: '7-Day Streak Bonus',
      desc: 'Build the habit of daily financial awareness. Maintain a 7-day learning streak to unlock a bonus reward.',
      action: 'Continue Streak',
      to: '/courses',
    },
    {
      key: 'lessons',
      icon: <PiBookOpenTextFill />,
      stars: 30,
      title: 'Finish Course Lessons',
      desc: 'Master interactive micro-lessons and pass module checkpoints to earn stars while boosting your FinScore.',
      action: 'Explore Courses',
      to: '/courses',
    },
  ];

  return (
    <section className="rw-section rw-earn" aria-labelledby="rw-earn-title">
      <h2 id="rw-earn-title" className="rw-section-title">Earn FinStars</h2>
      <p className="rw-section-sub">Complete daily learning activities and invite peers to stack up your FinStars balance.</p>

      <ul className="rw-panel rw-ways">
        {WAYS.map((way) => (
          <li key={way.key} className={`rw-way${way.key === 'refer' ? ' rw-way--featured' : ''}`}>
            <span className="rw-way-icon" aria-hidden="true">{way.icon}</span>
            <div className="rw-way-body">
              <div className="rw-way-head">
                <h3>{way.title}</h3>
                <span className="rw-stars-pill"><PiStarFill aria-hidden="true" /> +{way.stars}</span>
              </div>
              <p>{way.desc}</p>
              {way.key === 'refer' ? (
                <button
                  className={`rw-btn rw-btn--small${copiedInvite ? ' is-done' : ''}`}
                  onClick={handleCopyInvite}
                  type="button"
                  id="copy-invite-link-btn"
                  aria-label={copiedInvite ? "Invite link copied" : "Copy invite link"}
                >
                  {copiedInvite ? <><PiCheckBold aria-hidden="true" /> Invite Link Copied!</> : <><PiCopyBold aria-hidden="true" /> Copy Invite Link</>}
                </button>
              ) : (
                <button className="rw-ghost" onClick={() => navigate(way.to)} type="button">
                  {way.action} <PiArrowRightBold aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default EarnFinStars;
