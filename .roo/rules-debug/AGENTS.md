# Debugging Tips - Association Espoir

## Common Issues

### Icons not displaying
- Check Material Symbols font loaded: Look for `@font-face` in index.css
- Verify using `material-symbols-outlined` class (not `material-icons`)
- Check console for font loading errors (CORS on Unsplash images unrelated)

### RTL layout broken
- Ensure `dir={currentLanguage.dir}` is on root element
- Check `[dir="rtl"]` CSS selectors in index.css for icon flipping
- Flex layouts need `rtl:flex-row-reverse` if direction matters

### Translations missing
- Page-level translations object may not have current language key
- Fallback pattern: `translations[language] || translations.en`
- Check `LANGUAGES` object in AppContext for supported codes

### Dark mode not working
- Toggle `dark` class on `html` element
- Use `dark:` prefix on Tailwind classes
- Verify `darkMode: 'class'` in tailwind.config.js

### localStorage data sync issues
- Home and Admin pages share `admin_projects` key
- Normalization required when reading: `normalizeProject()`
- Check for JSON parse errors on corrupted data

## Debug Logging
```js
// AppContext provides debug info
const { currentLanguage, isAuthenticated, user } = useApp()
console.log('Current lang:', currentLanguage.code, 'dir:', currentLanguage.dir)
```

## Network Issues
- Uses `netlify-cli` for deployment previews
- No backend API - all data is mock/localStorage
- Image hotlinking from Unsplash (CORS should be fine)
