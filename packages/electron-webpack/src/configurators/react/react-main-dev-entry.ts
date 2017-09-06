import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from "electron-devtools-installer"

// install react-devtools & redux-devtools
require("electron").app.on("ready", () => {
  installExtension(REACT_DEVELOPER_TOOLS)
    .catch(error => {
      console.log("Unable to install `react-devtools`: \n", error)
    })

  installExtension(REDUX_DEVTOOLS)
    .catch(error => {
      console.log("Unable to install `redux-devtools`: \n", error)
    })
})
