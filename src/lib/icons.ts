// Icone Phosphor (regular) come SVG in linea, scelte per id di settore e servizio.
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import arrowUp from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import briefcase from '@phosphor-icons/core/assets/regular/briefcase.svg?raw';
import calendarCheck from '@phosphor-icons/core/assets/regular/calendar-check.svg?raw';
import clock from '@phosphor-icons/core/assets/regular/clock.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import checkCircle from '@phosphor-icons/core/assets/regular/check-circle.svg?raw';
import envelope from '@phosphor-icons/core/assets/regular/envelope-simple.svg?raw';
import factory from '@phosphor-icons/core/assets/regular/factory.svg?raw';
import forkKnife from '@phosphor-icons/core/assets/regular/fork-knife.svg?raw';
import heartbeat from '@phosphor-icons/core/assets/regular/heartbeat.svg?raw';
import key from '@phosphor-icons/core/assets/regular/key.svg?raw';
import mapPin from '@phosphor-icons/core/assets/regular/map-pin.svg?raw';
import phone from '@phosphor-icons/core/assets/regular/phone.svg?raw';
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import rocketLaunch from '@phosphor-icons/core/assets/regular/rocket-launch.svg?raw';
import sparkle from '@phosphor-icons/core/assets/regular/sparkle.svg?raw';
import storefront from '@phosphor-icons/core/assets/regular/storefront.svg?raw';
import wine from '@phosphor-icons/core/assets/regular/wine.svg?raw';
import wrench from '@phosphor-icons/core/assets/regular/wrench.svg?raw';
import instagramLogo from '@phosphor-icons/core/assets/fill/instagram-logo-fill.svg?raw';
import linkedinLogo from '@phosphor-icons/core/assets/fill/linkedin-logo-fill.svg?raw';
import dotsVertical from '@phosphor-icons/core/assets/bold/dots-three-vertical-bold.svg?raw';
import browserLight from '@phosphor-icons/core/assets/light/browser-light.svg?raw';
import chatsLight from '@phosphor-icons/core/assets/light/chats-circle-light.svg?raw';
import magnifyingLight from '@phosphor-icons/core/assets/light/magnifying-glass-light.svg?raw';
import megaphoneLight from '@phosphor-icons/core/assets/light/megaphone-light.svg?raw';
import penNibLight from '@phosphor-icons/core/assets/light/pen-nib-light.svg?raw';
import robotLight from '@phosphor-icons/core/assets/light/robot-light.svg?raw';
import arrowRightLight from '@phosphor-icons/core/assets/light/arrow-right-light.svg?raw';
import calendarCheckLight from '@phosphor-icons/core/assets/light/calendar-check-light.svg?raw';
import checkLight from '@phosphor-icons/core/assets/light/check-light.svg?raw';
import checkCircleLight from '@phosphor-icons/core/assets/light/check-circle-light.svg?raw';
import caretDown from '@phosphor-icons/core/assets/regular/caret-down.svg?raw';
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
  // servizi: tratto sottile (light)
  siti: browserLight,
  brand: penNibLight,
  social: chatsLight,
  pubblicita: megaphoneLight,
  'ai-automazioni': robotLight,
  'seo-geo': magnifyingLight,
};

// Tratto sottile per i Contatti.
export const uiLight = { arrowRight: arrowRightLight, calendarCheck: calendarCheckLight, check: checkLight, checkCircle: checkCircleLight };

export const ui = { arrowRight, arrowUp, calendarCheck, caretDown, check, checkCircle, clock, dotsVertical, envelope, mapPin, phone, plus, sparkle };

export function iconFor(id: string): string {
  return byId[id] ?? sparkle;
}

// Bandiere (flag-icons) per il selettore della lingua; l'inglese usa quella britannica.
// L'id del file originale si toglie: la stessa bandiera può comparire più volte nella pagina.
const FLAGS: Record<Lang, string> = { it: flagIt, en: flagGb, fr: flagFr, de: flagDe };
export function flagFor(lang: Lang): string {
  return FLAGS[lang].replace(/\s+id="[^"]*"/, '');
}

// Profilo leggibile di qualsiasi URL: senza protocollo, "www." e barra finale ("linkedin.com/company/kint-ch").
export function handleOf(url: string): string {
  const u = new URL(url);
  return `${u.hostname.replace(/^www\./, '')}${u.pathname}`.replace(/\/$/, '');
}

// Profili social (site.yaml → same_as): nome e icona scelti dal dominio; null se il dominio non è noto.
const SOCIAL: Array<[RegExp, string, string]> = [
  [/(^|\.)linkedin\.com$/, 'LinkedIn', linkedinLogo],
  [/(^|\.)instagram\.com$/, 'Instagram', instagramLogo],
];
export function socialFor(url: string): { name: string; icon: string } | null {
  const hit = SOCIAL.find(([re]) => re.test(new URL(url).hostname));
  return hit ? { name: hit[1], icon: hit[2] } : null;
}

