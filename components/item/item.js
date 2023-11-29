const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    itemID: {
      type: Number
    },
    editButton: {
      type: Boolean
    },
    selected: {
      type: Boolean
    }
  },
  data: {
    translate: app.globalData.translate
  },
  attached() {
    this.updateData()
  },
  methods: {
    updateData() {
      this.setData({
        item: app.globalData.items[this.data.itemID],
        address: app.globalData.address
      })
    },
    edit() {
      wx.navigateTo({
        url: `/pages/sell/add/add?id=${this.data.itemID}`
      })
    },
    selectItem() {
      this.triggerEvent("selectItem")
    }
  }
})