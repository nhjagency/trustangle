# Client logos

Add a logo by committing an image file here named after the **client id**:

```
tracker/src/logos/<client-id>.png     # or .svg / .jpg / .webp
```

That is the whole process. `index.js` globs this folder at build time, so a
committed file shows up on the client's portfolio card and in the engagement
drawer header with no code change. `nhj.png` also fills the app bar mark and
the hero mark.

A client that has a logo shows it as a **brand bar** across the top of its
card and beside the name in the drawer header, at the logo's natural aspect.
A client without one keeps the square initials tile. Horizontal lockups are
what this is built for, so no cropping is needed; transparent or white
backgrounds work best.

A logo dropped onto a slot in the running app is stored in that person's
browser and overrides the committed file for them only. Removing the dropped
image restores the committed one.

## What is here

19 of the 30 clients have a logo, plus `nhj`. Still missing: `byn`,
`cablink`, `dur`, `eddekhar`, `golfy`, `maqam`, `namir`, `reachvest`,
`sharaka`, `trustangle`.

Two files do not match any client and sit here unused until one is added with
a matching id: `elevate.svg` (Elevate Holding Group) and `khayal.svg` (Khayal
Investment, uploaded as "Khalal"). `wafra.svg` was uploaded as "Wafa"; the
artwork reads Wafra, so it is filed under the Wafra client.

The SVGs are wrappers around embedded PNGs rather than true vector art, which
is why some run to a couple of hundred kB. They are emitted as separate assets
by the build, so they cost nothing until the page loads them.

## Client ids

| id | Client | | id | Client |
| --- | --- | --- | --- | --- |
| `byn` | BYN | | `nowa` | Nowa |
| `cablink` | CabLink | | `qeema` | Qeema |
| `dur` | Dur | | `reachvest` | Reachvest |
| `eddekhar` | Eddekhar | | `reterra` | Reterra |
| `fundraizely` | Fundraizely | | `rmz` | rmz |
| `golfy` | Golfy | | `sharaka` | Sharaka |
| `invest` | Invest In Syria | | `silver` | Silver Foundation |
| `jigsaw` | Jigsaw | | `sukuk` | Sukuk |
| `lynnc` | LYNNC | | `syber` | Syber |
| `maqam` | Maqam | | `tachyon` | Tachyon |
| `marafiq` | Marafiq | | `taqana` | Taqana |
| `mealy` | Mealy | | `techtown` | Techtown |
| `namir` | Namir | | `tcafe` | T-Cafe |
| `nhj` | NHJ (also the app bar and hero mark) | | `trustangle` | trustangle |
| | | | `wafra` | Wafra |
| | | | `wateen` | Wateen |

The ids come from `src/data/portfolio.js`. A new client added there gets a logo
the same way: name the file after its id.
