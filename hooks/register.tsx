import type { Hook, Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { rain } from './rain.js'

// Verde fósforo sobre negro: un look solo oscuro, con los grises teñidos de verde.
const { theme, problems } = makeColors({
  label: 'Matrix',
  only: 'dark',
  roles: { accent: '#00ff66', danger: '#ff4d4d', success: '#39ff14', warning: '#d4ff3a', pro: '#3affd2' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#020803',
        // las tarjetas casi del color del fondo: la zona del mensaje se pinta con ellas, y un verde más fuerte se veía
        // como una franja sobre la lluvia
        'surface-1': '#040b06',
        'surface-2': '#081409',
        'surface-3': '#0b1a0e',
        'text-primary': '#b8ffc8',
        'text-secondary': '#6cf28f',
        'text-muted': '#3fae5f',
      },
    },
    git: { added: '#39ff14', removed: '#ff4d4d', modified: '#d4ff3a' },
  },
})

// La lluvia cae a la velocidad que escojas (`/matrix speed`) mientras Claude trabaja, y lenta cuando te toca a ti. Al
// cambiar, cada gota frena o acelera desde donde iba. El reloj de la lluvia (`at`, segundos a velocidad normal) se
// cuenta en cada cambio: hasta `since` iba en `at`, y desde ahí la velocidad pasó de `from` a `rate` en `ease` segundos.
const RESTING = 0.25
const SPEEDS: Readonly<Record<string, number>> = { slow: 0.6, normal: 1, fast: 1.8, ultra: 3 }
const TO_WORK = 1
const TO_REST = 1.5

let at = 0
let since: number | undefined
let from = RESTING
let rate = RESTING
let ease = 0
let working = false
let workingRate = SPEEDS.normal ?? 1
let scene = rain({ at: 0, from: RESTING, to: RESTING, ease: 0 })

const LOOK: ThemeSetArgs = {
  colors: theme,
  // un velo oscuro con un poco de desenfoque sobre la lluvia, para que las palabras se lean primero
  backdrop: { scene: 'matrix-rain', glass: { blur: 4, tint: '#020803', opacity: 0.5 } },
}

/** `/matrix stop` lo apaga en esta sesión y en las siguientes, hasta un `/matrix start`. */
const OFF = 'off'
/** La velocidad de trabajo que escogiste con `/matrix speed`, para las siguientes sesiones. */
const SPEED = 'speed'

/** Cambia la velocidad de la lluvia sin que salte: suma lo caído hasta ahora y dibuja el cambio desde ahí. */
async function speed($: Parameters<Hook<'turn.start'>>[0], to: number, seconds: number): Promise<void> {
  const now = await $.clock.now()
  if (since !== undefined) {
    const elapsed = (now - since) / 1000
    at +=
      elapsed < ease
        ? ((from + rate) / 2) * elapsed
        : ((from + rate) / 2) * ease + rate * (elapsed - ease)
  }
  since = now
  if (to === rate) {
    return
  }
  scene = rain({ at, from: rate, to, ease: seconds })
  from = rate
  rate = to
  ease = seconds
  $.ui.invalidate('ui.render')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'matrix',
      description: 'Prende o apaga el look Matrix, o cambia lo rápido que cae la lluvia mientras Claude trabaja',
      argumentHint: 'start | stop | speed slow|normal|fast|ultra',
    })
    since = await $.clock.now()
    const saved = await $.store.get(SPEED)
    if (typeof saved === 'string' && SPEEDS[saved] !== undefined) {
      workingRate = SPEEDS[saved]
    }
    // borra el aviso que dejaba una versión anterior en la barra de abajo
    $.ui.status(undefined)
    if ((await $.store.get(OFF)) !== true) {
      const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
      if (unpainted !== undefined) {
        $.ui.toast(unpainted)
      }
      await $.theme.set(LOOK)
    }
    return next(e)
  })

  on('command.run', { command: 'matrix' }, async ($, e) => {
    const [word = '', value = ''] = e.args.trim().toLowerCase().split(/\s+/)
    if (word === 'stop') {
      await $.store.set(OFF, true)
      await $.theme.clear()
      return { text: 'Matrix apagado, en esta y en las siguientes sesiones. Lo prendes con /matrix start.' }
    }
    if (word === 'start') {
      await $.store.set(OFF, false)
      await $.theme.set(LOOK)
      $.ui.invalidate('ui.render')
      return { text: 'Matrix prendido.' }
    }
    if (word === 'speed') {
      const names = Object.keys(SPEEDS).join(', ')
      const chosen = SPEEDS[value]
      if (chosen === undefined) {
        const current = Object.keys(SPEEDS).find(name => SPEEDS[name] === workingRate) ?? 'normal'
        return { text: `La lluvia cae en «${current}» mientras trabajo. Escoge una: ${names}.` }
      }
      workingRate = chosen
      await $.store.set(SPEED, value)
      if (working) {
        await speed($, workingRate, TO_WORK)
      }
      return { text: `Mientras trabajo, la lluvia cae en «${value}».` }
    }
    const isOff = (await $.store.get(OFF)) === true
    return {
      text: `Matrix está ${isOff ? 'apagado' : 'prendido'}. Usa /matrix start, /matrix stop o /matrix speed slow|normal|fast|ultra.`,
    }
  })

  // solo los turnos de la conversación principal, no los de un subagente
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      working = true
      await speed($, workingRate, TO_WORK)
    }
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      working = false
      await speed($, RESTING, TO_REST)
    }
    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || (await $.store.get(OFF)) === true) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    return <Svg source={scene} alt="Lluvia de caracteres verdes que caen sobre fondo negro" isInteractive />
  })
}
