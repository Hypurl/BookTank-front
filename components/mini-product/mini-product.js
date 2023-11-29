const app = getApp()
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    productID: {
      type: Number
    }
  },
  data: {
    translate: app.globalData.translate
  },
  attached() {
    this.setData({
      product: app.globalData.products[this.data.productID],
      address: app.globalData.address
    })
  }
})