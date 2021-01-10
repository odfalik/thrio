import { animate, style, transition, trigger } from '@angular/animations';

export const slideAnim = [
  trigger('slideA', [
    transition(':enter', [
      style({ transform: 'translateX(-100%)', opacity: 0 }),
      animate(
        '250ms ease',
        style({ transform: 'translateX(0%)', opacity: 1 })
      ),
    ]),
    transition(':leave', [
      animate(
        '250ms ease',
        style({
          transform: 'translateX(-100%)',
          position: 'absolute',
          opacity: 0
        })
      ),
    ]),
  ]),
  trigger('slideB', [
    transition(':enter', [
      style({ transform: 'translateX(200%)', opacity: 0 }),
      animate(
        '250ms ease',
        style({ transform: 'translateX(0%)', opacity: 1 })
      ),
    ]),
    transition(':leave', [
      animate(
        '250ms ease',
        style({
          transform: 'translateX(200%)',
          position: 'absolute',
          opacity: 0
        })
      ),
    ]),
  ]),
];
