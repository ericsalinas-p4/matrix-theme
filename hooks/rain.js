// La lluvia de fondo del look Matrix: columnas de caracteres que caen, cada una a su ritmo, tamaño y largo, y algunos
// caracteres que parpadean. Se arma con un azar fijo, así las gotas son las mismas en cada dibujo.
// - Cada gota son cuatro textos verticales, del más tenue arriba al más brillante abajo: así caben muchas.
// - Se anima con SMIL (<animate>, <animateTransform>): la app limpia el SVG antes de dibujarlo, y SMIL es lo que dice
//   que corre en el marco del fondo.
// - Sin < ni > entre los caracteres, que romperían el SVG.
// - El reloj de la lluvia es `at`: segundos de lluvia a velocidad normal. Cada gota está donde la pone ese reloj, así que
//   al cambiar de velocidad nada salta: cada una frena o acelera desde donde iba (`ease` segundos, con la velocidad
//   cambiando en línea recta) y luego sigue cayendo a la nueva.
const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ0123456789Z:=+*'
const BLINK = ['#00ff66', '#b8ffd0', '#00a844']

const WIDTH = 1600
const HEIGHT = 1000

// en qué parte de su ciclo (0 a 1) va una gota de ciclo `dur` que empezó en `begin`, a la hora `at`
const cycle = (at, begin, dur) => ((((at - begin) % dur) + dur) % dur) / dur

const n = value => Number(value.toFixed(2))

/**
 * @param {{ at: number, from: number, to: number, ease: number }} args `at`: la hora de la lluvia; `from` y `to`: la
 *   velocidad de antes y la nueva (1, normal); `ease`: segundos que tarda el cambio (0, ninguno).
 */
export const rain = ({ at, from, to, ease }) => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const pick = (low, high) => low + rand() * (high - low)
  const word = length => Array.from({ length }, () => GLYPHS[Math.floor(rand() * GLYPHS.length)]).join('')
  // la cola en cuatro tramos, de f1 (arriba, tenue) a f4 (abajo, junto a la punta)
  const tail = (length, size) => {
    const parts = []
    let done = 0
    for (let k = 1; k <= 4; k++) {
      const count = k === 4 ? length - done : Math.floor(length / 4)
      if (count > 0) {
        parts.push(`<text class="f${k}" y="${done * size}">${word(count)}</text>`)
      }
      done += count
    }
    return parts.join('')
  }
  // cuánto avanza el reloj durante el cambio: la velocidad va de `from` a `to` en línea recta
  const during = ease > 0 ? ((from + to) / 2) * ease : 0
  const drops = []
  let x = 4
  while (x < WIDTH) {
    const size = Math.round(pick(11, 22))
    const streams = rand() < 0.35 ? 3 : rand() < 0.6 ? 2 : 1
    for (let s = 0; s < streams; s++) {
      const length = Math.round(pick(5, 30))
      const span = length * size
      const duration = Number(pick(4, 14).toFixed(1))
      const begin = Number((-pick(0, 14)).toFixed(1))
      const opacity = pick(0.25, 0.95).toFixed(2)
      const blinkAt = Math.floor(pick(0, length - 1))
      const blinks = rand() < 0.3
      const blinkGlyph = blinks ? word(1) : ''
      const blinkDur = blinks ? Number(pick(0.4, 2).toFixed(2)) : 0
      const body = tail(length, size)
      const head = word(1)

      // la gota va de `top` (arriba, escondida) a `bottom` (abajo, escondida), un ciclo cada `duration` a velocidad 1
      const top = -span
      const bottom = HEIGHT + 20
      const travel = bottom - top
      const yAt = time => top + cycle(time, begin, duration) * travel
      let motion = ''
      if (ease > 0) {
        // el cambio: de donde está ahora, `travelled` px en `ease` s; la curva es la de una velocidad en línea recta
        const y0 = yAt(at)
        const travelled = (during / duration) * travel
        const k0 = (2 * from) / (from + to) / 3
        const k1 = 1 - (2 * to) / (from + to) / 3
        motion += `<animateTransform attributeName="transform" type="translate" from="0 ${n(y0)}" to="0 ${n(y0 + travelled)}" dur="${n(ease)}s" calcMode="spline" keyTimes="0;1" keySplines="0.333 ${n(k0)} 0.667 ${n(k1)}" fill="freeze"/>`
      }
      // después, la caída a la nueva velocidad desde donde quedó, dando la vuelta de abajo hacia arriba
      const startAt = at + during
      const y1 = yAt(startAt)
      const turn = n((bottom - y1) / travel)
      const loop = n(duration / to)
      motion += `<animateTransform attributeName="transform" type="translate" values="0 ${n(y1)};0 ${bottom};0 ${top};0 ${n(y1)}" keyTimes="0;${turn};${turn};1" dur="${loop}s" begin="${n(ease)}s" repeatCount="indefinite"/>`

      const blink = blinks
        ? `<text class="b" y="${blinkAt * size}">${blinkGlyph}<animate attributeName="fill" values="${BLINK.join(';')}" calcMode="discrete" dur="${blinkDur}s" repeatCount="indefinite"/></text>`
        : ''
      drops.push(
        `<g transform="translate(${Math.round(x)} 0)" font-size="${size}"><g opacity="${opacity}" transform="translate(0 ${n(yAt(at))})">${motion}${body}${blink}<text class="h" y="${span}">${head}</text></g></g>`,
      )
    }
    x += size + pick(0, 9)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid slice">
<style>
text{font-family:monospace;writing-mode:vertical-rl;text-orientation:upright;fill:#00ff66}
.f1{fill-opacity:.15}
.f2{fill-opacity:.35}
.f3{fill-opacity:.6}
.f4{fill-opacity:.85}
.h{fill:#d8ffe4}
</style>
<rect width="100%" height="100%" fill="#020803"/>
<g opacity="0.85">
${drops.join('\n')}
</g>
</svg>`
}
