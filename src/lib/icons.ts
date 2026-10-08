// Icone Phosphor (regular) come SVG in linea, scelte per id di settore e servizio.
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import arrowUp from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import briefcase from '@phosphor-icons/core/assets/regular/briefcase.svg?raw';
import browser from '@phosphor-icons/core/assets/regular/browser.svg?raw';
import calendarCheck from '@phosphor-icons/core/assets/regular/calendar-check.svg?raw';
import clock from '@phosphor-icons/core/assets/regular/clock.svg?raw';
import chatsCircle from '@phosphor-icons/core/assets/regular/chats-circle.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import envelope from '@phosphor-icons/core/assets/regular/envelope-simple.svg?raw';
import factory from '@phosphor-icons/core/assets/regular/factory.svg?raw';
import forkKnife from '@phosphor-icons/core/assets/regular/fork-knife.svg?raw';
import heartbeat from '@phosphor-icons/core/assets/regular/heartbeat.svg?raw';
import key from '@phosphor-icons/core/assets/regular/key.svg?raw';
import mapPin from '@phosphor-icons/core/assets/regular/map-pin.svg?raw';
import magnifyingGlass from '@phosphor-icons/core/assets/regular/magnifying-glass.svg?raw';
import megaphone from '@phosphor-icons/core/assets/regular/megaphone.svg?raw';
import phone from '@phosphor-icons/core/assets/regular/phone.svg?raw';
import penNib from '@phosphor-icons/core/assets/regular/pen-nib.svg?raw';
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import robot from '@phosphor-icons/core/assets/regular/robot.svg?raw';
import rocketLaunch from '@phosphor-icons/core/assets/regular/rocket-launch.svg?raw';
import sparkle from '@phosphor-icons/core/assets/regular/sparkle.svg?raw';
import storefront from '@phosphor-icons/core/assets/regular/storefront.svg?raw';
import wine from '@phosphor-icons/core/assets/regular/wine.svg?raw';
import wrench from '@phosphor-icons/core/assets/regular/wrench.svg?raw';
import instagramLogo from '@phosphor-icons/core/assets/fill/instagram-logo-fill.svg?raw';
import linkedinLogo from '@phosphor-icons/core/assets/fill/linkedin-logo-fill.svg?raw';
import dotsVertical from '@phosphor-icons/core/assets/bold/dots-three-vertical-bold.svg?raw';
import caretDown from '@phosphor-icons/core/assets/regular/caret-down.svg?raw';
import flagCh from 'flag-icons/flags/4x3/ch.svg?raw';
import flagDe from 'flag-icons/flags/4x3/de.svg?raw';
import flagFr from 'flag-icons/flags/4x3/fr.svg?raw';
import flagGb from 'flag-icons/flags/4x3/gb.svg?raw';
import flagIt from 'flag-icons/flags/4x3/it.svg?raw';
import type { Lang } from './i18n';

const byId: Record<string, string> = {
  ristorazione: forkKnife,
  agroalimentare: wine,
  'artigiani-edilizia': wrench,
  'studi-professionali': briefcase,
  'salute-benessere': heartbeat,
  'negozi-retail': storefront,
  'auto-moto-immobiliare': key,
  'industria-b2b': factory,
  'nuove-aperture': rocketLaunch,
  siti: browser,
  brand: penNib,
  social: chatsCircle,
  pubblicita: megaphone,
  'ai-automazioni': robot,
  'seo-geo': magnifyingGlass,
};

export const ui = { arrowRight, arrowUp, calendarCheck, caretDown, check, clock, dotsVertical, envelope, mapPin, phone, plus, sparkle };

export function iconFor(id: string): string {
  return byId[id] ?? sparkle;
}

// Bandiere (flag-icons) per il selettore della lingua; l'inglese usa quella britannica.
// L'id del file originale si toglie: la stessa bandiera può comparire più volte nella pagina.
const FLAGS: Record<Lang, string> = { it: flagIt, en: flagGb, fr: flagFr, de: flagDe };
export function flagFor(lang: Lang): string {
  return FLAGS[lang].replace(/\s+id="[^"]*"/, '');
}

// Profili social (site.yaml → same_as): nome e icona scelti dal dominio; null se il dominio non è noto.
const SOCIAL: Array<[RegExp, string, string]> = [
  [/(^|\.)linkedin\.com$/, 'LinkedIn', linkedinLogo],
  [/(^|\.)instagram\.com$/, 'Instagram', instagramLogo],
];
export function socialFor(url: string): { name: string; icon: string } | null {
  const host = new URL(url).hostname;
  const hit = SOCIAL.find(([re]) => re.test(host));
  return hit ? { name: hit[1], icon: hit[2] } : null;
}

// Paesi in cui lavora Kint (bandiere nel footer).
export const countryFlags = [flagCh, flagIt].map((f) => f.replace(/\s+id="[^"]*"/, ''));
