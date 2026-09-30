// Icone Phosphor (regular) come SVG in linea, scelte per id di settore e servizio.
import arrowRight from '@phosphor-icons/core/assets/regular/arrow-right.svg?raw';
import briefcase from '@phosphor-icons/core/assets/regular/briefcase.svg?raw';
import browser from '@phosphor-icons/core/assets/regular/browser.svg?raw';
import calendarCheck from '@phosphor-icons/core/assets/regular/calendar-check.svg?raw';
import camera from '@phosphor-icons/core/assets/regular/camera.svg?raw';
import chatsCircle from '@phosphor-icons/core/assets/regular/chats-circle.svg?raw';
import check from '@phosphor-icons/core/assets/regular/check.svg?raw';
import envelope from '@phosphor-icons/core/assets/regular/envelope-simple.svg?raw';
import factory from '@phosphor-icons/core/assets/regular/factory.svg?raw';
import forkKnife from '@phosphor-icons/core/assets/regular/fork-knife.svg?raw';
import gift from '@phosphor-icons/core/assets/regular/gift.svg?raw';
import heartbeat from '@phosphor-icons/core/assets/regular/heartbeat.svg?raw';
import key from '@phosphor-icons/core/assets/regular/key.svg?raw';
import mapPin from '@phosphor-icons/core/assets/regular/map-pin.svg?raw';
import megaphone from '@phosphor-icons/core/assets/regular/megaphone.svg?raw';
import penNib from '@phosphor-icons/core/assets/regular/pen-nib.svg?raw';
import plus from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import robot from '@phosphor-icons/core/assets/regular/robot.svg?raw';
import rocketLaunch from '@phosphor-icons/core/assets/regular/rocket-launch.svg?raw';
import sparkle from '@phosphor-icons/core/assets/regular/sparkle.svg?raw';
import storefront from '@phosphor-icons/core/assets/regular/storefront.svg?raw';
import wine from '@phosphor-icons/core/assets/regular/wine.svg?raw';
import wrench from '@phosphor-icons/core/assets/regular/wrench.svg?raw';

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
  gadget: gift,
  social: chatsCircle,
  pubblicita: megaphone,
  'ai-automazioni': robot,
  google: mapPin,
  'foto-video': camera,
  'ai-ready': sparkle,
};

export const ui = { arrowRight, calendarCheck, check, envelope, plus, sparkle };

export function iconFor(id: string): string {
  return byId[id] ?? sparkle;
}
