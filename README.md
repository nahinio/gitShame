# GitShame

**A Year in Commits. We Roast. You Share.**

GitShame is a client-side only GitHub "Year in Review" roaster. Enter any public GitHub username and receive a personalized, sarcastic breakdown of their activity. Download a social-story-sized PNG (1080x1920) to share.

---

## Features

- **No Backend Required**: Runs entirely in the browser.
- **Public Profiles Only**: Uses GitHub's public API.
- **Sarcastic Roasts**: Heuristic-based content generation ("Mock AI").
- **Downloadable PNG**: Export a 1080x1920 story image.

---

## How to Run Locally

1.  **Clone or Download** the repository to your local machine.
2.  **Open `index.html`** directly in your web browser (Chrome, Firefox, Edge recommended).
    - No server needed. Just double-click `index.html`.

That's it!

---

## Files

| File            | Description                                                     |
| --------------- | --------------------------------------------------------------- |
| `index.html`    | Main HTML structure.                                            |
| `styles.css`    | All styles, including the hidden PNG export template.           |
| `app.js`        | Core logic: API fetching, stats processing, roast generation.   |
| `microcopy.json`| Copy pack with all text variants (for reference/customization). |

---

## API Notes

- **Rate Limits**: GitHub's public API allows ~60 requests/hour per IP. If you hit the limit, wait and try again.
- **Security**: This app uses **no API keys**. For heavy usage, users can modify `app.js` to pass a Personal Access Token (PAT) via a header, but this is not recommended for public deployment.

---

## Testing

Use these sample usernames for testing:
- `torvalds` (Linus Torvalds - high activity)
- `octocat` (GitHub's mascot - low/mock activity)
- Your own username!

---

## Customization

- **Colors**: Edit CSS variables in `:root` in `styles.css`.
- **Roast Text**: Edit the `RoastGenerator` class in `app.js`.
- **Microcopy**: Reference `microcopy.json` for all text strings.

---

## Accessibility

- Contrast ratios meet WCAG AA.
- Keyboard navigation supported for slides (arrow buttons).
- `aria-label` attributes on key interactive elements.

---

## License

MIT License. Roast responsibly.
