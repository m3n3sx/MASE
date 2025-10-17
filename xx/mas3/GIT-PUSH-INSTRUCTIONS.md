# Instrukcje Wysłania do GitHub

**Repo**: https://github.com/m3n3sx/mas7.git

---

## 🚀 Szybkie Kroki

```bash
cd /var/www/html/wp-content/plugins/mas3

# 1. Inicjalizuj repo
git init

# 2. Dodaj remote
git remote add origin https://github.com/m3n3sx/mas7.git

# 3. Dodaj wszystkie pliki
git add .

# 4. Commit
git commit -m "CSS Consolidation Project - Phase 3B Step 1 Complete (75%)"

# 5. Push
git branch -M main
git push -u origin main --force
```

---

## 📋 Szczegółowe Kroki

### Krok 1: Inicjalizacja
```bash
cd /var/www/html/wp-content/plugins/mas3
git init
```

### Krok 2: Konfiguracja (jeśli potrzebna)
```bash
git config user.name "Twoje Imię"
git config user.email "twoj@email.com"
```

### Krok 3: Dodaj Remote
```bash
git remote add origin https://github.com/m3n3sx/mas7.git
```

### Krok 4: Utwórz .gitignore (opcjonalnie)
```bash
cat > .gitignore << 'EOF'
# WordPress
wp-config.php
.htaccess

# Backups
*.tar.gz
*.bak

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Node
node_modules/
EOF
```

### Krok 5: Dodaj Pliki
```bash
git add .
```

### Krok 6: Commit
```bash
git commit -m "CSS Consolidation Project - Phase 3B Step 1 Complete

- Unified CSS Manager implemented
- Admin UI (CSS Manager) added
- Feature flag system
- 2 unused CSS files removed
- 19 documentation files
- 75% project complete
- Ready for production testing"
```

### Krok 7: Push
```bash
git branch -M main
git push -u origin main
```

**Uwaga**: Jeśli repo już istnieje i chcesz nadpisać:
```bash
git push -u origin main --force
```

---

## 🔐 Uwierzytelnianie

### Metoda 1: HTTPS z Personal Access Token
1. Idź do: https://github.com/settings/tokens
2. Wygeneruj nowy token (classic)
3. Zaznacz scope: `repo`
4. Skopiuj token
5. Przy push użyj tokena jako hasła

### Metoda 2: SSH
```bash
# Wygeneruj klucz SSH (jeśli nie masz)
ssh-keygen -t ed25519 -C "twoj@email.com"

# Dodaj klucz do ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Skopiuj klucz publiczny
cat ~/.ssh/id_ed25519.pub

# Dodaj do GitHub: https://github.com/settings/keys

# Zmień remote na SSH
git remote set-url origin git@github.com:m3n3sx/mas7.git
```

---

## 📦 Co Zostanie Wysłane

### Kod (3 pliki)
- includes/class-mas-unified-css-manager.php
- includes/admin/class-mas-css-manager-admin.php
- modern-admin-styler-v2.php (zmodyfikowany)

### Dokumentacja (19 plików)
- CSS-CONSOLIDATION-*.md
- PHASE-*.md
- PODSUMOWANIE.md
- TEST-NOW.md
- NEXT-ACTIONS.md
- ROADMAP.md
- etc.

### Skrypty (2 pliki)
- quick-verify.sh
- test-css-manager.php

### CSS (15 plików)
- assets/css/*.css

### Wszystkie inne pliki pluginu

---

## ✅ Weryfikacja

Po push sprawdź:
```bash
# Sprawdź status
git status

# Sprawdź remote
git remote -v

# Sprawdź logi
git log --oneline

# Sprawdź branch
git branch
```

Otwórz: https://github.com/m3n3sx/mas7

---

## 🔄 Aktualizacje w Przyszłości

```bash
# Dodaj zmiany
git add .

# Commit
git commit -m "Opis zmian"

# Push
git push
```

---

## 🐛 Troubleshooting

### Problem: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/m3n3sx/mas7.git
```

### Problem: "rejected - non-fast-forward"
```bash
git pull origin main --rebase
# lub force push (ostrożnie!)
git push --force
```

### Problem: "Authentication failed"
- Użyj Personal Access Token zamiast hasła
- Lub skonfiguruj SSH

---

**Gotowe do wysłania!** 🚀

Wykonaj komendy powyżej, aby wysłać wszystkie pliki do GitHub.
