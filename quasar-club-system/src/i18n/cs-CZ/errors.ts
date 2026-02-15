export default {
  auth: {
    wrongPassword: 'Nesprávné heslo. Zkuste to prosím znovu.',
    invalidCredential: 'Neplatné přihlašovací údaje.',
    userNotFound: 'Uživatel nenalezen.',
    emailInUse: 'Email je již registrován.',
    weakPassword: 'Heslo je příliš slabé. Musí mít alespoň 6 znaků.',
    networkFailed: 'Chyba sítě. Zkontrolujte připojení k internetu.',
    tooManyRequests: 'Příliš mnoho pokusů. Počkejte prosím chvíli.',
    requiresRecentLogin: 'Prosím přihlaste se znovu pro dokončení této akce.',
    unknown: 'Neznámá chyba autentizace.'
  },
  firestore: {
    permissionDenied: 'Nemáte oprávnění k této operaci.',
    unavailable: 'Databáze je dočasně nedostupná.',
    notFound: 'Data nebyla nalezena.',
    alreadyExists: 'Data již existují.',
    failedPrecondition: 'Operace nelze dokončit.',
    unknown: 'Neznámá databázová chyba.'
  },
  validation: {
    required: 'Toto pole je povinné.',
    invalidFormat: 'Neplatný formát.'
  },
  listener: {
    failed: 'Živé aktualizace selhaly.'
  },
  unexpected: 'Neočekávaná chyba. Zkuste to prosím znovu.',
  maxRetriesReached: 'Maximální počet pokusů byl dosažen'
} as const
