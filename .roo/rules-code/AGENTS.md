# Coding Patterns - Association Espoir

## Component Structure
```jsx
// Use function declarations for components
function ComponentName({ prop1, prop2 = 'default' }) {
  const { t, language } = useApp() // Destructure needed context values
  
  // Local state
  const [state, setState] = useState(initial)
  
  // Effects
  useEffect(() => { ... }, [])
  
  // Handlers
  const handleAction = useCallback(() => { ... }, [])
  
  return (...)
}
```

## Styling Rules
- **Tailwind classes**: Use single backtick strings for multi-line classes
- **Conditional classes**: Use template literals, not clsx/lib
- **Dark mode**: Always include `dark:` variant with `dark:bg-bg-dark-card`, `dark:text-white`
- **Transitions**: Use `duration-300 ease-out` for consistency

## i18n Implementation
```jsx
// Define translations at top of page component
const translations = {
  ar: { title: '...' },
  fr: { title: '...' },
  en: { title: '...' }
}

// Inside component
const { t, language, currentLanguage } = useApp()
const text = translations[language] || translations.en

// RTL-aware layouts
<div dir={currentLanguage.dir} className="flex flex-row rtl:flex-row-reverse">
```

## Form Patterns
```jsx
// Controlled inputs with local state
const [formData, setFormData] = useState({ field: '' })
const handleChange = (e) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
}

// Validation before submit
const handleSubmit = (e) => {
  e.preventDefault()
  if (!formData.field) {
    showToast(t('error'), 'error')
    return
  }
  // proceed
}
```

## Icon Usage (REQUIRED)
```jsx
// Correct - Material Symbols
<span className="material-symbols-outlined">home</span>
<span className="material-symbols-outlined filled">favorite</span>

// With conditional fill
<span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
  bookmark
</span>
```

## Local Storage Helpers
```jsx
// Read with fallback
const data = JSON.parse(localStorage.getItem('key') || '[]')

// Write
localStorage.setItem('key', JSON.stringify(data))

// Normalize data from storage (handles legacy formats)
const normalizeProject = (project) => ({
  ...project,
  title: typeof project.title === 'object' 
    ? project.title 
    : { en: project.title, fr: project.title, ar: project.title }
})
```
