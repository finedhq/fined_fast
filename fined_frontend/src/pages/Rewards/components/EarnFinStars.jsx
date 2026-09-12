import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiUsers, FiShare2, FiZap, FiBookOpen, FiCheck, FiCopy } from 'react-icons/fi';

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
          background: '#1e1b4b',
          color: '#fff',
          fontWeight: '600',
          fontSize: '14px',
          boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.4)',
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
          background: '#1e1b4b',
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

  return (
    <section className="earn-section">
      <div className="section-top-row">
        <div className="section-heading-group">
          <h2 className="section-title">Earn FinStars</h2>
          <p className="section-subtitle">
            Complete daily learning activities and invite peers to stack up your FinStars balance.
          </p>
        </div>
      </div>

      <div className="earn-grid">
        {/* 1. Refer a Friend */}
        <div className="earn-card">
          <div className="earn-card-badge">
            <span>+100</span>
            <img src="/dash-finstar.svg" alt="FinStars" className="earn-badge-star-img" />
          </div>
          <div>
            <div className="earn-card-icon-wrapper earn-icon-purple">
              <FiUsers />
            </div>
            <h3 className="earn-card-title">Refer a Friend</h3>
            <p className="earn-card-desc">
              Invite friends to FinEd. When they join and complete their first lesson, you both receive 100 FinStars!
            </p>
          </div>
          <button 
            className={`earn-action-btn ${copiedInvite ? 'copied' : ''}`}
            onClick={handleCopyInvite}
            type="button"
            id="copy-invite-link-btn"
            aria-label={copiedInvite ? "Invite link copied" : "Copy invite link"}
          >
            {copiedInvite ? (
              <>
                <FiCheck className="earn-btn-check-icon" size={16} />
                <span>Invite Link Copied!</span>
              </>
            ) : (
              <>
                <FiCopy size={15} />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Share an Article */}
        <div className="earn-card">
          <div className="earn-card-badge">
            <span>+20</span>
            <img src="/dash-finstar.svg" alt="FinStars" className="earn-badge-star-img" />
          </div>
          <div>
            <div className="earn-card-icon-wrapper earn-icon-emerald">
              <FiShare2 />
            </div>
            <h3 className="earn-card-title">Share an Article</h3>
            <p className="earn-card-desc">
              Share interesting financial articles and insights with friends or on LinkedIn to earn FinStars daily.
            </p>
          </div>
          <button 
            className="earn-action-btn secondary"
            onClick={() => navigate('/articles')}
            type="button"
          >
            Browse Articles
          </button>
        </div>

        {/* 3. 7-Day Streak Milestone */}
        <div className="earn-card">
          <div className="earn-card-badge">
            <span>+50</span>
            <img src="/dash-finstar.svg" alt="FinStars" className="earn-badge-star-img" />
          </div>
          <div>
            <div className="earn-card-icon-wrapper earn-icon-amber">
              <FiZap />
            </div>
            <h3 className="earn-card-title">7-Day Streak Bonus</h3>
            <p className="earn-card-desc">
              Build the habit of daily financial awareness. Maintain a 7-day learning streak to unlock a bonus reward.
            </p>
          </div>
          <button 
            className="earn-action-btn secondary"
            onClick={() => navigate('/courses')}
            type="button"
          >
            Continue Streak
          </button>
        </div>

        {/* 4. Complete Course Module */}
        <div className="earn-card">
          <div className="earn-card-badge">
            <span>+30</span>
            <img src="/dash-finstar.svg" alt="FinStars" className="earn-badge-star-img" />
          </div>
          <div>
            <div className="earn-card-icon-wrapper earn-icon-blue">
              <FiBookOpen />
            </div>
            <h3 className="earn-card-title">Finish Course Lessons</h3>
            <p className="earn-card-desc">
              Master interactive micro-lessons and pass module checkpoints to earn stars while boosting your FinScore.
            </p>
          </div>
          <button 
            className="earn-action-btn secondary"
            onClick={() => navigate('/courses')}
            type="button"
          >
            Explore Courses
          </button>
        </div>
      </div>
    </section>
  );
};

export default EarnFinStars;
