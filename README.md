# Matrix

A Matrix look for Claude Code in the desktop and mobile apps: phosphor green on black, with digital rain falling behind
the conversation. The rain falls at full speed while Claude is working (thinking, running commands, writing) and slows
down to a quarter of normal speed when it is your turn, easing between the two speeds instead of jumping.

The terminal and editors draw no looks, so there it does nothing.

## Install

At the prompt of a terminal session:

```
/plugin install matrix --marketplace ericsalinas-p4/matrix-theme
```

Answer `y` to add the marketplace, then pick a scope (the user scope loads it in every session).

From a shell:

```bash
claude plugin install matrix --marketplace ericsalinas-p4/matrix-theme
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with
`ericsalinas-p4/matrix-theme`, then Add plugin.

## Commands

| Command | What it does |
| --- | --- |
| `/matrix` | Says whether Matrix is on or off. |
| `/matrix start` | Turns Matrix on, in this session and the next ones. |
| `/matrix stop` | Turns Matrix off and brings back the app's own look, in this session and the next ones. |
| `/matrix speed` | Says how fast the rain falls while Claude works. |
| `/matrix speed slow\|normal\|fast\|ultra` | 0.6, 1, 1.8 or 3 times normal speed while Claude works (normal by default). |

Your choices are kept on each computer.
