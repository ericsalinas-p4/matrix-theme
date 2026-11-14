/**
 * La lluvia de fondo del look Matrix, como un SVG. `at` es la hora de la lluvia (segundos a velocidad normal); la
 * velocidad pasa de `from` a `to` (1, normal) en `ease` segundos, y luego sigue en `to`.
 */
export declare const rain: (args: { at: number; from: number; to: number; ease: number }) => string
