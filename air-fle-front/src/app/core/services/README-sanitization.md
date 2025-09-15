# Service de Sanitisation XSS

## Vue d'ensemble

Le `SanitizationService` fournit une protection contre les attaques XSS (Cross-Site Scripting) en nettoyant et validant les données d'entrée utilisateur avant leur traitement ou stockage.

## Fonctionnalités

### 🔒 Protection XSS
- Suppression des balises `<script>`, `<iframe>`, `<object>`, `<embed>`
- Suppression des protocoles `javascript:`
- Suppression des gestionnaires d'événements (`onclick`, `onload`, etc.)
- Suppression de toutes les balises HTML

### 🧹 Nettoyage des données
- Suppression des espaces en début/fin
- Validation des formats (email, téléphone, UUID)
- Filtrage des caractères autorisés selon le type de champ

## Utilisation

### Import du service
```typescript
import { SanitizationService } from '@core/services';

constructor(private sanitizationService: SanitizationService) {}
```

### Méthodes disponibles

#### `sanitizeText(input: string): string`
Nettoie une chaîne de caractères générique.
```typescript
const clean = this.sanitizationService.sanitizeText('Hello <script>alert()</script> World');
// Résultat: "Hello  World"
```

#### `sanitizeName(name: string): string`
Nettoie un nom/prénom (lettres, espaces, tirets, apostrophes uniquement).
```typescript
const cleanName = this.sanitizationService.sanitizeName('Jean-Pierre<script>');
// Résultat: "Jean-Pierre"
```

#### `sanitizeEmail(email: string): string`
Valide et nettoie un email.
```typescript
const cleanEmail = this.sanitizationService.sanitizeEmail('TEST<script>@EXAMPLE.COM');
// Résultat: "test@example.com" ou "" si invalide
```

#### `sanitizePhone(phone: string): string`
Nettoie un numéro de téléphone.
```typescript
const cleanPhone = this.sanitizationService.sanitizePhone('+33<script>123456789');
// Résultat: "+33123456789"
```

#### `sanitizeStudentData(data: any): any`
Nettoie un objet étudiant complet.
```typescript
const cleanData = this.sanitizationService.sanitizeStudentData(rawFormData);
```

#### `isContentSafe(content: string): boolean`
Vérifie si le contenu est sûr.
```typescript
const isSafe = this.sanitizationService.isContentSafe('<script>alert()</script>');
// Résultat: false
```

## Exemple d'intégration dans un formulaire

```typescript
onSubmit(): void {
  if (this.form.valid) {
    const rawData = this.form.value;
    
    // Préparer les données brutes
    const studentData = {
      student_firstname: rawData.firstname,
      student_lastname: rawData.lastname,
      student_mail: rawData.email,
      // ... autres champs
    };
    
    // 🔒 SANITISATION XSS
    const cleanData = this.sanitizationService.sanitizeStudentData(studentData);
    
    // Validation supplémentaire
    if (this.isDataValid(cleanData)) {
      this.studentService.createStudent(cleanData).subscribe(/* ... */);
    } else {
      this.error = 'Données invalides détectées';
    }
  }
}

private isDataValid(data: any): boolean {
  const textFields = [data.student_firstname, data.student_lastname, data.student_mail]
    .filter(field => field);
  
  return textFields.every(field => this.sanitizationService.isContentSafe(field));
}
```

## Types de protection

| Type d'attaque | Protection |
|----------------|------------|
| `<script>` injection | ✅ Supprimé |
| `<iframe>` injection | ✅ Supprimé |
| `javascript:` protocol | ✅ Supprimé |
| Event handlers (`onclick`, etc.) | ✅ Supprimé |
| HTML tags | ✅ Supprimé |
| Caractères non autorisés | ✅ Filtrés |
| Format invalide | ✅ Rejeté |

## Bonnes pratiques

1. **Toujours sanitiser avant envoi** : Appliquer la sanitisation juste avant l'envoi des données
2. **Validation double** : Utiliser `isContentSafe()` pour une validation supplémentaire
3. **Logs de débogage** : Activer les logs pour voir les transformations
4. **Tests réguliers** : Tester avec des données malveillantes

## Tests

Des tests unitaires complets sont disponibles dans `sanitization.service.spec.ts` pour valider toutes les fonctionnalités de sécurité.

```bash
ng test --include="**/sanitization.service.spec.ts"
``` 