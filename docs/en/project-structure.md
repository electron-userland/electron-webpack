Be default, following structure is expected:

```
├─ src
│  ├─ main # main process sources
│  │  └─ index.js
│  ├─ renderer # renderer process sources (optional directory)
│  │  └─ index.js
│  ├─ common # common sources (optional directory)
├─ static # static assets (optional directory)
```

Index file expected to be named as `index.js` or `main.js` (`.ts` if [typescript support](./languages-and-frameworks.md#typescript) installed).

Real project example — [electrify](https://github.com/electron-userland/electrify).

But you can configure electron-webpack for any project structure. Please see [Source Directories](./Options.md#source-directories).