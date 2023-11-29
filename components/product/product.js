const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    productID: {
      type: Number
    },
    status: {
      type: String
    },
    new: {
      type: Boolean
    },
    chat: {
      type: Boolean
    }
  },
  data: {
    Chinese: app.globalData.Chinese,
    translate: app.globalData.translate
  },
  attached() {
    this.setData({
      product: app.globalData.products[this.data.productID],
      profilePicture: app.globalData.users[app.globalData.products[this.data.productID].seller].profilePicture,
      color: {
        "Reserving": "bg-olive",
        "Canceled": "bg-orange",
        "": ""
      }[this.data.status],
      address: app.globalData.address
    })
  }
})