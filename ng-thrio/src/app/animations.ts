import { animate, style, transition, trigger } from '@angular/animations';

export const slideAnim = [
  trigger('slideA', [
    transition(':enter', [
      style({ transform: 'translateX(-100%)', opacity: 0 }),
      animate('250ms ease', style({ transform: 'translateX(0%)', opacity: 1 })),
    ]),
    transition(':leave', [
      animate(
        '250ms ease',
        style({
          transform: 'translateX(-100%)',
          position: 'absolute',
          opacity: 0,
        })
      ),
    ]),
  ]),
  trigger('slideB', [
    transition(':enter', [
      style({ transform: 'translateX(200%)', opacity: 0 }),
      animate('250ms ease', style({ transform: 'translateX(0%)', opacity: 1 })),
    ]),
    transition(':leave', [
      animate(
        '250ms ease',
        style({
          transform: 'translateX(200%)',
          position: 'absolute',
          opacity: 0,
        })
      ),
    ]),
  ]),
];

export const slideVAnim = [
  trigger('slideV', [
    transition(':enter', [
      style({ transform: 'translateY(200%)', opacity: 0 }),
      animate('250ms ease', style({ transform: 'translateY(0%)', opacity: 1 })),
    ]),
    transition(':leave', [
      animate(
        '250ms ease',
        style({
          transform: 'translateY(200%)',
          position: 'absolute',
          opacity: 0,
        })
      ),
    ]),
  ]),
];

export const fadeAnim = [
  trigger('fade', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('250ms ease-in-out', style({ opacity: 1 })),
    ]),
    transition(':enter', [
      style({ opacity: 1 }),
      animate('250ms ease-in-out', style({ opacity: 0 })),
    ]),
  ]),
];
