import { useState, useEffect, useRef } from "react";
import { postArticle, fetchAuthors, uploadArticleImage } from "../../services/api";
import { useNavigate } from "react-router-dom";

function AdminArticleForm() {
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    description: "",
    seo_title: "",
    meta_description: "",
    tag: "Deep Dives",
    author_id: "",
    reviewer_id: ""
  });
  const [authors, setAuthors] = useState([]);
  const [headerImageFile, setHeaderImageFile] = useState(null);
  const [headerImagePreview, setHeaderImagePreview] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit"); // 'edit' or 'preview'

  // Publishing & Scheduling State
  const [publicationStatus, setPublicationStatus] = useState("published"); // 'published', 'scheduled', 'draft'
  const [scheduledAt, setScheduledAt] = useState("");

  // AI Personal Lens & Pre-Reading Metadata State
  const [editorSummary, setEditorSummary] = useState("");
  const [metadataJson, setMetadataJson] = useState("");
  const [metadataError, setMetadataError] = useState("");

  // Article Questions State
  const [questions, setQuestions] = useState([
    {
      question: "How familiar are you with this topic?",
      display_order: 1,
      optionsJson: JSON.stringify(
        [
          "Never heard of it",
          "Follow general news and debates",
          "Actively researching / investing",
          "Expert / Professional"
        ],
        null,
        2
      ),
      optionsError: ""
    }
  ]);

  const SAMPLE_METADATA_TEMPLATE = JSON.stringify(
    {
      difficulty: "Intermediate",
      readingTime: "7 min read",
      targetAudience: "Salaried employees, everyday retail investors",
      keyConcepts: ["Diversification", "Index Tracking", "Expense Ratio"],
      importantSections: [
        "What Is the Core Concept?",
        "Why Does It Matter Today?",
        "Key Practical Takeaways"
      ]
    },
    null,
    2
  );

  const STANDARD_4_QUESTIONS_TEMPLATE = [
    {
      question: "How familiar are you with this topic?",
      display_order: 1,
      optionsJson: JSON.stringify(
        [
          "Never heard of it before",
          "Follow general news & basics",
          "Actively researching or practicing",
          "Advanced / Professional context"
        ],
        null,
        2
      ),
      optionsError: ""
    },
    {
      question: "What is your main goal for reading this article?",
      display_order: 2,
      optionsJson: JSON.stringify(
        [
          "Actionable steps for my personal portfolio",
          "Understanding macroeconomic & industry impact",
          "Evaluating risks, traps, and drawbacks",
          "Curiosity & general financial literacy"
        ],
        null,
        2
      ),
      optionsError: ""
    },
    {
      question: "What is your current professional / financial context?",
      display_order: 3,
      optionsJson: JSON.stringify(
        [
          "Student or early career (< 3 years in workforce)",
          "Salaried professional / corporate employee",
          "Business owner, freelancer, or self-employed",
          "Mid-to-late career / Planning retirement"
        ],
        null,
        2
      ),
      optionsError: ""
    },
    {
      question: "What is your single biggest question or hesitation?",
      display_order: 4,
      optionsJson: JSON.stringify(
        [
          "What could go wrong and how do I protect downside?",
          "How much capital do I need to actually begin?",
          "What are the hidden fees, taxes, or trade-offs?",
          "Which platforms / methods are safest to use?"
        ],
        null,
        2
      ),
      optionsError: ""
    }
  ];

  // Inline images uploader state
  const [inlineFile, setInlineFile] = useState(null);
  const [inlineFilePreview, setInlineFilePreview] = useState("");
  const [inlineSubtitle, setInlineSubtitle] = useState("");
  const [uploadingInline, setUploadingInline] = useState(false);
  const [inlineUploadError, setInlineUploadError] = useState("");
  const [sessionImages, setSessionImages] = useState([]);

  const ARTICLE_TAGS = [
    "Personal Finance",
    "IPO",
    "Investing",
    "Deep Dives",
    "Economy",
  ];

  useEffect(() => {
    fetchAuthors().then(setAuthors).catch(console.error);
  }, []);

  const handleMetadataChange = (val) => {
    setMetadataJson(val);
    if (!val.trim()) {
      setMetadataError("");
      return;
    }
    try {
      JSON.parse(val);
      setMetadataError("");
    } catch (err) {
      setMetadataError(err.message);
    }
  };

  const handleInsertTemplate = () => {
    setMetadataJson(SAMPLE_METADATA_TEMPLATE);
    setMetadataError("");
  };

  const handleBeautifyMetadata = () => {
    if (!metadataJson.trim()) return;
    try {
      const parsed = JSON.parse(metadataJson);
      setMetadataJson(JSON.stringify(parsed, null, 2));
      setMetadataError("");
    } catch (err) {
      setMetadataError(`Cannot format: ${err.message}`);
    }
  };

  // Question handlers
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: "",
        display_order: prev.length + 1,
        optionsJson: JSON.stringify(["Option A", "Option B", "Option C", "Option D"], null, 2),
        optionsError: ""
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuestions((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((q, i) => ({ ...q, display_order: i + 1 }));
    });
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const item = { ...updated[idx], [field]: value };
      if (field === "optionsJson") {
        if (!value.trim()) {
          item.optionsError = "";
        } else {
          try {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) {
              item.optionsError = "Options must be a JSON array: [\"Option 1\", \"Option 2\"]";
            } else {
              item.optionsError = "";
            }
          } catch (err) {
            item.optionsError = err.message;
          }
        }
      }
      updated[idx] = item;
      return updated;
    });
  };

  const handleBeautifyQuestionOptions = (idx) => {
    const q = questions[idx];
    if (!q || !q.optionsJson.trim()) return;
    try {
      const parsed = JSON.parse(q.optionsJson);
      handleQuestionChange(idx, "optionsJson", JSON.stringify(parsed, null, 2));
    } catch (err) {
      // ignore
    }
  };

  const handleLoadTemplateQuestions = () => {
    setQuestions(STANDARD_4_QUESTIONS_TEMPLATE);
  };

  // Handle header cover image preview
  const handleHeaderImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setHeaderImageFile(file);
    if (file) {
      setHeaderImagePreview(URL.createObjectURL(file));
    } else {
      setHeaderImagePreview("");
    }
  };

  // Handle inline image selection
  const handleInlineFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setInlineFile(file);
    setInlineUploadError("");
    if (file) {
      setInlineFilePreview(URL.createObjectURL(file));
      if (!inlineSubtitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setInlineSubtitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    } else {
      setInlineFilePreview("");
    }
  };

  // Helper to insert markdown tag into content at cursor position
  const insertTextAtCursor = (textToInsert) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: prev.content ? `${prev.content}\n\n${textToInsert}` : textToInsert }));
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const currentVal = form.content;
    const updated = currentVal.substring(0, start) + textToInsert + currentVal.substring(end);

    setForm((prev) => ({ ...prev, content: updated }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 50);
  };

  // Handle Uploading an inline image to Supabase and inserting into content
  const handleUploadAndInsertInlineImage = async (insertAtEnd = false) => {
    if (!inlineFile) {
      setInlineUploadError("Please choose an image file from your computer first.");
      return;
    }

    setUploadingInline(true);
    setInlineUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", inlineFile);
      if (inlineSubtitle) formData.append("subtitle", inlineSubtitle);
      if (form.title) formData.append("title", form.title);

      const res = await uploadArticleImage(formData);
      const uploadedUrl = res.url;
      const subtitleText = inlineSubtitle.trim() || res.filename || "Figure illustration";
      const markdownTag = `\n\n![${subtitleText}](${uploadedUrl})\n\n`;

      if (insertAtEnd) {
        setForm((prev) => ({ ...prev, content: `${prev.content.trim()}${markdownTag}`.trim() }));
      } else {
        insertTextAtCursor(markdownTag);
      }

      setSessionImages((prev) => [
        {
          url: uploadedUrl,
          subtitle: subtitleText,
          filename: res.filename
        },
        ...prev
      ]);

      setInlineFile(null);
      setInlineFilePreview("");
      setInlineSubtitle("");
      const inlineInput = document.getElementById("inline-image-file-input");
      if (inlineInput) inlineInput.value = "";
    } catch (err) {
      setInlineUploadError(err.message || "Failed to upload image to Supabase Storage.");
    } finally {
      setUploadingInline(false);
    }
  };

  // Toolbar helper actions
  const handleToolbarAction = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end) || "text";

    let inserted = "";
    switch (type) {
      case "bold":
        inserted = `**${selectedText}**`;
        break;
      case "italic":
        inserted = `*${selectedText}*`;
        break;
      case "h2":
        inserted = `\n\n## ${selectedText}\n`;
        break;
      case "h3":
        inserted = `\n\n### ${selectedText}\n`;
        break;
      case "quote":
        inserted = `\n> ${selectedText}\n`;
        break;
      case "list":
        inserted = `\n- ${selectedText}\n`;
        break;
      case "link":
        inserted = `[${selectedText}](https://example.com)`;
        break;
      default:
        return;
    }
    insertTextAtCursor(inserted);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const formData = new FormData();
    formData.append("title", form.title);
    if (form.slug) formData.append("slug", form.slug);
    formData.append("content", form.content);
    formData.append("description", form.description);
    if (form.seo_title) formData.append("seo_title", form.seo_title);
    if (form.meta_description) formData.append("meta_description", form.meta_description);
    formData.append("tag", form.tag);
    if (form.author_id) formData.append("author_id", form.author_id);
    if (form.reviewer_id) formData.append("reviewer_id", form.reviewer_id);
    if (headerImageFile) formData.append("image", headerImageFile);

    // Status & Scheduling
    formData.append("status", publicationStatus);
    if (publicationStatus === "scheduled" && scheduledAt) {
      const isoDate = new Date(scheduledAt).toISOString();
      formData.append("scheduled_at", isoDate);
    }

    // AI Personal Lens & Metadata JSON
    if (editorSummary) formData.append("editor_summary", editorSummary);
    if (metadataJson.trim()) {
      try {
        JSON.parse(metadataJson);
      } catch (err) {
        setMetadataError(`Invalid JSON: ${err.message}`);
        setStatus("⚠️ Please fix the JSON syntax errors in the Metadata section before submitting.");
        setSaving(false);
        return;
      }
      formData.append("metadata", metadataJson.trim());
    }

    // Article Questions (JSON format)
    const validQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) continue;
      let parsedOptions = [];
      if (q.optionsJson.trim()) {
        try {
          parsedOptions = JSON.parse(q.optionsJson);
          if (!Array.isArray(parsedOptions)) {
            parsedOptions = [parsedOptions];
          }
        } catch (err) {
          setStatus(`⚠️ Question #${i + 1} has invalid Options JSON: ${err.message}`);
          setSaving(false);
          return;
        }
      }
      validQuestions.push({
        question: q.question.trim(),
        options: parsedOptions,
        display_order: parseInt(q.display_order) || (i + 1)
      });
    }
    if (validQuestions.length > 0) {
      formData.append("questions", JSON.stringify(validQuestions));
    }

    try {
      await postArticle(formData);
      setForm({
        title: "",
        slug: "",
        content: "",
        description: "",
        seo_title: "",
        meta_description: "",
        tag: "Deep Dives",
        author_id: form.author_id,
        reviewer_id: ""
      });
      setHeaderImageFile(null);
      setHeaderImagePreview("");
      setSessionImages([]);
      setEditorSummary("");
      setMetadataJson("");
      setMetadataError("");
      setScheduledAt("");
      setPublicationStatus("published");
      setQuestions([
        {
          question: "How familiar are you with this topic?",
          display_order: 1,
          optionsJson: JSON.stringify(
            [
              "Never heard of it",
              "Follow general news and debates",
              "Actively researching / investing",
              "Expert / Professional"
            ],
            null,
            2
          ),
          optionsError: ""
        }
      ]);
      event.target.reset();
      
      const successMsg = publicationStatus === "scheduled"
        ? `⏰ Article scheduled successfully for ${new Date(scheduledAt).toLocaleString()}!`
        : publicationStatus === "draft"
        ? "📝 Article saved as draft!"
        : "✅ Article published successfully!";
      setStatus(successMsg);
    } catch (err) {
      setStatus(err.message || "Failed to post article.");
    } finally {
      setSaving(false);
    }
  };

  // Helper parser for live preview
  const parsePreviewBlocks = (content) => {
    if (!content) return [];
    return content.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean).map((text, i) => {
      const imgMatch = /^\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(text);
      if (imgMatch) {
        const altOrLabel = imgMatch[1] || "";
        const url = imgMatch[2];
        const title = imgMatch[3] || "";
        let subtitle = title || altOrLabel;
        if (altOrLabel.includes("|")) {
          subtitle = altOrLabel.split("|")[1]?.trim() || altOrLabel;
        }
        return { isImage: true, url, subtitle, id: `prev-img-${i}` };
      }
      if (text.startsWith("### ")) {
        return { isH3: true, text: text.substring(4), id: `prev-h3-${i}` };
      }
      if (text.startsWith("## ")) {
        return { isH2: true, text: text.substring(3), id: `prev-h2-${i}` };
      }
      return { isP: true, text, id: `prev-p-${i}` };
    });
  };

  return (
    <main className="admin-editor-container">
      {/* TOP HEADER BAR */}
      <div className="admin-editor-topbar">
        <div>
          <div className="admin-editor-breadcrumb">
            <span className="link" onClick={() => navigate("/admin")}>Admin</span>
            <span>/</span>
            <span className="link" onClick={() => navigate("/admin/articles")}>Articles</span>
            <span>/</span>
            <span>New Article</span>
          </div>
          <h1 className="admin-editor-title">Create New Article</h1>
          <p className="admin-editor-subtitle">
            Write, format, embed illustrations, and schedule educational articles.
          </p>
        </div>

        <div className="admin-editor-top-actions">
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => navigate("/admin/articles")}
          >
            ← Back to Articles
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ padding: "8px 20px", fontSize: "14px" }}
            onClick={() => {
              const formEl = document.getElementById("admin-article-form");
              if (formEl) formEl.requestSubmit();
            }}
            disabled={saving}
          >
            {saving ? "Publishing..." : publicationStatus === "scheduled" ? "⏰ Schedule Article" : publicationStatus === "draft" ? "📝 Save Draft" : "🚀 Publish Article"}
          </button>
        </div>
      </div>

      {status && (
        <div style={{
          marginBottom: "20px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: status.startsWith("⚠️") ? "#fef2f2" : "#f0fdf4",
          border: status.startsWith("⚠️") ? "1px solid #fecaca" : "1px solid #bbf7d0",
          color: status.startsWith("⚠️") ? "#b91c1c" : "#15803d",
          fontSize: "14px",
          fontWeight: "600",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{status}</span>
          <button
            type="button"
            onClick={() => setStatus("")}
            style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontWeight: "700" }}
          >
            ✕
          </button>
        </div>
      )}

      <form id="admin-article-form" onSubmit={handleSubmit}>
        <div className="admin-editor-grid">
          {/* MAIN COLUMN (LEFT) */}
          <div className="admin-editor-main">
            {/* Card 1: Article Content & Basics */}
            <div className="admin-card-refined">
              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  <span>Article Title</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Required</span>
                </label>
                <input
                  name="title"
                  className="admin-input-refined title-input"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g., How the Stock Market Actually Works"
                  required
                />
                <div className="admin-slug-badge">
                  <span>URL:</span>
                  <code>/articles/{form.slug || (form.title ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : "custom-slug")}</code>
                </div>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  <span>Custom Description</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>Preview cards</span>
                </label>
                <textarea
                  name="description"
                  className="admin-textarea-refined"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="2-3 line summary displayed on homepage cards..."
                  rows={2}
                  style={{ minHeight: "72px", resize: "vertical" }}
                />
              </div>

              {/* EDITOR & PREVIEW TABS */}
              <div style={{ marginTop: "20px" }}>
                <div className="admin-tab-header">
                  <div className="admin-tab-buttons">
                    <button
                      type="button"
                      className={`admin-tab-btn ${activeTab === "edit" ? "active" : ""}`}
                      onClick={() => setActiveTab("edit")}
                    >
                      ✏️ Write Content
                    </button>
                    <button
                      type="button"
                      className={`admin-tab-btn ${activeTab === "preview" ? "active" : ""}`}
                      onClick={() => setActiveTab("preview")}
                    >
                      👁️ Live Preview
                    </button>
                  </div>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Markdown supported
                  </span>
                </div>

                {activeTab === "edit" ? (
                  <div>
                    <div className="editor-toolbar">
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("bold")} title="Bold">
                        <strong>B</strong>
                      </button>
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("italic")} title="Italic">
                        <em>I</em>
                      </button>
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("h2")} title="Heading 2">
                        H2
                      </button>
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("h3")} title="Heading 3">
                        H3
                      </button>
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("quote")} title="Blockquote">
                        ” Quote
                      </button>
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("list")} title="Bullet List">
                        • List
                      </button>
                      <button type="button" className="toolbar-btn" onClick={() => handleToolbarAction("link")} title="Hyperlink">
                        🔗 Link
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      name="content"
                      className="admin-textarea-refined"
                      value={form.content}
                      onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                      placeholder={`Write your article markdown content here...\n\n## Section Heading\nExplain financial principles clearly.\n\n![Figure 1: Custom subtitle or caption](https://supabase-image-url.png)\n\nContinue writing further insights.`}
                      rows={16}
                      required
                      style={{
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                        minHeight: "360px"
                      }}
                    />
                  </div>
                ) : (
                  <div className="admin-live-preview-pane">
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#4f46e5", letterSpacing: "1px", textTransform: "uppercase" }}>
                        {form.tag}
                      </span>
                      <h1 style={{ fontSize: "26px", color: "#0f172a", margin: "8px 0" }}>
                        {form.title || "Untitled Article"}
                      </h1>
                      <p style={{ color: "#64748b", fontSize: "15px", maxWidth: "640px", margin: "0 auto" }}>
                        {form.description || "Article preview description will appear here..."}
                      </p>
                    </div>

                    {headerImagePreview && (
                      <div style={{ marginBottom: "20px", borderRadius: "8px", overflow: "hidden", maxHeight: "280px" }}>
                        <img src={headerImagePreview} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}

                    <div className="preview-body-blocks">
                      {parsePreviewBlocks(form.content).map((b) => {
                        if (b.isImage) {
                          return (
                            <figure key={b.id} className="preview-figure">
                              <img src={b.url} alt={b.subtitle} className="preview-img" />
                              {b.subtitle && <figcaption className="preview-caption">{b.subtitle}</figcaption>}
                            </figure>
                          );
                        }
                        if (b.isH2) {
                          return <h2 key={b.id} className="preview-h2">{b.text}</h2>;
                        }
                        if (b.isH3) {
                          return <h3 key={b.id} className="preview-h3">{b.text}</h3>;
                        }
                        return <p key={b.id} className="preview-p">{b.text}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Inline Images Uploader */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <h3 className="admin-card-title">
                  <span>🎨 Body Images &amp; Subtitles</span>
                </h3>
                <span style={{ fontSize: "11px", background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: "12px", fontWeight: "600" }}>
                  Supabase Storage
                </span>
              </div>

              <div className="admin-inline-upload-grid">
                <div>
                  <label className="admin-label-refined" style={{ marginBottom: "4px" }}>
                    Select Image File
                  </label>
                  <input
                    id="inline-image-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleInlineFileChange}
                    style={{ fontSize: "13px", padding: "8px 10px", width: "100%", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                  />
                </div>

                <div>
                  <label className="admin-label-refined" style={{ marginBottom: "4px" }}>
                    Image Subtitle / Caption
                  </label>
                  <input
                    type="text"
                    className="admin-input-refined"
                    value={inlineSubtitle}
                    onChange={(e) => setInlineSubtitle(e.target.value)}
                    placeholder="e.g., Figure 1: Flowchart breakdown"
                    style={{ padding: "8px 12px", fontSize: "13.5px" }}
                  />
                </div>
              </div>

              {inlineFilePreview && (
                <div className="admin-inline-preview-row">
                  <img src={inlineFilePreview} alt="Selected preview" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                      {inlineFile?.name} ({(inlineFile?.size / 1024).toFixed(1)} KB)
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>
                      Subtitle: "{inlineSubtitle || "No subtitle specified"}"
                    </p>
                  </div>
                </div>
              )}

              {inlineUploadError && (
                <p style={{ margin: "10px 0 0 0", color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>
                  ⚠️ {inlineUploadError}
                </p>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="admin-upload-btn"
                  onClick={() => handleUploadAndInsertInlineImage(false)}
                  disabled={uploadingInline || !inlineFile}
                >
                  {uploadingInline ? "Uploading..." : "🚀 Upload & Insert at Cursor"}
                </button>

                <button
                  type="button"
                  className="admin-upload-btn secondary"
                  onClick={() => handleUploadAndInsertInlineImage(true)}
                  disabled={uploadingInline || !inlineFile}
                >
                  ➕ Upload &amp; Append to End
                </button>
              </div>

              {sessionImages.length > 0 && (
                <div className="admin-session-gallery">
                  <span style={{ display: "block", marginBottom: "8px", fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                    Uploaded this session ({sessionImages.length}):
                  </span>
                  <div className="admin-session-gallery-list">
                    {sessionImages.map((img, idx) => (
                      <div key={idx} className="admin-gallery-card">
                        <img src={img.url} alt={img.subtitle} />
                        <div className="admin-gallery-info">
                          <span className="admin-gallery-subtitle">{img.subtitle}</span>
                          <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                            <button
                              type="button"
                              className="admin-gallery-mini-btn"
                              onClick={() => insertTextAtCursor(`\n\n![${img.subtitle}](${img.url})\n\n`)}
                              title="Insert into text at cursor"
                            >
                              ➕ Insert
                            </button>
                            <button
                              type="button"
                              className="admin-gallery-mini-btn"
                              onClick={() => {
                                navigator.clipboard.writeText(`![${img.subtitle}](${img.url})`);
                                alert("Copied image markdown tag!");
                              }}
                              title="Copy Markdown tag"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Article Questions (Pre-Reading Questionnaire) */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <div>
                  <h3 className="admin-card-title">
                    <span>❓ Article Questions (Pre-Reading Questionnaire)</span>
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                    Questions asked to readers before reading to personalize the AI takeaway lens.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    style={{ padding: "4px 10px", fontSize: "12px" }}
                    onClick={handleLoadTemplateQuestions}
                    title="Load standard 4 FinEd questionnaire blueprint"
                  >
                    📋 Load 4-Question Template
                  </button>
                  <button
                    type="button"
                    className="admin-upload-btn"
                    style={{ padding: "4px 10px", fontSize: "12px" }}
                    onClick={handleAddQuestion}
                  >
                    ➕ Add Question
                  </button>
                </div>
              </div>

              {questions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#64748b", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: "0 0 10px 0", fontSize: "13.5px" }}>No questions added for this article yet.</p>
                  <button
                    type="button"
                    className="admin-upload-btn"
                    style={{ fontSize: "12.5px", padding: "6px 14px" }}
                    onClick={handleLoadTemplateQuestions}
                  >
                    ⚡ Load Standard 4 Questions
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "14px",
                        position: "relative"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", background: "#e0e7ff", color: "#4338ca", padding: "2px 8px", borderRadius: "12px" }}>
                            Question #{idx + 1}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Display Order:</span>
                            <input
                              type="number"
                              min="1"
                              value={q.display_order}
                              onChange={(e) => handleQuestionChange(idx, "display_order", e.target.value)}
                              style={{ width: "54px", padding: "2px 6px", fontSize: "12px", borderRadius: "4px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleBeautifyQuestionOptions(idx)}
                            style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                            title="Format JSON options"
                          >
                            ⚡ Format JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                            title="Delete this question"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>

                      <div className="admin-field-refined" style={{ marginBottom: "10px" }}>
                        <label className="admin-label-refined">
                          <span>Question Text</span>
                        </label>
                        <input
                          type="text"
                          className="admin-input-refined"
                          value={q.question}
                          onChange={(e) => handleQuestionChange(idx, "question", e.target.value)}
                          placeholder="e.g., How familiar are you with ETF investing?"
                          style={{ fontSize: "13.5px", padding: "8px 12px" }}
                        />
                      </div>

                      <div className="admin-field-refined" style={{ marginBottom: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <label className="admin-label-refined" style={{ margin: 0 }}>
                            <span>Options (JSONB array)</span>
                          </label>
                          {q.optionsJson.trim() && (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: q.optionsError ? "#dc2626" : "#16a34a" }}>
                              {q.optionsError ? `⚠️ Invalid Options JSON` : `✅ Valid JSON Array`}
                            </span>
                          )}
                        </div>
                        <textarea
                          value={q.optionsJson}
                          onChange={(e) => handleQuestionChange(idx, "optionsJson", e.target.value)}
                          placeholder={`[\n  "Beginner (Just starting out)",\n  "Intermediate (Read a few books)",\n  "Advanced (Actively managing money)"\n]`}
                          rows={4}
                          style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            fontSize: "12px",
                            background: "#0f172a",
                            color: "#f8fafc",
                            border: q.optionsError ? "1.5px solid #ef4444" : "1px solid #334155",
                            borderRadius: "6px",
                            padding: "8px 10px",
                            lineHeight: "1.4",
                            whiteSpace: "pre",
                            width: "100%",
                            boxSizing: "border-box"
                          }}
                        />
                        {q.optionsError && (
                          <span style={{ fontSize: "11.5px", color: "#dc2626", marginTop: "2px", display: "block" }}>
                            ⚠️ {q.optionsError}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR COLUMN (RIGHT) */}
          <div className="admin-editor-sidebar">
            {/* Sidebar Card 1: Publishing & Status */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <h3 className="admin-card-title">
                  <span>🚀 Publishing Status</span>
                </h3>
              </div>

              <div className="admin-status-segmented">
                <button
                  type="button"
                  className={`admin-segmented-btn ${publicationStatus === "published" ? "active" : ""}`}
                  onClick={() => setPublicationStatus("published")}
                >
                  ● Published
                </button>
                <button
                  type="button"
                  className={`admin-segmented-btn ${publicationStatus === "scheduled" ? "active" : ""}`}
                  onClick={() => setPublicationStatus("scheduled")}
                >
                  ⏰ Scheduled
                </button>
                <button
                  type="button"
                  className={`admin-segmented-btn ${publicationStatus === "draft" ? "active" : ""}`}
                  onClick={() => setPublicationStatus("draft")}
                >
                  📝 Draft
                </button>
              </div>

              {publicationStatus === "scheduled" && (
                <div style={{ marginTop: "14px", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <label className="admin-label-refined" style={{ marginBottom: "4px" }}>
                    Release Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    className="admin-input-refined"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    required={publicationStatus === "scheduled"}
                    style={{ fontSize: "13px", padding: "6px 10px" }}
                  />
                  <span style={{ display: "block", fontSize: "11px", color: "#6366f1", marginTop: "4px" }}>
                    Auto-publishes when local time arrives.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="primary-btn"
                style={{ width: "100%", marginTop: "16px", padding: "10px", fontSize: "14px" }}
                disabled={saving}
              >
                {saving ? "Publishing Article..." : publicationStatus === "scheduled" ? "⏰ Schedule Article" : publicationStatus === "draft" ? "📝 Save Draft" : "🚀 Publish Article"}
              </button>
            </div>

            {/* Sidebar Card 2: Organization & Author */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <h3 className="admin-card-title">
                  <span>🏷️ Organization</span>
                </h3>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  Category / Tag
                </label>
                <select
                  name="tag"
                  className="admin-select-refined"
                  value={form.tag}
                  onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))}
                  required
                >
                  {ARTICLE_TAGS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  Author (Optional)
                </label>
                <select
                  name="author_id"
                  className="admin-select-refined"
                  value={form.author_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, author_id: event.target.value }))}
                >
                  <option value="">-- No Author --</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  Reviewed By (Optional)
                </label>
                <select
                  name="reviewer_id"
                  className="admin-select-refined"
                  value={form.reviewer_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, reviewer_id: event.target.value }))}
                >
                  <option value="">-- No Reviewer --</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  Custom Slug (Optional)
                </label>
                <input
                  name="slug"
                  className="admin-input-refined"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      slug: event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                    }))
                  }
                  placeholder={
                    form.title
                      ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                      : "e.g., how-stock-market-works"
                  }
                  style={{ fontSize: "13px", padding: "8px 10px" }}
                />
              </div>
            </div>

            {/* Sidebar Card 3: Featured Cover Banner */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <h3 className="admin-card-title">
                  <span>🖼️ Top Cover Image</span>
                </h3>
              </div>

              <div className="admin-cover-dropzone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageChange}
                  style={{ fontSize: "12px", width: "100%" }}
                />
              </div>

              {headerImagePreview && (
                <div className="admin-cover-preview">
                  <img src={headerImagePreview} alt="Header preview" />
                </div>
              )}
            </div>

            {/* Sidebar Card 4: SEO & Social Meta */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <h3 className="admin-card-title">
                  <span>🔍 SEO &amp; Social Meta</span>
                </h3>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  <span>SEO Title</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{form.seo_title.length}/60</span>
                </label>
                <input
                  name="seo_title"
                  className="admin-input-refined"
                  value={form.seo_title}
                  onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))}
                  placeholder={form.title ? `${form.title} | FinEd` : "Article title for Google"}
                  style={{ fontSize: "13px", padding: "8px 10px" }}
                />
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  <span>Meta Description</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>{form.meta_description.length}/160</span>
                </label>
                <textarea
                  name="meta_description"
                  className="admin-textarea-refined"
                  value={form.meta_description}
                  onChange={(event) => setForm((prev) => ({ ...prev, meta_description: event.target.value }))}
                  placeholder={form.description || "Brief snippet for search results..."}
                  rows={2}
                  style={{ fontSize: "13px", padding: "8px 10px", minHeight: "60px" }}
                />
              </div>

              {/* Mini Google SERP Preview */}
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", marginTop: "8px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px", display: "block" }}>
                  Google SERP Preview
                </span>
                <span style={{ color: "#202124", fontSize: "11px", display: "block", marginTop: "2px" }}>fined.com › articles › {form.slug || "slug"}</span>
                <h5 style={{ margin: "2px 0", fontSize: "13.5px", color: "#1a0dab", fontWeight: "500", lineHeight: "1.2" }}>
                  {form.seo_title || form.title || "Article Title - FinEd"}
                </h5>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#4d5156", lineHeight: "1.3" }}>
                  {form.meta_description || form.description || "Educational financial guide on FinEd."}
                </p>
              </div>
            </div>

            {/* Sidebar Card 5: Metadata & AI Personal Lens (JSON) */}
            <div className="admin-card-refined">
              <div className="admin-card-header-refined">
                <h3 className="admin-card-title">
                  <span>✨ Metadata JSON</span>
                </h3>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    onClick={handleInsertTemplate}
                    style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                    title="Insert FinEd template JSON"
                  >
                    Template
                  </button>
                  <button
                    type="button"
                    onClick={handleBeautifyMetadata}
                    disabled={!metadataJson.trim()}
                    style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#334155", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", fontWeight: "600", cursor: metadataJson.trim() ? "pointer" : "not-allowed" }}
                    title="Format JSON"
                  >
                    Format
                  </button>
                </div>
              </div>

              <div className="admin-field-refined">
                <label className="admin-label-refined">
                  <span>Editor Summary (AI Lens)</span>
                </label>
                <textarea
                  value={editorSummary}
                  onChange={(e) => setEditorSummary(e.target.value)}
                  placeholder="2-3 sentence AI coach breakdown..."
                  rows={2}
                  className="admin-textarea-refined"
                  style={{ fontSize: "13px", padding: "8px 10px", minHeight: "56px" }}
                />
              </div>

              <div className="admin-field-refined">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>
                    JSON Object
                  </span>
                  {metadataJson.trim() && (
                    <span style={{ fontSize: "11px", fontWeight: "700", color: metadataError ? "#dc2626" : "#16a34a" }}>
                      {metadataError ? `⚠️ Invalid` : `✅ Valid`}
                    </span>
                  )}
                </div>
                <textarea
                  value={metadataJson}
                  onChange={(e) => handleMetadataChange(e.target.value)}
                  placeholder={`{\n  "difficulty": "Intermediate",\n  "readingTime": "7 min read",\n  "targetAudience": "Everyday retail investors"\n}`}
                  rows={6}
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    fontSize: "12px",
                    background: "#0f172a",
                    color: "#f8fafc",
                    border: metadataError ? "1.5px solid #ef4444" : "1px solid #334155",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    lineHeight: "1.4",
                    whiteSpace: "pre",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {metadataError && (
                <p style={{ margin: "4px 0 0 0", color: "#dc2626", fontSize: "11.5px", fontWeight: "600" }}>
                  ⚠️ {metadataError}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

export default AdminArticleForm;
