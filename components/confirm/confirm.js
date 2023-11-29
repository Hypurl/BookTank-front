const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    translate: app.globalData.translate
  },
  methods: {
    hideConfirmModal(event) {
      if (event.target.id == "gray-area") {
        this.triggerEvent("hideConfirmModal", false)
      } else if (event.target.id == "confirm") {
        this.triggerEvent("hideConfirmModal", true)
      }
    }
  }
})