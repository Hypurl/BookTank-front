const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    text: {
      type: String
    }
  },
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    translate: app.globalData.translate
  }
})