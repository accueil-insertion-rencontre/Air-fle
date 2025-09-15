import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Address, Country } from '../models/address.model';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  // Liste de référence des pays - données métier essentielles
  private countries: Country[] = [
    { code: 'FR', name: 'France' },
    { code: 'BE', name: 'Belgique' },
    { code: 'CH', name: 'Suisse' },
    { code: 'CA', name: 'Canada' },
    { code: 'LU', name: 'Luxembourg' },
    { code: 'MA', name: 'Maroc' },
    { code: 'DZ', name: 'Algérie' },
    { code: 'TN', name: 'Tunisie' },
    { code: 'SN', name: 'Sénégal' },
    { code: 'CI', name: "Côte d'Ivoire" },
  ];

  constructor() {}

  /**
   * Valide une adresse
   * @param address L'adresse à valider
   * @returns true si l'adresse est valide, false sinon
   */
  validateAddress(address: Address): boolean {
    return !!(
      address.street?.trim() &&
      this.validateZipCode(address.zipCode, address.country) &&
      address.city?.trim() &&
      this.validateCountry(address.country)
    );
  }

  /**
   * Vérifie si le pays est dans la liste des pays autorisés
   * @param countryName Le nom du pays à vérifier
   * @returns true si le pays est valide, false sinon
   */
  private validateCountry(countryName: string): boolean {
    return this.countries.some(c => c.name === countryName);
  }

  /**
   * Récupère la liste des pays disponibles
   * @returns Observable de la liste des pays
   */
  getCountries(): Observable<Country[]> {
    return of(this.countries);
  }

  /**
   * Formate une adresse pour l'affichage
   * @param address L'adresse à formater
   * @returns L'adresse formatée
   */
  formatAddress(address: Address): string {
    return `${address.street}, ${address.zipCode} ${address.city}, ${address.country}`;
  }

  /**
   * Valide un code postal en fonction du pays
   * @param zipCode Code postal à valider
   * @param country Pays du code postal
   * @returns true si le code postal est valide pour le pays donné
   */
  validateZipCode(zipCode: string, country: string): boolean {
    const zipCodePatterns: { [key: string]: RegExp } = {
      France: /^[0-9]{5}$/,
      Belgique: /^[1-9]{1}[0-9]{3}$/,
      Suisse: /^[1-9]{1}[0-9]{3}$/,
      Luxembourg: /^[1-9]{1}[0-9]{3}$/,
      Canada: /^[A-Za-z][0-9][A-Za-z] [0-9][A-Za-z][0-9]$/,
    };

    const pattern = zipCodePatterns[country];
    if (!pattern) return true; // Pas de validation pour les autres pays
    return pattern.test(zipCode);
  }

  /**
   * Recherche des pays par nom
   * @param query Texte de recherche
   * @returns Observable avec les pays correspondants
   */
  searchCountries(query: string): Observable<Country[]> {
    return of(this.countries).pipe(
      map(countries =>
        countries.filter(country => country.name.toLowerCase().includes(query.toLowerCase()))
      )
    );
  }

  /**
   * Récupère un pays par son code
   * @param code Code du pays
   * @returns Le pays correspondant ou undefined
   */
  getCountryByCode(code: string): Country | undefined {
    return this.countries.find(c => c.code === code);
  }

  /**
   * Récupère un pays par son nom
   * @param name Nom du pays
   * @returns Le pays correspondant ou undefined
   */
  getCountryByName(name: string): Country | undefined {
    return this.countries.find(c => c.name === name);
  }
} 