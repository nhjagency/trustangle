# Client logos

Add a logo by committing an image file here named after the **client id**:

```
tracker/src/logos/<client-id>.png     # or .svg / .jpg / .webp
```

That is the whole process. `index.js` globs this folder at build time, so a
committed file shows up on the client's portfolio card and in the engagement
drawer header with no code change. `nhj.png` also fills the app bar mark and
the hero mark.

Prefer a square-ish image on a transparent or white background. The slot is
40px on the card and 60px in the drawer and fits the whole logo inside
(`object-fit: contain`), so a wide horizontal lockup renders very small — crop
to the symbol where you have one.

A logo dropped onto a slot in the running app is stored in that person's
browser and overrides the committed file for them only. Removing the dropped
image restores the committed one.

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
