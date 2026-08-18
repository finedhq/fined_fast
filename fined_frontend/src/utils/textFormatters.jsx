export function parseBoldText(text) {
  if (text === undefined || text === null) return "";
  if (typeof text !== "string") return text;
  // Replace **text** with <strong>text</strong>
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Replace *text* with <em>text</em>
  parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return parsed;
}

export function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex, customPrefix = "", classPrefix = "", spanClass = "") {
  let formattedText = parseBoldText(detailText);
  const prefix = classPrefix ? classPrefix + "-" : "";
  const containerClass = spanClass || `${prefix}detail-text`;

  if (!glossaryTerms || glossaryTerms.length === 0 || typeof formattedText !== "string") {
    if (typeof formattedText === "string") {
      return <span className={containerClass} dangerouslySetInnerHTML={{ __html: formattedText }} />;
    }
    return <span className={containerClass}>{formattedText}</span>;
  }

  let elements = [formattedText];
  glossaryTerms.forEach((gTerm, termIdx) => {
    const newElements = [];
    const termRegex = new RegExp(`\\b(${gTerm.term})\\b`, "i");
    let hasMatched = false;

    elements.forEach((el) => {
      if (typeof el !== "string") {
        newElements.push(el);
        return;
      }
      
      if (hasMatched) {
        newElements.push(el);
        return;
      }

      const parts = el.split(termRegex);
      parts.forEach((part) => {
        if (!hasMatched && part.toLowerCase() === gTerm.term.toLowerCase()) {
          hasMatched = true;
          const termKey = (customPrefix !== "" && customPrefix !== undefined && customPrefix !== null) ? `${customPrefix}-${termIdx}` : termIdx;
          const isActive = activeTermIndex === termKey;
          newElements.push(
            <span key={`${customPrefix}-${termIdx}-${part}`} className={`${prefix}glossary-wrapper`}>
              <button
                className={`${prefix}glossary-term ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermIndex(isActive ? null : termKey);
                }}
              >
                {part}
              </button>
              {isActive && (
                <div className={`${prefix}glossary-tooltip`}>
                  <strong>{gTerm.term}</strong>
                  <p>{gTerm.definition}</p>
                  {gTerm.example && <p className={`${prefix}example`}>e.g., {gTerm.example}</p>}
                </div>
              )}
            </span>
          );
        } else if (part) {
          newElements.push(part);
        }
      });
    });
    elements = newElements;
  });

  // At the very end, map any remaining strings to dangerouslySetInnerHTML
  elements = elements.map((el, i) => {
    if (typeof el === "string") {
      return <span key={`html-${i}`} dangerouslySetInnerHTML={{ __html: el }} />;
    }
    return el;
  });

  return <span className={containerClass}>{elements}</span>;
}
