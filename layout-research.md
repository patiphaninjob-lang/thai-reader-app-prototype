# Layout Research Notes

Prototype rules applied from current public guidance:

- Apple HIG typography/layout: keep hierarchy clear, text legible, and preview localized text at real sizes.
- Apple HIG tab bars: use the tab bar for navigation between Library, Reading, and Settings, not one-off actions.
- W3C Thai layout resources: Thai text needs language-aware rendering and careful line breaking; avoid aggressive word breaking.
- WCAG 2.2 text spacing: reader controls support generous line height and adjustable text spacing without losing content.
- WCAG visual presentation guidance: long text should avoid full justification and keep line length/leading comfortable.
- MDN `Intl.Segmenter`: used only for Thai-aware reading estimates, not for rewriting manuscript text.

Source manuscript policy:

- The prototype copies Markdown files into `public/books/` without editing their contents.
- The renderer transforms Markdown markers into visual blocks only; it does not paraphrase, summarize, normalize, or rewrite the manuscript.
- If loaded text contains replacement/control characters, the app displays a warning instead of silently hiding the issue.

Sources:

- https://developer.apple.com/design/human-interface-guidelines/typography
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://www.w3.org/TR/thai-lreq/
- https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/word-break
